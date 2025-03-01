// App.tsx
import { gpx } from '@tmcw/togeojson';
import axios from 'axios';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import './App.css'; // 新增样式文件
import MapViewer from './components/MapViewer';

export default function App() {
  const [geoJsonData, setGeoJsonData] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression>();
  const [startMarker, setStartMarker] = useState<L.LatLng | null>(null);
  const [endMarker, setEndMarker] = useState<L.LatLng | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGPX = async () => {
      try {
        const response = await axios.get('/files/gpx/1.gpx');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, 'text/xml');

        // 校验GPX有效性
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
          throw new Error('无效的GPX文件格式');
        }

        const convertedData = gpx(xmlDoc);

        // 计算轨迹边界
        const coordinates = convertedData.features.flatMap(f =>
          f.geometry.type === 'LineString'
            ? f.geometry.coordinates
            : []
        );

        if (coordinates.length === 0) {
          throw new Error('未找到有效轨迹数据');
        }

        const latLngs = coordinates.map(([lng, lat]) => L.latLng(lat, lng));
        const newBounds = latLngs.reduce((acc: L.LatLngBounds, coord: L.LatLng) => {
          return acc.extend(coord);
        }, new L.LatLngBounds(latLngs[0], latLngs[0]));

        setGeoJsonData(convertedData);
        setBounds(newBounds);

        // 计算起始位置
        let startPoint: L.LatLng | null = null;
        let endPoint: L.LatLng | null = null;

        convertedData.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates;
            if (coords.length > 0) {
              // GPX坐标格式为 [经度, 纬度]，需要转换为LatLng的[纬度, 经度]
              startPoint = L.latLng(coords[0][1], coords[0][0]);
              endPoint = L.latLng(coords[coords.length - 1][1], coords[coords.length - 1][0]);
            }
          }
        });
        setStartMarker(startPoint);
        setEndMarker(endPoint);


      } catch (err) {
        setError(err instanceof Error ? err.message : '加载轨迹失败');
      }
    };

    loadGPX();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GPX轨迹查看器</h1>
      </header>

      <main className="map-container">
        {error ? (
          <div className="error-message">{error}</div>
        ) : geoJsonData ? (
          <MapViewer
            geoJsonData={geoJsonData}
            bounds={bounds}
            key={JSON.stringify(bounds)} // 强制重新渲染地图
            startMarker={startMarker}
            endMarker={endMarker}
          />
        ) : (
          <div className="loading">地图加载中...</div>
        )}
      </main>
    </div>
  );
}