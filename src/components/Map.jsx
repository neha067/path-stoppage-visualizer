import React, { useState, useEffect } from "react";
import { MapContainer, Marker, TileLayer, Polyline } from "react-leaflet";
import osm from "./osm-providers";
import "./Map.module.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Papa from "papaparse";
import "react-leaflet-markercluster/dist/styles.min.css";

const movingIcon = new L.Icon({
  iconUrl: require("../assets/icon.webp"),
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
});

const stopIcon = new L.Icon({
  iconUrl: require("../assets/checkpoint.png"),
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
});

const MapComponent = () => {
  const [center, setCenter] = useState({ lat: 13.084622, lng: 80.248357 });
  const [zoom, setZoom] = useState(10);
  const [path, setPath] = useState([]);
  const [markerPosition, setMarkerPosition] = useState([13.084622, 80.248357]);
  const [stops, setStops] = useState([]);

  {
    path.length > 0 && <Polyline positions={path} color="red" />;
  }

  useEffect(() => {
    const data = require("../assets/csvjson.json");
    const parsedPath = data.map((item) => [item.latitude, item.longitude]);
    setPath(parsedPath);
    const stopLocations = data.filter((item) => item.speed === 0);
    setStops(stopLocations);
  }, []);

  // Move marker along the path
  useEffect(() => {
    const interval = setInterval(() => {
      if (path.length > 0) {
        setMarkerPosition(path.shift());
        setPath(path);
      }
    }, 100); // Move every second

    return () => clearInterval(interval);
  }, [path]);

  return (
    <div className="leaflet-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url={osm.maptiler.url}
          attribution={osm.maptiler.attribution}
        />
        <Polyline positions={path} color="red" />
        {markerPosition && (
          <Marker position={markerPosition} icon={movingIcon} />
        )}
        {stops.map((stop, index) => (
          <Marker
            key={index}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
