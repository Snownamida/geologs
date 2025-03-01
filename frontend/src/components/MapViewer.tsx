// MapViewer.tsx
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import "./MapViewer.css";

interface MapViewerProps {
    geoJsonData: GeoJSON.FeatureCollection;
    bounds?: L.LatLngBoundsExpression;
    startMarker?: L.LatLng | null;
    endMarker?: L.LatLng | null;
}


const startIcon = L.divIcon({
    className: 'custom-marker',
    html: `<i class="bi bi-geo marker" style="font-size: 32px; color: #FF5722;"></i>`,
    iconSize: [32, 32],        // 调整为实际需要的大小
    iconAnchor: [16, 32]       // 水平居中（宽度的一半），底部对齐
});

const endIcon = L.divIcon({
    className: 'custom-marker',
    html: `<i class="bi bi-geo-fill marker" style="font-size: 32px; color: #4CAF50;"></i>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
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
                url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
                attribution='&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, © <a href="https://carto.com/about-carto/">rastertiles/voyager</a>'
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