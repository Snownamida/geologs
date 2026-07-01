// App.tsx
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import MapViewer from './components/MapViewer';
import { formatDistance, parseGpxString, type Track } from './lib/gpx';

/** 每条轨迹的显示颜色（循环使用） */
const TRACK_COLORS = [
  '#e74c3c',
  '#2980b9',
  '#27ae60',
  '#8e44ad',
  '#e67e22',
  '#16a085',
];

const REMOTE_TRACK_URL = '/files/gpx/1.gpx';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  // 加载默认的远程轨迹（作者的最新记录）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(REMOTE_TRACK_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const parsed = parseGpxString(text, '最新轨迹');
        if (!cancelled && parsed.length > 0) setTracks(parsed);
      } catch {
        if (!cancelled) {
          setNotice('默认轨迹加载失败 — 你仍然可以拖入本地 GPX 文件查看');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 解析本地文件（完全在浏览器内完成，不会上传）
  const addFiles = useCallback(async (files: Iterable<File>) => {
    const added: Track[] = [];
    const errors: string[] = [];
    for (const file of files) {
      if (!/\.gpx$/i.test(file.name)) {
        errors.push(`${file.name}：仅支持 .gpx 文件`);
        continue;
      }
      try {
        const text = await file.text();
        const parsed = parseGpxString(text, file.name.replace(/\.gpx$/i, ''));
        if (parsed.length === 0) throw new Error('未找到有效轨迹数据');
        added.push(...parsed);
      } catch (err) {
        errors.push(
          `${file.name}：${err instanceof Error ? err.message : '解析失败'}`
        );
      }
    }
    if (added.length > 0) setTracks(prev => [...prev, ...added]);
    setNotice(errors.join('；'));
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragActive(false);
    }
  }, []);

  return (
    <div
      className="app-container"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <header className="app-header">
        <div className="app-title">
          <h1>Geologs</h1>
          <p className="app-subtitle">GPX 轨迹查看器</p>
        </div>
        <div className="app-actions">
          <button
            type="button"
            className="btn-open"
            onClick={() => fileInputRef.current?.click()}
            title="本地解析，不会上传任何数据"
          >
            <i className="bi bi-folder2-open" aria-hidden="true" /> 打开 GPX
          </button>
          <a
            className="kofi-link"
            href="https://ko-fi.com/snownamida"
            target="_blank"
            rel="noopener noreferrer"
            title="请作者喝杯咖啡"
          >
            ☕ 支持
          </a>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          multiple
          hidden
          onChange={e => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </header>

      {tracks.length > 0 && (
        <div className="track-bar" role="list">
          {tracks.map((t, i) => (
            <span
              className="track-chip"
              role="listitem"
              key={t.id}
              style={{ borderColor: TRACK_COLORS[i % TRACK_COLORS.length] }}
            >
              <span
                className="track-dot"
                style={{
                  backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length],
                }}
              />
              {t.name} · {formatDistance(t.distanceKm)}
              <button
                type="button"
                className="track-remove"
                aria-label={`移除轨迹 ${t.name}`}
                onClick={() => removeTrack(t.id)}
              >
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <main className="map-container">
        <MapViewer tracks={tracks} colors={TRACK_COLORS} />

        {loading && <div className="status loading">地图加载中...</div>}

        {!loading && tracks.length === 0 && (
          <div className="status empty-hint">
            <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
            <p>
              将 GPX 文件拖到此处，或点击「打开 GPX」
              <br />
              <small>文件在浏览器本地解析，不会被上传</small>
            </p>
          </div>
        )}

        {notice && (
          <div className="status notice" onClick={() => setNotice('')}>
            {notice}
          </div>
        )}

        {dragActive && (
          <div className="drop-overlay">
            <div className="drop-overlay-inner">
              <i className="bi bi-file-earmark-arrow-down" aria-hidden="true" />
              <p>松开以查看 GPX 轨迹（本地解析，不上传）</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
