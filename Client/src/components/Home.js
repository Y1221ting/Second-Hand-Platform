import React from "react";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import ProductsList from "./Home/index";

const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <ProductsList />
      </main>
      <Footer />
    </>
  );
};

export default Home;
