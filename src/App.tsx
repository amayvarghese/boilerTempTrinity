/** @format */

import { useState } from "react";
import { BrowserRouter as Router, Routes, Link, Route } from "react-router-dom";
import Home from "./Pages/Home";
import BaseLayout from "./components/Layouts/BaseLayout";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route element={<BaseLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
