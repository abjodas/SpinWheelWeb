import React, { useState } from "react";
import SpinWheel from "./SpinWheel";
import AdminPage from "./AdminPage";

const App = () => {
  const [currentPage, setCurrentPage] = useState("wheel"); // 'wheel', 'login', 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleAdminLogin = () => {
    if (password === "123456") {
      setIsAuthenticated(true);
      setCurrentPage("admin");
      setLoginError("");
      setPassword("");
    } else {
      setLoginError("Invalid password");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage("wheel");
    setPassword("");
    setLoginError("");
  };

  const showLoginModal = currentPage === "login";

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      {currentPage !== "login" && (
        <nav style={styles.navbar}>
          <div style={styles.navContent}>
            <div style={styles.logo}>🎯 Shalina Healthcare</div>
            <div style={styles.navActions}>
              {currentPage === "wheel" && (
                <button
                  onClick={() => setCurrentPage("login")}
                  style={styles.adminButton}
                >
                  🔧 Admin
                </button>
              )}
              {currentPage === "admin" && (
                <button onClick={handleLogout} style={styles.logoutButton}>
                  ← Back to Wheel
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🔐 Admin Access</h2>
              <button
                onClick={() => setCurrentPage("wheel")}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              <p style={styles.modalText}>
                Enter admin password to access distribution settings:
              </p>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Password"
                style={styles.passwordInput}
                autoFocus
              />

              {loginError && (
                <div style={styles.errorMessage}>{loginError}</div>
              )}

              <div style={styles.modalActions}>
                <button
                  onClick={() => setCurrentPage("wheel")}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button onClick={handleAdminLogin} style={styles.loginButton}>
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div style={styles.pageContent}>
        {currentPage === "wheel" && <SpinWheel />}
        {currentPage === "admin" && isAuthenticated && (
          <AdminPage onBack={handleLogout} />
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    position: "relative",
  },
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(10px)",
    zIndex: 1000,
    padding: "15px 0",
    borderBottom: "2px solid rgba(255,255,255,0.1)",
  },
  navContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
  },
  logo: {
    color: "white",
    fontSize: "1.5rem",
    fontWeight: "bold",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  navActions: {
    display: "flex",
    gap: "10px",
  },
  adminButton: {
    padding: "8px 20px",
    background: "linear-gradient(135deg, #ff6b6b, #ee5a52)",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  logoutButton: {
    padding: "8px 20px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  pageContent: {
    paddingTop: "60px", // Space for fixed navbar
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    backdropFilter: "blur(5px)",
  },
  modal: {
    background: "white",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "400px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "50%",
    width: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: "30px",
  },
  modalText: {
    color: "#555",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  passwordInput: {
    width: "100%",
    padding: "15px",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    fontSize: "1.1rem",
    marginBottom: "15px",
    outline: "none",
    transition: "border-color 0.3s ease",
  },
  errorMessage: {
    color: "#e74c3c",
    backgroundColor: "#ffeaea",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "20px",
    textAlign: "center",
    fontWeight: "bold",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "12px 25px",
    background: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  loginButton: {
    padding: "12px 25px",
    background: "linear-gradient(135deg, #27ae60, #229954)",
    color: "white",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
};

export default App;
