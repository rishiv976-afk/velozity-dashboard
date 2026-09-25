import {
  useEffect,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

import NotificationBell from "./NotificationBell";

import "../realtime.css";

const AppLayout = () => {
  const {
    user,
    logout,
    accessToken,
  } = useAuth();

  const navigate =
    useNavigate();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  const handleLogout =
    async () => {
      disconnectSocket();

      await logout();

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            V
          </div>

          <div>
            <strong>
              Velozity
            </strong>

            <span>
              Project Dashboard
            </span>
          </div>
        </div>

        <nav>
          <NavLink
            to="/dashboard"
            className={({
              isActive,
            }) =>
              isActive
                ? "active"
                : ""
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/projects"
            className={({
              isActive,
            }) =>
              isActive
                ? "active"
                : ""
            }
          >
            Projects
          </NavLink>

          <NavLink
            to="/tasks"
            className={({
              isActive,
            }) =>
              isActive
                ? "active"
                : ""
            }
          >
            Tasks
          </NavLink>

          {user?.role ===
            "ADMIN" && (
            <>
              <NavLink
                to="/clients"
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "active"
                    : ""
                }
              >
                Clients
              </NavLink>

              <NavLink
                to="/users"
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "active"
                    : ""
                }
              >
                Users
              </NavLink>
            </>
          )}
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </aside>

      <div className="app-main">
        <header className="topbar app-topbar">
          <div>
            <strong className="topbar-title">
              Velozity Dashboard
            </strong>
          </div>

          <div className="topbar-actions">
            <NotificationBell />

            <div className="user-badge">
              <div className="avatar">
                {user?.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </div>

              <div>
                <strong>
                  {user?.name ||
                    "User"}
                </strong>

                <span>
                  {user?.role
                    ?.replaceAll(
                      "_",
                      " "
                    )}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;