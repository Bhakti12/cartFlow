import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../services/api";
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert 
} from "lucide-react";

export const ProfileView = () => {
  const { user, logout } = useAuth();
  
  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    
    // Strict password validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("New password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError("New password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("New password must contain at least one digit.");
      return;
    }
    const specialCharRegex = /[!@#$%^&*()_\-+=\[\]{}|;:',.<>?/`~]/;
    if (!specialCharRegex.test(newPassword)) {
      setError("New password must contain at least one special character.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    
    if (oldPassword === newPassword) {
      setError("New password cannot be the same as the old password.");
      return;
    }
    
    setLoading(true);
    try {
      await apiCall("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });
      
      setSuccess("Your password has been changed successfully! Logging out in 2 seconds...");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header Info */}
      <div className="card" style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <div className="avatar" style={{ width: "80px", height: "80px", fontSize: "2rem", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
        </div>
        
        <div style={{ flexGrow: 1 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "4px" }}>
            {user?.name || "System Administrator"}
          </h2>
          <p style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "var(--primary-light)", padding: "4px 10px", borderRadius: "var(--radius-full)" }}>
            <User size={14} /> SYSTEM MANAGER (ADMIN)
          </p>
        </div>
      </div>
      
      <div className="order-create-layout" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Left Side: Profile Details */}
        <div className="card">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={18} style={{ color: "var(--primary)" }} />
            <span>Profile Details</span>
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              <div style={{ color: "var(--text-sub)" }}><Mail size={18} /></div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontWeight: "500", textTransform: "uppercase" }}>Email Address</div>
                <div style={{ fontWeight: "500", color: "var(--text-main)" }}>{user?.email || "N/A"}</div>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "4px" }}>
              <div style={{ color: "var(--text-sub)" }}><Phone size={18} /></div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontWeight: "500", textTransform: "uppercase" }}>Mobile Number</div>
                <div style={{ fontWeight: "500", color: "var(--text-main)" }}>{user?.phone || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side: Change Password */}
        <div className="card">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={18} style={{ color: "var(--primary)" }} />
            <span>Security settings</span>
          </h3>
          
          {error && (
            <div className="alert alert-error" style={{ padding: "10px 12px", marginBottom: "16px" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" style={{ padding: "10px 12px", marginBottom: "16px" }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}
          
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label">Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 chars (A-Z, a-z, 0-9, special char)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
              <KeyRound size={18} />
              <span>{loading ? "Updating..." : "Update Password"}</span>
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
};
