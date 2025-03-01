// MapViewer.tsx
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

interface MapViewerProps {
    geoJsonData: GeoJSON.FeatureCollection;
    bounds?: L.LatLngBoundsExpression;
}

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

export default function MapViewer({ geoJsonData, bounds }: MapViewerProps) {
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

            <FitBounds bounds={bounds} />
        </MapContainer>
    );
}