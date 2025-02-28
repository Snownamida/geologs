import 'leaflet/dist/leaflet.css';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

interface MapViewerProps {
    geoJsonData: GeoJSON.FeatureCollection | null;
}

export default function MapViewer({ geoJsonData }: MapViewerProps) {
    return (
        <MapContainer
            center={[35.6895, 139.6917]} // 默认东京坐标
            zoom={13}
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {geoJsonData && <GeoJSON data={geoJsonData} />}
        </MapContainer>
    );
}