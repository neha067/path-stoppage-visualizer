import React, { useState, useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  Tooltip,
} from "react-leaflet";
import osm from "./osm-providers";
import styles from "./Map.module.css";
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
  const [center, setCenter] = useState({ lat: 12.9294916, lng: 74.9173533 });
  const [zoom, setZoom] = useState(11);
  const [path, setPath] = useState([]);
  const [movingIconPosition, setmovingIconPosition] = useState([
    13.084622, 80.248357,
  ]);
  const [stops, setStops] = useState([]);
  const [tooltipContent, setTooltipContent] = useState("");

  const [threshold, setThreshold] = useState(0);

  const handleInputChange = (event) => {
    if (isNaN(Number(event.target.value))) {
      return;
    }
    setThreshold(event.target.value);
    setPath([]);
    setStops([]);
    setmovingIconPosition([13.084622, 80.248357]);
    console.log("Threshold", threshold);
  };

  {
    path.length > 0 && <Polyline positions={path} color="red" />;
  }

  useEffect(() => {
    if (
      Number(threshold) === 0 ||
      threshold === "" ||
      Number(threshold) === NaN
    ) {
      setmovingIconPosition([13.084622, 80.248357]);
      setPath([]);
      setStops([]);
    }
  }, [threshold]);

  useEffect(() => {
    const data = require("../assets/csvjson.json");
    const parsedPath = data.map((item) => [item.latitude, item.longitude]);
    setPath(parsedPath);

    // Sort data by eventGeneratedTime
    const sortedData = [...data].sort(
      (a, b) => a.eventGeneratedTime - b.eventGeneratedTime
    );

    const stoppages = [];
    const thresholdCheck = Number(threshold) * 60 * 1000;
    let i = 0;
    while (i < sortedData.length - 1) {
      if (sortedData[i].speed === 0) {
        // Find the next data point where the speed is not 0
        let j = i + 1;
        while (j < sortedData.length && sortedData[j].speed === 0) {
          j++;
        }

        // If we found a data point where the speed is not 0
        if (j < sortedData.length) {
          // Calculate the waiting time
          const waitingTime =
            sortedData[j].eventGeneratedTime - sortedData[i].eventGeneratedTime;

          // Check if the waiting time exceeds the stoppage threshold
          if (waitingTime > thresholdCheck) {
            // Add the waiting time to the stop
            const stop = {
              ...sortedData[i],
              waitingTime,
            };

            stoppages.push(stop);
          }

          // Start the next iteration from the new stop
          i = j;
        } else {
          // If we didn't find a data point where the speed is not 0, break the loop
          break;
        }
      } else {
        i++;
      }
    }

    setStops(stoppages);
  }, [threshold]);

  // Move marker along the path
  useEffect(() => {
    let interval;

    const moveMarker = () => {
      if (path.length > 0) {
        const nextPosition = path.shift();
        setmovingIconPosition(nextPosition);
        setPath(path);

        // Check if the next position is a stop
        if (
          stops.some(
            (stop) =>
              stop.latitude === nextPosition[0] &&
              stop.longitude === nextPosition[1]
          )
        ) {
          const stopInfo = stops.find(
            (stop) =>
              stop.latitude === nextPosition[0] &&
              stop.longitude === nextPosition[1]
          );
          setTooltipContent(`${stopInfo.EquipmentId}`);
          clearInterval(interval); // Clear the interval
          setTimeout(() => {
            interval = setInterval(moveMarker, 100); // Restart the interval after a minute
          }, 1000);
        }
      }
    };

    interval = setInterval(moveMarker, 10); // Move every second

    return () => clearInterval(interval);
  }, [path, stops]);

  return (
    <>
      <div>
        <div className={styles.container}>
          <div className={styles.threshold}>
            <h1>Threshold (in minutes):</h1>
            <div>
              <input
                type="number"
                value={threshold}
                onChange={handleInputChange}
                placeholder="Enter the threshold value"
              />
            </div>
          </div>
        </div>
        <div className="leaflet-container">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{
              height: "60vh",
              width: "94%",
              margin: "3rem 3rem 3rem 3rem",
            }}
          >
            <TileLayer
              url={osm.maptiler.url}
              attribution={osm.maptiler.attribution}
            />
            <Polyline positions={path} color="red" />
            {movingIconPosition && (
              <Marker position={movingIconPosition} icon={movingIcon}>
                <Tooltip permanent>{tooltipContent}</Tooltip>
              </Marker>
            )}
            {stops.map((stop, index, array) => {
              const previousStop = array[index - 1];
              const stoppageDuration = previousStop
                ? (stop.eventGeneratedTime - previousStop.eventGeneratedTime) /
                  60000
                : 0;

              return (
                <Marker
                  key={index}
                  position={[stop.latitude, stop.longitude]}
                  icon={stopIcon}
                >
                  <Popup>
                    Equipment ID: {stop.EquipmentId}
                    <br />
                    Reach Time:{" "}
                    {new Date(stop.eventGeneratedTime).toLocaleString()}
                    <br />
                    End Time:{" "}
                    {new Date(
                      stop.eventGeneratedTime + stoppageDuration * 60000
                    ).toLocaleString()}
                    <br />
                    Stoppage Duration: {stoppageDuration} minutes
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MapComponent;
