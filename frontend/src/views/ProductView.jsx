import React, { useState, useEffect } from "react";
import { apiCall } from "../services/api";
import { Plus, Search, Edit, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react";

export const ProductView = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add, edit
  const [currentProductId, setCurrentProductId] = useState(null);
  
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  
  // Feedback alerts
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/products/");
      setProducts(data);
    } catch (err) {
      setError(err.message || "Failed to load products list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const openAddModal = () => {
    clearAlerts();
    setModalMode("add");
    setName("");
    setSku("");
    setPrice("");
    setQty("");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    clearAlerts();
    setModalMode("edit");
    setCurrentProductId(product.id);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQty(product.quantity_in_stock.toString());
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    // Validation
    if (!name || !sku || price === "" || qty === "") {
      setError("Please fill in all input fields.");
      return;
    }

    const priceNum = parseFloat(price);
    const qtyNum = parseInt(qty);

    if (isNaN(priceNum) || priceNum < 0) {
      setError("Price cannot be a negative value.");
      return;
    }

    if (isNaN(qtyNum) || qtyNum < 0) {
      setError("Quantity in stock cannot be a negative value.");
      return;
    }

    try {
      if (modalMode === "add") {
        await apiCall("/products/", {
          method: "POST",
          body: JSON.stringify({
            name,
            sku,
            price: priceNum,
            quantity_in_stock: qtyNum,
          }),
        });
        setSuccess(`Product '${name}' created successfully.`);
      } else {
        await apiCall(`/products/${currentProductId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            sku,
            price: priceNum,
            quantity_in_stock: qtyNum,
          }),
        });
        setSuccess(`Product '${name}' updated successfully.`);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id, productName) => {
    clearAlerts();
    if (!window.confirm(`Are you sure you want to delete product '${productName}'?`)) {
      return;
    }

    try {
      await apiCall(`/products/${id}`, {
        method: "DELETE",
      });
      setSuccess(`Product '${productName}' deleted successfully.`);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter products list on search input
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Actions top bar */}
      <div className="actions-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or SKU..."
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

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Table Data */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          Loading products inventory...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          No products found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU / Code</th>
                <th>Price</th>
                <th>Quantity in Stock</th>
                <th>Stock Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: "600" }}>{product.name}</td>
                  <td><code>{product.sku}</code></td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.quantity_in_stock} units</td>
                  <td>
                    {product.quantity_in_stock === 0 ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : product.quantity_in_stock <= 10 ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-outline" style={{ padding: "6px 12px" }} onClick={() => openEditModal(product)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: "6px 12px" }} onClick={() => handleDeleteProduct(product.id, product.name)}>
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === "add" ? "Add New Product" : "Edit Product Details"}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Slim Fit Denim Shirt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SKU / Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SHT-DNM-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    disabled={modalMode === "edit"} // Keep SKU fixed on update
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === "add" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
