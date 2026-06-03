import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, UserPlus, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export const AuthView = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState("login"); // login, register, verify
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  
  // Feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const parseErrorDetail = (detail) => {
    if (!detail) return "";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => {
        const field = err.loc ? err.loc[err.loc.length - 1] : "";
        return `${field ? field + ": " : ""}${err.msg}`;
      }).join("; ");
    }
    if (typeof detail === "object") {
      return JSON.stringify(detail);
    }
    return String(detail);
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(parseErrorDetail(data.detail) || "Incorrect email or password.");
      }
      
      // Successfully logged in
      // Fetch user details from /auth/me to save in AuthContext
      const userRes = await fetch("http://127.0.0.1:8000/auth/me", {
        headers: {
          "Authorization": `Bearer ${data.access_token}`
        }
      });
      
      const meData = await userRes.json();
      const userData = {
        email: meData.email,
        name: meData.full_name,
        phone: meData.phone_number
      };
      
      login(data.access_token, data.csrf_token, userData);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!fullName || !email || !phone || !password) {
      setError("All fields are required.");
      return;
    }
    
    // Strict password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one digit.");
      return;
    }
    const specialCharRegex = /[!@#$%^&*()_\-+=\[\]{}|;:',.<>?/`~]/;
    if (!specialCharRegex.test(password)) {
      setError("Password must contain at least one special character.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          phone_number: phone,
          password: password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(parseErrorDetail(data.detail) || "Registration failed. Try again.");
      }
      
      // Registration successful! Direct to login.
      setSuccess("Account registered successfully! Please log in.");
      setMode("login");
      setPassword("");
      setFullName("");
      setPhone("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        {/* Header */}
        <div className="auth-header">
          <div style={{ display: "inline-flex", justifyContent: "center" }}>
            <div className="brand-logo">CF</div>
          </div>
          
          {mode === "login" && (
            <>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Sign in to manage your Products & Orders</p>
            </>
          )}
          
          {mode === "register" && (
            <>
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">Sign up to manage CartFlow inventory</p>
            </>
          )}
          

        </div>
        
        {/* Body */}
        <div className="auth-body">
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
          
          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit}>
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
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
                <LogIn size={18} />
                <span>{loading ? "Signing in..." : "Sign In"}</span>
              </button>
            </form>
          )}
          
          {/* Register Form */}
          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 chars (A-Z, a-z, 0-9, special char)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
                <UserPlus size={18} />
                <span>{loading ? "Registering..." : "Register"}</span>
              </button>
            </form>
          )}
          

        </div>
        
        {/* Footer switch links */}
        <div className="auth-footer">
          {mode === "login" && (
            <p>
              Don't have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); clearMessages(); }}>
                Create one
              </a>
            </p>
          )}
          
          {mode === "register" && (
            <p>
              Already have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); clearMessages(); }}>
                Log in
              </a>
            </p>
          )}
          

        </div>
        
      </div>
    </div>
  );
};
