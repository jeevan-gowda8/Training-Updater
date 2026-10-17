import React, { useState, useEffect } from "react";
import Background3D from "./components/Background3D";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { api } from "./api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // Check local storage for session
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedUsername = localStorage.getItem("username");

    if (token && savedRole && savedUsername) {
      setIsAuthenticated(true);
      setRole(savedRole);
      setUsername(savedUsername);
    }
  }, []);

  const handleLoginSuccess = (userRole, name) => {
    setIsAuthenticated(true);
    setRole(userRole);
    setUsername(name);
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setRole(null);
    setUsername(null);
  };

  return (
    <div className="app-container">
      {/* 3D background animation visible across all views */}
      <Background3D />
      
      {/* Routing Views based on Auth */}
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : role === "admin" ? (
        <AdminDashboard username={username} onLogout={handleLogout} />
      ) : (
        <StudentDashboard username={username} onLogout={handleLogout} />
      )}
    </div>
  );
}
