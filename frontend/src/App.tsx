import { gpx } from '@tmcw/togeojson';
import axios from 'axios';
import { useEffect, useState } from 'react';
import MapViewer from './components/MapViewer';

export default function App() {
  const [geoJsonData, setGeoJsonData] =
    useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    const loadGPX = async () => {
      try {
        const response = await axios.get('/files/gpx/1.gpx');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, 'text/xml');
        const convertedData = gpx(xmlDoc);
        setGeoJsonData(convertedData);
      } catch (error) {
        console.error('Error loading GPX:', error);
      }
    };
    loadGPX();
  }, []);

  return (
    <div>
      <h1>GPX轨迹查看器</h1>
      {geoJsonData ? (
        <MapViewer geoJsonData={geoJsonData} />
      ) : (
        <div>加载中...</div>
      )}
    </div>
  );
}