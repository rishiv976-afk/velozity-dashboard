import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";

interface Activity {
  id: number;
  taskId: number;
  projectId: number;
  userId: number;
  oldStatus: string | null;
  newStatus: string | null;
  createdAt: string;

  user: {
    id: number;
    name: string;
  };

  task: {
    id: number;
    title: string;
    assignedToId?: number | null;
  };

  project: {
    id: number;
    name: string;
  };
}

const formatStatus = (
  status: string | null
) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const timeAgo = (
  dateValue: string
) => {
  const date =
    new Date(dateValue);

  const seconds =
    Math.floor(
      (Date.now() -
        date.getTime()) /
        1000
    );

  if (seconds < 60) {
    return "just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1
        ? ""
        : "s"
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  return `${days} day${
    days === 1 ? "" : "s"
  } ago`;
};

const LiveActivityFeed = () => {
  const { user } =
    useAuth();

  const [
    activities,
    setActivities,
  ] =
    useState<Activity[]>([]);

  const [
    onlineUsers,
    setOnlineUsers,
  ] =
    useState<number | null>(
      null
    );

  const [
    connected,
    setConnected,
  ] =
    useState(false);

  useEffect(() => {
    const socket =
      getSocket();

    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect =
      () => {
        setConnected(false);
      };

    const handleCatchup = (
      items: Activity[]
    ) => {
      setActivities(
        items
          .slice(-20)
          .reverse()
      );
    };

    const handleActivity = (
      activity: Activity
    ) => {
      setActivities(
        (current) => [
          activity,
          ...current.filter(
            (item) =>
              item.id !==
              activity.id
          ),
        ].slice(0, 20)
      );
    };

    const handlePresence = (
      count: number
    ) => {
      setOnlineUsers(count);
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "activity:catchup",
      handleCatchup
    );

    socket.on(
      "activity:new",
      handleActivity
    );

    socket.on(
      "presence:update",
      handlePresence
    );

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "activity:catchup",
        handleCatchup
      );

      socket.off(
        "activity:new",
        handleActivity
      );

      socket.off(
        "presence:update",
        handlePresence
      );
    };
  }, []);

  return (
    <section className="panel live-activity-panel">
      <div className="activity-header">
        <div>
          <h3>
            Live activity
          </h3>

          <p>
            Real-time task status
            updates
          </p>
        </div>

        <div className="activity-meta">
          <span
            className={
              connected
                ? "socket-status connected"
                : "socket-status"
            }
          >
            {connected
              ? "Live"
              : "Offline"}
          </span>

          {user?.role ===
            "ADMIN" &&
            onlineUsers !==
              null && (
              <span className="online-count">
                {onlineUsers} online
              </span>
            )}
        </div>
      </div>

      <div className="activity-list">
        {activities.length ===
        0 ? (
          <div className="activity-empty">
            No activity yet.
          </div>
        ) : (
          activities.map(
            (activity) => (
              <article
                key={
                  activity.id
                }
                className="activity-item"
              >
                <div className="activity-avatar">
                  {activity.user.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="activity-content">
                  <p>
                    <strong>
                      {
                        activity
                          .user
                          .name
                      }
                    </strong>{" "}
                    moved{" "}
                    <strong>
                      Task #
                      {
                        activity
                          .task.id
                      }
                    </strong>{" "}
                    from{" "}
                    <span>
                      {formatStatus(
                        activity.oldStatus
                      )}
                    </span>{" "}
                    →{" "}
                    <span>
                      {formatStatus(
                        activity.newStatus
                      )}
                    </span>
                  </p>

                  <div className="activity-details">
                    <span>
                      {
                        activity
                          .project
                          .name
                      }
                    </span>

                    <span>·</span>

                    <span>
                      {
                        activity
                          .task
                          .title
                      }
                    </span>

                    <span>·</span>

                    <span>
                      {timeAgo(
                        activity.createdAt
                      )}
                    </span>
                  </div>
                </div>
              </article>
            )
          )
        )}
      </div>
    </section>
  );
};

export default LiveActivityFeed;