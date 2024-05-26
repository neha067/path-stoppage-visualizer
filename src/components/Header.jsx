import React from "react";
import styles from "./Header.module.css";
import logo from "../assets/logo.jpg";
const Header = () => {
  return (
    <>
      <div className={styles.headerContainer}>
        <h3>Vehicle Stoppage Tracking</h3>
      </div>
    </>
  );
};

export default Header;
