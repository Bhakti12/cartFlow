import React, { useState, useEffect } from "react";
import { apiCall } from "../services/api";
import { Plus, Search, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react";

export const CustomerView = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Feedback alerts
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/customers/");
      setCustomers(data);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const openAddModal = () => {
    clearAlerts();
    setFullName("");
    setEmail("");
    setPhone("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!fullName || !email) {
      setError("Name and Email are required fields.");
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await apiCall("/customers/", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone_number: phone || null,
        }),
      });
      setSuccess(`Customer '${fullName}' registered successfully.`);
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    clearAlerts();
    if (!window.confirm(`Are you sure you want to delete customer '${name}'? This will soft-delete their record.`)) {
      return;
    }

    try {
      await apiCall(`/customers/${id}`, {
        method: "DELETE",
      });
      setSuccess(`Customer '${name}' deleted successfully.`);
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Alert logs */}
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

      {/* Top actions bar */}
      <div className="actions-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
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
          <span>Add Customer</span>
        </button>
      </div>

      {/* List / Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          Loading customers directory...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
          No customers found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td><code>#{c.id}</code></td>
                  <td style={{ fontWeight: "600" }}>{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone_number || "—"}</td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-danger" style={{ padding: "6px 12px" }} onClick={() => handleDeleteCustomer(c.id, c.full_name)}>
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

      {/* Register Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register Customer</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Johnathan Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 99999 88888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
