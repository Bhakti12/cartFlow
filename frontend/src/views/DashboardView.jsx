import React, { useState, useEffect } from "react";
import { apiCall } from "../services/api";
import { Package, Users, ShoppingBag, AlertTriangle, RefreshCw } from "lucide-react";

export const DashboardView = () => {
  const [stats, setStats] = useState({
    productsCount: 0,
    customersCount: 0,
    ordersCount: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all three datasets in parallel
      const [products, customers, orders] = await Promise.all([
        apiCall("/products/"),
        apiCall("/customers/"),
        apiCall("/orders/"),
      ]);

      const lowStock = products.filter(p => p.quantity_in_stock <= 10);

      setStats({
        productsCount: products.length,
        customersCount: customers.length,
        ordersCount: orders.length,
        lowStockCount: lowStock.length,
      });

      setLowStockProducts(lowStock);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div>
      <div className="actions-bar">
        <h2 style={{ fontSize: "1.1rem", color: "var(--text-sub)", fontWeight: "500" }}>
          Real-time snapshot of your sales inventory.
        </h2>
        <button className="btn btn-outline" onClick={loadDashboardData} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-wrapper products">
                <Package size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Products</span>
                <span className="metric-value">{stats.productsCount}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper customers">
                <Users size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Customers</span>
                <span className="metric-value">{stats.customersCount}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper orders">
                <ShoppingBag size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Orders</span>
                <span className="metric-value">{stats.ordersCount}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper low-stock">
                <AlertTriangle size={24} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Low Stock Alerts</span>
                <span className="metric-value">{stats.lowStockCount}</span>
              </div>
            </div>
          </div>

          {/* Low Stock Warning Card */}
          <div className="card">
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={20} color="var(--secondary)" />
              <span>Low Stock Warning (Qty &le; 10)</span>
            </h3>

            {lowStockProducts.length === 0 ? (
              <div style={{ padding: "20px 0", color: "var(--success)", fontWeight: "500", textAlign: "center" }}>
                All products are fully stocked. Nice job!
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU Code</th>
                      <th>Price</th>
                      <th>Stock Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product.id} className="low-stock-row">
                        <td style={{ fontWeight: "600" }}>{product.name}</td>
                        <td><code>{product.sku}</code></td>
                        <td>${product.price.toFixed(2)}</td>
                        <td style={{ fontWeight: "bold", color: "var(--error)" }}>
                          {product.quantity_in_stock} units
                        </td>
                        <td>
                          <span className={`badge ${product.quantity_in_stock === 0 ? "badge-danger" : "badge-warning"}`}>
                            {product.quantity_in_stock === 0 ? "Out of Stock" : "Critical Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
