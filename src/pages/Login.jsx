import "../styles/login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "../context/RequestContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();
  const { authenticate } = useRequests();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill all fields");

    try {
      const user = await authenticate(email, password);
      setError("");
      navigate(user.redirect);
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    }
  };

  return (
    <div className="login-bg">
      <div className={`sliding-container`}>
        {/* LEFT PANEL */}
        <div className={`login-left ${showSignup ? "slide-left" : ""}`}>
          {!showSignup ? (
            <>
              <h1>Welcome to Equipment Request System</h1>
              <p>
                Efficiently request, track, and manage laboratory equipment for
                students & faculty. Streamline lab management with ease.
              </p>
            </>
          ) : (
            <>
              <h1>Create Your Account</h1>
              <p>Join the system to request and manage laboratory equipment efficiently.</p>
            </>
          )}
        </div>

        {/* RIGHT PANEL FORM */}
        <div className={`form-container ${showSignup ? "slide-right" : ""}`}>
          {!showSignup ? (
            <div className="login-box">
              <form onSubmit={handleLogin}>
                <h2>Login</h2>
                <p>Access your account</p>

                {error && <p className="error">{error}</p>}

                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <div className="options">
                  <label className="remember">
                    <input type="checkbox" /> Remember me
                  </label>
                  <span className="link">Forgot Password?</span>
                </div>

                <button type="submit">Login</button>

                <p>
                  New here?{" "}
                  <span className="link" onClick={() => setShowSignup(true)}>
                    Register
                  </span>
                </p>
              </form>
            </div>
          ) : (
            <div className="signup-box">
              <form>
                <h2>Register</h2>
                <p>Create your account</p>

                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name" />

                <label>Email</label>
                <input type="email" placeholder="Enter your email" />

                <label>Password</label>
                <input type="password" placeholder="Enter password" />

                <label>Confirm Password</label>
                <input type="password" placeholder="Confirm password" />

                <button type="button">Register</button>

                <p>
                  Already have an account?{" "}
                  <span className="link" onClick={() => setShowSignup(false)}>
                    Login
                  </span>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}