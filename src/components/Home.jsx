import React from "react";
import { Map, TileLayer } from "leaflet";
import MapComponent from "./Map";
import Header from "./Header";

const Home = () => {
  return (
    <>
      <Header />
      <MapComponent />
    </>
  );
};
export default Home;
