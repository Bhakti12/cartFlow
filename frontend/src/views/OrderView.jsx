import React, { useState, useEffect } from "react";
import { apiCall } from "../services/api";
import { Plus, Search, Eye, Trash2, X, AlertCircle, CheckCircle2, ShoppingCart, Trash } from "lucide-react";

export const OrderView = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals visibility states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Selected details state
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Order Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [basket, setBasket] = useState([]); // Array of { product_id, name, sku, quantity, price }

  // Alerts feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, customersData] = await Promise.all([
        apiCall("/orders/"),
        apiCall("/products/"),
        apiCall("/customers/"),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      setError(err.message || "Failed to retrieve order logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const openCreateModal = () => {
    clearAlerts();
    setSelectedCustomerId("");
    setSelectedProductId("");
    setItemQuantity("1");
    setBasket([]);
    setIsCreateOpen(true);
  };

  const openDetailsModal = (order) => {
    clearAlerts();
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Add item to local creation basket
  const handleAddToBasket = () => {
    clearAlerts();
    if (!selectedProductId || !itemQuantity) {
      setError("Please select a product and enter the quantity.");
      return;
    }

    const qtyVal = parseInt(itemQuantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError("Quantity ordered must be at least 1.");
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) {
      setError("Selected product was not found.");
      return;
    }

    // Check inventory stock limits locally before adding
    if (product.quantity_in_stock < qtyVal) {
      setError(`Insufficient stock. Only ${product.quantity_in_stock} items remaining.`);
      return;
    }

    // Check if item is already in basket
    const existingIndex = basket.findIndex((item) => item.product_id === product.id);
    if (existingIndex > -1) {
      const updatedBasket = [...basket];
      const newQty = updatedBasket[existingIndex].quantity + qtyVal;
      
      if (product.quantity_in_stock < newQty) {
        setError(`Cannot exceed available product stock (${product.quantity_in_stock} units).`);
        return;
      }
      updatedBasket[existingIndex].quantity = newQty;
      setBasket(updatedBasket);
    } else {
      setBasket([
        ...basket,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: qtyVal,
          price: product.price,
        },
      ]);
    }

    // Reset selector inputs
    setSelectedProductId("");
    setItemQuantity("1");
  };

  // Remove item from basket
  const handleRemoveFromBasket = (index) => {
    const updatedBasket = [...basket];
    updatedBasket.splice(index, 1);
    setBasket(updatedBasket);
  };

  // Post the order to the backend
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!selectedCustomerId) {
      setError("Please select the purchasing customer.");
      return;
    }

    if (basket.length === 0) {
      setError("Please add at least one item to your basket.");
      return;
    }

    const orderPayload = {
      customer_id: parseInt(selectedCustomerId),
      items: basket.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    try {
      await apiCall("/orders/", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });
      setSuccess("Order placed successfully!");
      setIsCreateOpen(false);
      loadInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel order (will restock products automatically in database)
  const handleCancelOrder = async (id) => {
    clearAlerts();
    if (!window.confirm("Are you sure you want to cancel this order? This will restock all ordered items.")) {
      return;
    }

    try {
      await apiCall(`/orders/${id}`, {
        method: "DELETE",
      });
      setSuccess("Order cancelled and items successfully restocked.");
      loadInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getCustomerName = (id) => {
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.full_name : `Customer ID #${id}`;
  };

  const getProductName = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : `Product ID #${id}`;
  };

  const getProductSku = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.sku : `—`;
  };

  // Calculate local checkout total dynamically
  const basketTotal = basket.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div>
      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Action panel bar */}
      <div className="actions-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search orders by Customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "40px" }}
          />
          <Search
            size={18}
            color="var(--text-sub)"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
          />
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Create Order</span>
        </button>
      </div>

      {/* List / Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          Loading order files...
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          No orders placed yet.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Reference</th>
                <th>Items Count</th>
                <th>Total Amount</th>
                <th>Order Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((o) => o.customer_id.toString().includes(search))
                .map((order) => (
                  <tr key={order.id}>
                    <td><code>#{order.id}</code></td>
                    <td style={{ fontWeight: "600" }}>{getCustomerName(order.customer_id)}</td>
                    <td>{order.items.length} item(s)</td>
                    <td style={{ fontWeight: "bold", color: "var(--primary)" }}>
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td>{new Date(order.created_date).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">Processed</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button className="btn btn-outline" style={{ padding: "6px 12px" }} onClick={() => openDetailsModal(order)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: "6px 12px" }} onClick={() => handleCancelOrder(order.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Checkout Builder Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Checkout Order</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit}>
              <div className="modal-body order-create-layout">
                {/* Form fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">1. Select Customer</label>
                    <select
                      className="form-input"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="card" style={{ padding: "16px", marginBottom: "0", backgroundColor: "#fafaf9" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShoppingCart size={16} />
                      <span>Add Product Item</span>
                    </h4>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Product</label>
                      <select
                        className="form-input"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                            {p.name} - ${p.price.toFixed(2)} (Stock: {p.quantity_in_stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: "0" }}>
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                        />
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button type="button" className="btn btn-secondary" style={{ width: "100%" }} onClick={handleAddToBasket}>
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shopping Basket Panel */}
                <div className="card" style={{ height: "100%", margin: "0", display: "flex", flexDirection: "column" }}>
                  <h4 className="card-title" style={{ fontSize: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                    Shopping Cart Items
                  </h4>
                  
                  <div style={{ flexGrow: 1, overflowY: "auto", maxHeight: "240px", margin: "10px 0" }}>
                    {basket.length === 0 ? (
                      <div style={{ color: "var(--text-light)", textAlign: "center", padding: "30px 0" }}>
                        No items added to basket.
                      </div>
                    ) : (
                      basket.map((item, idx) => (
                        <div key={item.product_id} className="basket-item">
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{item.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-sub)" }}>
                              SKU: <code>{item.sku}</code> | ${item.price.toFixed(2)} x {item.quantity}
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button type="button" style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }} onClick={() => handleRemoveFromBasket(idx)}>
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="basket-summary-row basket-total">
                    <span>Total Amount:</span>
                    <span>${basketTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={basket.length === 0}>
                  Create Order (${basketTotal.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal Drawer */}
      {isDetailsOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Order Details #{selectedOrder.id}</h3>
              <button className="modal-close" onClick={() => setIsDetailsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Order Metadata summary */}
              <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div>
                  <strong>Customer name:</strong> {getCustomerName(selectedOrder.customer_id)}
                </div>
                <div>
                  <strong>Date processed:</strong> {new Date(selectedOrder.created_date).toLocaleString()}
                </div>
              </div>

              <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "10px" }}>Ordered Items</h4>
              <div className="table-wrapper">
                <table className="table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU Code</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "600" }}>{getProductName(item.product_id)}</td>
                        <td><code>{getProductSku(item.product_id)}</code></td>
                        <td>{item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: "700" }}>
                  <span>Total Paid: </span>
                  <span style={{ color: "var(--primary)" }}>${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsDetailsOpen(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
