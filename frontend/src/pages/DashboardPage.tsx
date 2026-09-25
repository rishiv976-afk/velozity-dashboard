import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

import LiveActivityFeed from "../components/LiveActivityFeed";

interface DashboardResponse {
  success: boolean;

  data: {
    role: string;

    summary: Record<
      string,
      number
    >;
  };
}

const DashboardPage = () => {
  const { user } =
    useAuth();

  const [
    dashboard,
    setDashboard,
  ] = useState<
    DashboardResponse["data"] | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          const response =
            await api.get<DashboardResponse>(
              "/dashboard"
            );

          setDashboard(
            response.data.data
          );
        } catch (error) {
          if (
            axios.isAxiosError(error)
          ) {
            setError(
              error.response?.data
                ?.error?.message ||
                "Unable to load dashboard"
            );
          } else {
            setError(
              "Unable to load dashboard"
            );
          }
        } finally {
          setLoading(false);
        }
      };

    void loadDashboard();
  }, []);

  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            Welcome back
            {user?.name
              ? `, ${user.name}`
              : ""}
          </p>
        </div>
      </div>

      {loading && (
        <div className="panel">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {dashboard && (
        <>
          <section className="dashboard-intro">
            <h2>
              {dashboard.role.replaceAll(
                "_",
                " "
              )}
            </h2>

            <p>
              Your real-time workspace
              overview.
            </p>
          </section>

          <section className="stats-grid">
            {Object.entries(
              dashboard.summary
            ).map(
              ([key, value]) => (
                <article
                  key={key}
                  className="stat-card"
                >
                  <span>
                    {key
                      .replace(
                        /([A-Z])/g,
                        " $1"
                      )
                      .replace(
                        /^./,
                        (letter) =>
                          letter.toUpperCase()
                      )}
                  </span>

                  <strong>
                    {value}
                  </strong>
                </article>
              )
            )}
          </section>

          <LiveActivityFeed />
        </>
      )}
    </div>
  );
};

export default DashboardPage;