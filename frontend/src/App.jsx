import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthView } from "./views/AuthView";
import { DashboardView } from "./views/DashboardView";
import { ProductView } from "./views/ProductView";
import { CustomerView } from "./views/CustomerView";
import { OrderView } from "./views/OrderView";
import { ProfileView } from "./views/ProfileView";

import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  LogOut, 
  User 
} from "lucide-react";

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main layout for authenticated users
const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Map pathnames to beautiful page titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
      case "/dashboard":
        return "Dashboard Overview";
      case "/products":
        return "Products Inventory";
      case "/customers":
        return "Customers Directory";
      case "/orders":
        return "Orders Management";
      case "/profile":
        return "My Profile";
      default:
        return "CartFlow Manager";
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">CF</div>
          <h1 className="brand-name">
            CartFlow<span className="brand-dot">.</span>
          </h1>
        </div>

        <ul className="nav-list">
          <li>
            <NavLink to="/dashboard" className={({ active }) => `nav-link ${active ? "active" : ""}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" className={({ active }) => `nav-link ${active ? "active" : ""}`}>
              <Package size={20} />
              <span>Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/customers" className={({ active }) => `nav-link ${active ? "active" : ""}`}>
              <Users size={20} />
              <span>Customers</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/orders" className={({ active }) => `nav-link ${active ? "active" : ""}`}>
              <ShoppingBag size={20} />
              <span>Orders</span>
            </NavLink>
          </li>
        </ul>

        {/* Sidebar Footer Profiles */}
        <div className="sidebar-footer">
          <NavLink to="/profile" className="user-profile-link">
            <div className="user-profile">
              <div className="avatar">
                <User size={18} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || "System Admin"}</span>
                <span className="user-status">Online</span>
              </div>
            </div>
          </NavLink>
          
          <button className="btn-logout" onClick={logout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </nav>

      {/* Main content wrapper */}
      <div className="main-wrapper">
        <header className="header">
          <h2 className="page-title">{getPageTitle()}</h2>
          <div style={{ color: "var(--text-main)", fontSize: "0.95rem", fontWeight: "600" }}>
            {user?.name}
          </div>
        </header>

        <main className="content-container">
          <Routes>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/products" element={<ProductView />} />
            <Route path="/customers" element={<CustomerView />} />
            <Route path="/orders" element={<OrderView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Global App Wrapper holding Auth Context
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleAuthExpired = () => {
      // Session expired, redirect to login
      window.location.href = "/login";
    };
    window.addEventListener("auth_expired", handleAuthExpired);
    return () => window.removeEventListener("auth_expired", handleAuthExpired);
  }, []);

  return (
    <Routes>
      {/* Auth View */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthView />} 
      />

      {/* Application Layout Guard */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
