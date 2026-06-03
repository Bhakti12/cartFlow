import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem("cf_token") || null);
  const [csrfToken, setCsrfToken] = useState(() => sessionStorage.getItem("cf_csrf") || null);
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("cf_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (accessToken, csrfTokenVal, userData) => {
    sessionStorage.setItem("cf_token", accessToken);
    sessionStorage.setItem("cf_csrf", csrfTokenVal);
    sessionStorage.setItem("cf_user", JSON.stringify(userData));
    setToken(accessToken);
    setCsrfToken(csrfTokenVal);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("cf_token");
    sessionStorage.removeItem("cf_csrf");
    sessionStorage.removeItem("cf_user");
    setToken(null);
    setCsrfToken(null);
    setUser(null);
  };

  useEffect(() => {
    const verifySession = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://127.0.0.1:8000/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          // Session expired or invalid
          logout();
        } else {
          // Refresh user details to keep name and fields updated
          const meData = await response.json();
          const userData = {
            email: meData.email,
            name: meData.full_name,
            phone: meData.phone_number
          };
          sessionStorage.setItem("cf_user", JSON.stringify(userData));
          setUser(userData);
        }
      } catch (err) {
        // network issue - don't logout so user can view offline/cached screen,
        // but if server actively rejected token (handled above), it logs out.
      }
    };
    verifySession();
  }, [token]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, csrfToken, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
