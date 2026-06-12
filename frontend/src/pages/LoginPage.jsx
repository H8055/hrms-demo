import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bootstrap, setBootstrap] = useState({
    loading: true,
    requiresSetup: false,
    apiReachable: true,
  });

  useEffect(() => {
    async function loadBootstrapStatus() {
      try {
        const { data } = await api.get("/auth/bootstrap-status");
        setBootstrap({
          loading: false,
          requiresSetup: Boolean(data.requiresSetup),
          apiReachable: true,
        });
      } catch {
        setBootstrap({
          loading: false,
          requiresSetup: false,
          apiReachable: false,
        });
      }
    }

    loadBootstrapStatus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel auth-panel-primary">
        <div className="auth-copy">
          <span className="eyebrow">MERN • mobile-first • responsive</span>
          <h1>HRMS for teams that need desktop power and mobile simplicity.</h1>
          <p>
            This starter includes secure authentication, a responsive dashboard
            shell, and the Advance Request workflow from your sprint plan.
          </p>
          <div className="feature-grid compact">
            <div className="feature-card">
              <strong>375px</strong>
              <span>Phone-ready forms</span>
            </div>
            <div className="feature-card">
              <strong>768px</strong>
              <span>Tablet-friendly layout</span>
            </div>
            <div className="feature-card">
              <strong>1280px</strong>
              <span>Desktop data density</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Sign in</h2>
            <p>Use your work account to continue.</p>
          </div>

          {!bootstrap.loading && !bootstrap.apiReachable ? (
            <div className="alert alert-error">
              Cannot reach the backend API. Please make sure the backend server
              and MongoDB are running.
            </div>
          ) : null}

          {!bootstrap.loading && bootstrap.requiresSetup ? (
            <div className="alert alert-success">
              No users exist yet.{" "}
              <Link to="/setup-admin">Create the first admin account</Link>{" "}
              before logging in.
            </div>
          ) : null}

          {!bootstrap.loading &&
          bootstrap.apiReachable &&
          !bootstrap.requiresSetup ? (
            <div className="alert alert-success">
              If you used seed data, try <strong>admin@example.com</strong> /{" "}
              <strong>Password@123</strong>.
            </div>
          ) : null}

          {error ? <div className="alert alert-error">{error}</div> : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="admin@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Password@123"
              required
            />
          </label>

          <button
            className="primary-button"
            type="submit"
            disabled={submitting || bootstrap.requiresSetup}
          >
            {submitting ? "Signing in..." : "Login"}
          </button>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <span>•</span>
            <Link to="/reset-password">Have a token?</Link>
            <span>•</span>
            <Link to="/setup-admin">Setup admin</Link>
          </div>

          <p className="helper-text">
            If login fails, it usually means the first admin has not been
            created yet or demo data was not seeded.
          </p>
        </form>
      </section>
    </div>
  );
}
