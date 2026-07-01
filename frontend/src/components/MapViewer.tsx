// MapViewer.tsx
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import {
  formatDistance,
  formatDuration,
  type LatLngTuple,
  type Track,
} from '../lib/gpx';
import './MapViewer.css';

interface MapViewerProps {
  tracks: Track[];
  colors: string[];
}

const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `<i class="bi bi-geo marker" style="font-size: 32px; color: #FF5722;"></i>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const endIcon = L.divIcon({
  className: 'custom-marker',
  html: `<i class="bi bi-geo-fill marker" style="font-size: 32px; color: #4CAF50;"></i>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function computeBounds(tracks: Track[]): L.LatLngBounds | null {
  let bounds: L.LatLngBounds | null = null;
  for (const track of tracks) {
    for (const segment of track.segments) {
      for (const point of segment) {
        if (bounds) bounds.extend(point);
        else bounds = L.latLngBounds(point, point);
      }
    }
  }
  return bounds;
}

// 轨迹变化时自动调整视野
function FitBounds({ tracks }: { tracks: Track[] }) {
  const map = useMap();
  const boundsKey = tracks.map(t => t.id).join(',');

  useEffect(() => {
    const bounds = computeBounds(tracks);
    if (bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    // boundsKey 代表轨迹集合的变化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, map]);

  return null;
}

function TrackLayer({ track, color }: { track: Track; color: string }) {
  const dateLabel = track.startTime
    ? track.startTime.toLocaleDateString('zh-CN')
    : null;
  const duration = formatDuration(track.startTime, track.endTime);

  return (
    <>
      <Polyline
        positions={track.segments}
        pathOptions={{ color, weight: 4, opacity: 0.85 }}
      >
        <Tooltip sticky>
          <strong>{track.name}</strong>
          <br />
          距离：{formatDistance(track.distanceKm)}
          {duration && (
            <>
              <br />
              时长：{duration}
            </>
          )}
          {dateLabel && (
            <>
              <br />
              日期：{dateLabel}
            </>
          )}
        </Tooltip>
      </Polyline>

      {track.start && (
        <Marker position={track.start} icon={startIcon}>
          <Popup>
            <strong>{track.name} — 起点</strong>
            <br />
            坐标：{track.start[0].toFixed(5)}, {track.start[1].toFixed(5)}
            {track.startTime && (
              <>
                <br />
                时间：{track.startTime.toLocaleString('zh-CN')}
              </>
            )}
          </Popup>
        </Marker>
      )}

      {track.end && (
        <Marker position={track.end} icon={endIcon}>
          <Popup>
            <strong>{track.name} — 终点</strong>
            <br />
            坐标：{track.end[0].toFixed(5)}, {track.end[1].toFixed(5)}
            {track.endTime && (
              <>
                <br />
                时间：{track.endTime.toLocaleString('zh-CN')}
              </>
            )}
          </Popup>
        </Marker>
      )}
    </>
  );
}

const DEFAULT_CENTER: LatLngTuple = [30, 10];
const DEFAULT_ZOOM = 3;

export default function MapViewer({ tracks, colors }: MapViewerProps) {
  const initialBounds = useMemo(() => computeBounds(tracks), [tracks]);

  return (
    <MapContainer
      center={initialBounds?.getCenter() ?? DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      zoomSnap={0.5}
      preferCanvas
    >
      <TileLayer
        url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>'
      />

      {tracks.map((track, i) => (
        <TrackLayer
          key={track.id}
          track={track}
          color={colors[i % colors.length]}
        />
      ))}

      <ScaleControl position="bottomleft" imperial={false} />
      <FitBounds tracks={tracks} />
    </MapContainer>
  );
}
