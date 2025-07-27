import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import DashboardSupplier from "./pages/DashboardSupplier";
import DashboardVendor from "./pages/DashboardVendor";
import GroupOrderPage from "./pages/GroupOrderPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import RegisterPage from "./pages/RegisterPage";
import ReviewPage from "./pages/ReviewPage";
import SupplierListPage from "./pages/SupplierListPage";

import Footer from "./components/Footer";
import Header from "./components/Header";

import './App.css';
import './styles/shared.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <LandingPage />
            </>
          }
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route
          path="/dashboard-vendor"
          element={<DashboardVendor />}
        />
        <Route
          path="/dashboard-supplier"
          element={<DashboardSupplier />}
        />
        <Route
          path="/group-orders"
          element={<GroupOrderPage />}
        />
        <Route
          path="/suppliers"
          element={<SupplierListPage />}
        />
        <Route
          path="/track-order"
          element={<OrderTrackingPage />}
        />
        <Route
          path="/review"
          element={<ReviewPage />}
        />
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Router>
  );
}

export default App;
