import React, { useState, useEffect } from "react";
import { api } from "../api";
import { LogIn, KeyRound, User, GraduationCap } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "923019707862-5jipkg58tt4va9uftsjttnl6ta9ll7ep.apps.googleusercontent.com";

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
          auto_select: false,
          use_fedcm_for_prompt: false,
        });
        const target = document.getElementById("google-signin-btn-container");
        if (target) {
          try {
            window.google.accounts.id.renderButton(target, {
              theme: "filled_blue",
              size: "large",
              width: "320",
              text: "continue_with",
              shape: "pill",
            });
          } catch (e) {
            console.log("Google GIS render note:", e);
          }
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId]);

  const handleGoogleCallback = async (response) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await api.googleLogin(response.credential);
      onLoginSuccess(data.role, data.username);
    } catch (err) {
      setError(err.message || "Google Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.role, data.username);
    } catch (err) {
      setError(err.message || "Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel" style={{ maxWidth: "420px", width: "100%" }}>
        <h2>Welcome Back</h2>
        <p>Sign in to update your daily training details</p>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {/* Student Google Login Section */}
        <div style={{
          marginBottom: "24px",
          padding: "20px 18px",
          background: "rgba(8, 145, 178, 0.05)",
          borderRadius: "14px",
          border: "1px solid rgba(8, 145, 178, 0.18)",
          textAlign: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
            <GraduationCap size={20} style={{ color: "var(--color-accent)" }} />
            <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "var(--text-primary)" }}>
              Student Sign-In
            </span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
            Students must use Google Login to access their training account.
          </p>

          <div id="google-signin-btn-container" style={{ minHeight: "44px", display: "flex", justifyContent: "center", width: "100%" }}></div>
        </div>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "20px 0",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          letterSpacing: "1px",
          fontWeight: "600"
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }}></div>
          <span style={{ padding: "0 10px" }}>ADMIN SIGN IN</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }}></div>
        </div>

        {/* Admin Login Form */}
        <form onSubmit={handleAdminSubmit}>
          <div className="form-group">
            <label htmlFor="username">Admin Username</label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                id="username"
                type="text"
                className="glass-input"
                style={{ width: "100%", paddingLeft: "40px" }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <KeyRound
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                id="password"
                type="password"
                className="glass-input"
                style={{ width: "100%", paddingLeft: "40px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="glass-button"
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? (
              "Please wait..."
            ) : (
              <>
                <LogIn size={18} /> Sign In as Admin
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
