import React, { useState } from 'react';
import { signInUser } from './services/authService';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const result = await signInUser(email, password);

      if (result.success) {
        onLogin(result.user);
      } else {
        setLoginError(result.message);
      }
    } catch (error) {
      setLoginError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background particles */}
      <div style={styles.particleContainer}>
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: `rgba(255,255,255,${0.3 + Math.random() * 0.5})`,
              boxShadow: `0 0 ${4 + Math.random() * 6}px rgba(255,255,255,0.4)`,
            }}
          />
        ))}
      </div>

      <div style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logo}>🎯</div>
          <h1 style={styles.title}>Shalina Healthcare</h1>
          <p style={styles.subtitle}>Fortune Spin Wheel</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          {loginError && (
            <div style={styles.errorMessage}>
              ⚠️ {loginError}
            </div>
          )}

          <button 
            type="submit" 
            style={{
              ...styles.loginButton,
              ...(isLoading ? styles.loginButtonDisabled : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div style={styles.spinner}></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>


      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg) scale(1); 
              opacity: 0.7;
            }
            50% { 
              transform: translateY(-20px) rotate(180deg) scale(1.2); 
              opacity: 1;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .floating-particle {
            position: absolute;
            border-radius: 50%;
            animation: float infinite ease-in-out;
            pointer-events: none;
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 25% 25%, #667eea 0%, transparent 50%), radial-gradient(circle at 75% 75%, #764ba2 0%, transparent 50%), linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: "relative",
    overflow: "hidden",
  },
  particleContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 1,
  },
  loginCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)",
    position: "relative",
    zIndex: 10,
    animation: "slideIn 0.6s ease-out",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logo: {
    fontSize: "3rem",
    marginBottom: "10px",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#2c3e50",
    margin: "0 0 5px 0",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#7f8c8d",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "15px 20px",
    border: "2px solid #e0e6ed",
    borderRadius: "12px",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.3s ease",
    backgroundColor: "#fafbfc",
    boxSizing: "border-box",
  },
  errorMessage: {
    color: "#e74c3c",
    backgroundColor: "#ffeaea",
    padding: "12px 15px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    textAlign: "center",
    fontWeight: "500",
  },
  loginButton: {
    padding: "15px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  loginButtonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  toggleSection: {
    marginTop: "20px",
    textAlign: "center",
    padding: "15px 0",
    borderTop: "1px solid #e0e6ed",
  },
  toggleText: {
    fontSize: "0.9rem",
    color: "#7f8c8d",
    margin: "0 0 10px 0",
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "0.9rem",
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "underline",
  },
  demoCredentials: {
    marginTop: "20px",
    padding: "20px",
    background: "rgba(103, 126, 234, 0.1)",
    borderRadius: "12px",
    textAlign: "center",
  },
  demoTitle: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#667eea",
    margin: "0 0 10px 0",
  },
  credentialsList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "0.85rem",
    color: "#5a6c7d",
  },
};

export default LoginPage;