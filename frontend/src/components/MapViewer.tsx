// MapViewer.tsx
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

interface MapViewerProps {
    geoJsonData: GeoJSON.FeatureCollection;
    bounds?: L.LatLngBoundsExpression;
    startMarker?: L.LatLng | null;
    endMarker?: L.LatLng | null;
}


const startIcon = L.divIcon({
    className: 'custom-marker', // 用于 CSS 样式控制
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.3 1.3 0 0 0-.37.265.3.3 0 0 0-.057.09V14l.002.008.016.033a.6.6 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.6.6 0 0 0 .146-.15l.015-.033L12 14v-.004a.3.3 0 0 0-.057-.09 1.3 1.3 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465s-2.462-.172-3.34-.465c-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411"/>
</svg>`,
    iconSize: [50, 50], // 图标显示区域大小
    iconAnchor: [25, 50] // 调整锚点位置（水平居中，底部对齐）
});

const endIcon = L.divIcon({
    className: 'custom-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.3 1.3 0 0 0-.37.265.3.3 0 0 0-.057.09V14l.002.008.016.033a.6.6 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.6.6 0 0 0 .146-.15l.015-.033L12 14v-.004a.3.3 0 0 0-.057-.09 1.3 1.3 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465s-2.462-.172-3.34-.465c-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411"/>
</svg>`, 
    iconSize: [50, 50],
    iconAnchor: [25, 50]
});

// 自动调整地图视角的组件
function FitBounds({ bounds }: { bounds?: L.LatLngBoundsExpression }) {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, {
                padding: [50, 50], // 增加50px的边界缓冲
                animate: false
            });
        }
    }, [bounds, map]);

    return null;
}

export default function MapViewer({ geoJsonData, bounds, startMarker, endMarker }: MapViewerProps) {
    return (
        <MapContainer
            bounds={bounds}
            style={{ height: '100%', width: '100%' }}
            zoomSnap={0.5}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <GeoJSON
                data={geoJsonData}
                style={() => ({
                    color: '#e74c3c',
                    weight: 4,
                    opacity: 0.8
                })}
            />
            {/* 新增起点标注 */}
            {startMarker && (
                <Marker position={startMarker} icon={startIcon}>
                    <Popup>
                        <strong>每天的初始位置</strong><br />
                        坐标: {startMarker.lat.toFixed(5)}, {startMarker.lng.toFixed(5)}
                    </Popup>
                </Marker>
            )}

            {/* 新增终点标注 */}
            {endMarker && (
                <Marker position={endMarker} icon={endIcon}>
                    <Popup>
                        <strong>最新位置</strong><br />
                        坐标: {endMarker.lat.toFixed(5)}, {endMarker.lng.toFixed(5)}
                    </Popup>
                </Marker>
            )}

            <FitBounds bounds={bounds} />
        </MapContainer>
    );
}