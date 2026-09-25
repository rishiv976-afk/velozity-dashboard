import {
  useState,
  type FormEvent,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const {
    user,
    login,
  } = useAuth();

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("admin@velozity.test");

  const [password, setPassword] =
    useState("Password@123");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(
        email.trim(),
        password
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      if (
        axios.isAxiosError(error)
      ) {
        setError(
          error.response?.data?.error
            ?.message ||
            "Unable to login"
        );
      } else {
        setError(
          "Unable to login"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-mark">
            V
          </div>

          <div>
            <h1>Velozity Dashboard</h1>
            <p>
              Real-time project management
            </p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to access your dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
            />
          </label>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <div className="demo-credentials">
          <strong>
            Demo administrator
          </strong>

          <span>
            admin@velozity.test
          </span>

          <span>
            Password@123
          </span>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;