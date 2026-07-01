// gpx.ts — GPX 解析、距离统计与轨迹抽稀（全部在浏览器本地完成，不上传任何数据）
import { gpx } from '@tmcw/togeojson';

export type LatLngTuple = [number, number];

export interface Track {
  id: string;
  name: string;
  /** 用于渲染的轨迹段（已按需抽稀），[lat, lng] */
  segments: LatLngTuple[][];
  /** 原始轨迹点数 */
  pointCount: number;
  distanceKm: number;
  startTime?: Date;
  endTime?: Date;
  start?: LatLngTuple;
  end?: LatLngTuple;
}

const EARTH_RADIUS_M = 6371000;

/** 两点间大圆距离（米） */
export function haversineM(a: LatLngTuple, b: LatLngTuple): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

function segmentDistanceM(seg: LatLngTuple[]): number {
  let d = 0;
  for (let i = 1; i < seg.length; i++) d += haversineM(seg[i - 1], seg[i]);
  return d;
}

/** 点到线段的垂直距离（度，平面近似，仅用于抽稀） */
function perpendicularDistance(
  p: LatLngTuple,
  a: LatLngTuple,
  b: LatLngTuple
): number {
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[1] - a[1]) * dx + (p[0] - a[0]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dy), p[1] - (a[1] + t * dx));
}

/**
 * Douglas–Peucker 抽稀（迭代实现，避免大轨迹递归爆栈）。
 * tolerance 单位为度，约 1e-5 度 ≈ 1 米。
 */
export function douglasPeucker(
  points: LatLngTuple[],
  tolerance: number
): LatLngTuple[] {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = perpendicularDistance(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index !== -1 && maxDist > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  const out: LatLngTuple[] = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/** 超过该点数才进行渲染抽稀（统计仍基于全量点） */
export const SIMPLIFY_THRESHOLD = 2000;
/** 约 2 米的容差，肉眼几乎无损 */
export const SIMPLIFY_TOLERANCE_DEG = 2e-5;

let trackCounter = 0;

/** 从 GPX 文本解析出轨迹列表。解析失败时抛出 Error。 */
export function parseGpxString(text: string, fallbackName: string): Track[] {
  const xml = new DOMParser().parseFromString(text, 'text/xml');
  if (xml.getElementsByTagName('parsererror').length > 0) {
    throw new Error('无效的 GPX 文件格式');
  }
  const geo = gpx(xml);
  const tracks: Track[] = [];

  for (const feature of geo.features) {
    const geom = feature.geometry;
    let rawSegments: number[][][];
    let rawTimes: string[][] = [];

    const coordProps = (
      feature.properties as {
        coordinateProperties?: { times?: string[] | string[][] };
      } | null
    )?.coordinateProperties;

    if (geom.type === 'LineString') {
      rawSegments = [geom.coordinates];
      if (coordProps?.times) rawTimes = [coordProps.times as string[]];
    } else if (geom.type === 'MultiLineString') {
      rawSegments = geom.coordinates;
      if (coordProps?.times) rawTimes = coordProps.times as string[][];
    } else {
      continue;
    }

    const fullSegments = rawSegments
      .map(seg => seg.map(([lng, lat]) => [lat, lng] as LatLngTuple))
      .filter(seg => seg.length > 1);
    if (fullSegments.length === 0) continue;

    const pointCount = fullSegments.reduce((n, s) => n + s.length, 0);
    const distanceKm =
      fullSegments.reduce((d, s) => d + segmentDistanceM(s), 0) / 1000;

    const segments =
      pointCount > SIMPLIFY_THRESHOLD
        ? fullSegments.map(s => douglasPeucker(s, SIMPLIFY_TOLERANCE_DEG))
        : fullSegments;

    const timeStrings = rawTimes.flat().filter(Boolean);
    const startTime = timeStrings.length
      ? new Date(timeStrings[0])
      : undefined;
    const endTime = timeStrings.length
      ? new Date(timeStrings[timeStrings.length - 1])
      : undefined;

    const firstSeg = fullSegments[0];
    const lastSeg = fullSegments[fullSegments.length - 1];

    tracks.push({
      id: `track-${++trackCounter}`,
      name:
        (feature.properties as { name?: string } | null)?.name || fallbackName,
      segments,
      pointCount,
      distanceKm,
      startTime:
        startTime && !Number.isNaN(startTime.getTime()) ? startTime : undefined,
      endTime: endTime && !Number.isNaN(endTime.getTime()) ? endTime : undefined,
      start: firstSeg[0],
      end: lastSeg[lastSeg.length - 1],
    });
  }

  return tracks;
}

/** 人类可读的距离 */
export function formatDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

/** 人类可读的时长 */
export function formatDuration(start?: Date, end?: Date): string | null {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return null;
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} 小时 ${m} 分钟` : `${m} 分钟`;
}
