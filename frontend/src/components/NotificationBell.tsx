import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import { api } from "../services/api";
import { getSocket } from "../services/socket";

interface Notification {
  id: number;
  userId: number;
  taskId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;

  task?: {
    id: number;
    title: string;
    projectId: number;
  } | null;
}

interface NotificationsResponse {
  success: boolean;

  data: {
    notifications: Notification[];
    unreadCount: number;
  };
}

interface MarkReadResponse {
  success: boolean;

  data: {
    notification: Notification;
    unreadCount: number;
  };
}

const formatTime = (
  dateValue: string
) => {
  const date =
    new Date(dateValue);

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const NotificationBell = () => {
  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const loadNotifications =
      async () => {
        try {
          const response =
            await api.get<NotificationsResponse>(
              "/notifications"
            );

          setNotifications(
            response.data.data
              .notifications
          );

          setUnreadCount(
            response.data.data
              .unreadCount
          );
        } catch (error) {
          if (
            axios.isAxiosError(error)
          ) {
            setError(
              error.response?.data
                ?.error?.message ||
                "Unable to load notifications"
            );
          } else {
            setError(
              "Unable to load notifications"
            );
          }
        }
      };

    void loadNotifications();
  }, []);

  useEffect(() => {
    const socket =
      getSocket();

    const handleNewNotification = (
      notification: Notification
    ) => {
      setNotifications(
        (current) => [
          notification,
          ...current.filter(
            (item) =>
              item.id !==
              notification.id
          ),
        ]
      );

      setUnreadCount(
        (current) =>
          current + 1
      );
    };

    socket.on(
      "notification:new",
      handleNewNotification
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification
      );
    };
  }, []);

  const markRead = async (
    notification: Notification
  ) => {
    if (notification.isRead) {
      return;
    }

    try {
      const response =
        await api.patch<MarkReadResponse>(
          `/notifications/${notification.id}/read`
        );

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
          )
      );

      setUnreadCount(
        response.data.data
          .unreadCount
      );
    } catch {
      setError(
        "Unable to update notification"
      );
    }
  };

  const markAllRead =
    async () => {
      try {
        await api.patch(
          "/notifications/read-all"
        );

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                isRead: true,
              })
            )
        );

        setUnreadCount(0);
      } catch {
        setError(
          "Unable to update notifications"
        );
      }
    };

  return (
    <div className="notification-wrapper">
      <button
        className="notification-button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        aria-label="Notifications"
      >
        <span className="notification-icon">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <strong>
                Notifications
              </strong>

              <span>
                {unreadCount} unread
              </span>
            </div>

            {unreadCount >
              0 && (
              <button
                onClick={() =>
                  void markAllRead()
                }
              >
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div className="notification-error">
              {error}
            </div>
          )}

          <div className="notification-list">
            {notifications.length ===
            0 ? (
              <div className="notification-empty">
                No notifications
              </div>
            ) : (
              notifications.map(
                (
                  notification
                ) => (
                  <button
                    key={
                      notification.id
                    }
                    className={`notification-item ${
                      notification.isRead
                        ? ""
                        : "unread"
                    }`}
                    onClick={() =>
                      void markRead(
                        notification
                      )
                    }
                  >
                    <span className="notification-message">
                      {
                        notification.message
                      }
                    </span>

                    <span className="notification-time">
                      {formatTime(
                        notification.createdAt
                      )}
                    </span>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;