import React, { useState, useEffect } from "react";
import SpinWheel from "./SpinWheel";
import AdminPage from "./AdminPage";
import LoginPage from "./LoginPage";
import { onAuthStateChange, signOutUser } from './services/authService';

const App = () => {
  const [currentPage, setCurrentPage] = useState("userLogin"); // 'userLogin', 'wheel', 'adminLogin', 'admin'
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setIsUserAuthenticated(true);
        setCurrentUser(user);
        setCurrentPage("wheel");
      } else {
        setIsUserAuthenticated(false);
        setCurrentUser(null);
        setCurrentPage("userLogin");
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleUserLogin = (user) => {
    // Firebase Auth will handle state updates via onAuthStateChange
    console.log('User logged in:', user);
  };

  const handleUserLogout = async () => {
    try {
      await signOutUser();
      // Firebase Auth will handle state updates via onAuthStateChange
      setIsAdminAuthenticated(false);
      setAdminPassword("");
      setAdminLoginError("");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === "123456") {
      setIsAdminAuthenticated(true);
      setCurrentPage("admin");
      setAdminLoginError("");
      setAdminPassword("");
    } else {
      setAdminLoginError("Invalid password");
      setAdminPassword("");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentPage("wheel");
    setAdminPassword("");
    setAdminLoginError("");
  };

  const showAdminLoginModal = currentPage === "adminLogin";

  // Show loading screen while Firebase initializes
  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      {currentPage !== "adminLogin" && currentPage !== "userLogin" && (
        <nav style={styles.navbar}>
          <div style={styles.navContent}>
            <div style={styles.logo}>🎯 Shalina Healthcare</div>
            <div style={styles.navActions}>
              {currentPage === "wheel" && (
                <>
                  <div style={styles.userInfo}>
                    Welcome, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
                  </div>
                  <button
                    onClick={() => setCurrentPage("adminLogin")}
                    style={styles.adminButton}
                  >
                    🔧 Admin
                  </button>
                  <button
                    onClick={handleUserLogout}
                    style={styles.logoutButton}
                  >
                    🚪 Logout
                  </button>
                </>
              )}
              {currentPage === "admin" && (
                <button onClick={handleAdminLogout} style={styles.logoutButton}>
                  ← Back to Wheel
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
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
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Password"
                style={styles.passwordInput}
                autoFocus
              />

              {adminLoginError && (
                <div style={styles.errorMessage}>{adminLoginError}</div>
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
        {currentPage === "userLogin" && (
          <LoginPage onLogin={handleUserLogin} />
        )}
        {currentPage === "wheel" && isUserAuthenticated && <SpinWheel />}
        {currentPage === "admin" && isAdminAuthenticated && (
          <AdminPage onBack={handleAdminLogout} />
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
    alignItems: "center",
    gap: "15px",
  },
  userInfo: {
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "500",
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
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
  loadingScreen: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  loadingText: {
    color: "white",
    fontSize: "1.2rem",
    fontWeight: "500",
  },
};

export default App;
