import {
  useEffect,
  useState,
} from "react";

import axios from "axios";
import {
  useSearchParams,
} from "react-router-dom";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE";
  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  dueDate: string;
  isOverdue: boolean;

  project: {
    id: number;
    name: string;
    createdById: number;
  };

  assignedTo: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface TasksResponse {
  success: boolean;
  data: Task[];
}

const statusOptions = [
  "",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

const priorityOptions = [
  "",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const formatStatus = (
  status: string
) => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatDate = (
  date: string
) => {
  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const TasksPage = () => {
  const { user } = useAuth();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const status =
    searchParams.get("status") || "";

  const priority =
    searchParams.get("priority") || "";

  const dueDate =
    searchParams.get("dueDate") || "";

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (status) {
        params.set(
          "status",
          status
        );
      }

      if (priority) {
        params.set(
          "priority",
          priority
        );
      }

      if (dueDate) {
        params.set(
          "dueDate",
          dueDate
        );
      }

      const query =
        params.toString();

      const response =
        await api.get<TasksResponse>(
          `/tasks${
            query
              ? `?${query}`
              : ""
          }`
        );

      setTasks(
        response.data.data
      );
    } catch (error) {
      if (
        axios.isAxiosError(error)
      ) {
        setError(
          error.response?.data
            ?.error?.message ||
            "Unable to load tasks"
        );
      } else {
        setError(
          "Unable to load tasks"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [
    status,
    priority,
    dueDate,
  ]);

  const updateFilter = (
    key: string,
    value: string
  ) => {
    const params =
      new URLSearchParams(
        searchParams
      );

    if (value) {
      params.set(
        key,
        value
      );
    } else {
      params.delete(key);
    }

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const updateStatus = async (
    taskId: number,
    newStatus: string
  ) => {
    try {
      setUpdatingId(taskId);
      setError("");

      await api.patch(
        `/tasks/${taskId}/status`,
        {
          status: newStatus,
        }
      );

      await loadTasks();
    } catch (error) {
      if (
        axios.isAxiosError(error)
      ) {
        setError(
          error.response?.data
            ?.error?.message ||
            "Unable to update task"
        );
      } else {
        setError(
          "Unable to update task"
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <h1>Tasks</h1>

          <p>
            {user?.role ===
            "DEVELOPER"
              ? "Your assigned tasks"
              : "Manage project tasks"}
          </p>
        </div>
      </div>

      <section
        className="panel"
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border:
                  "1px solid #d7deea",
              }}
            >
              <option value="">
                All statuses
              </option>

              {statusOptions
                .filter(Boolean)
                .map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {formatStatus(
                        option
                      )}
                    </option>
                  )
                )}
            </select>
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Priority
            </span>

            <select
              value={priority}
              onChange={(event) =>
                updateFilter(
                  "priority",
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border:
                  "1px solid #d7deea",
              }}
            >
              <option value="">
                All priorities
              </option>

              {priorityOptions
                .filter(Boolean)
                .map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
            </select>
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Due date
            </span>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                updateFilter(
                  "dueDate",
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: "8px",
                border:
                  "1px solid #d7deea",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "end",
            }}
          >
            <button
              onClick={clearFilters}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border:
                  "1px solid #d7deea",
                background: "white",
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div
          className="error-message"
          style={{
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="panel">
          Loading tasks...
        </div>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <h2>
              Tasks ({tasks.length})
            </h2>
          </div>

          {tasks.length === 0 ? (
            <p>
              No tasks match the
              selected filters.
            </p>
          ) : (
            <div className="task-table-wrapper">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Developer</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Update</th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map(
                    (task) => (
                      <tr
                        key={
                          task.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              task.title
                            }
                          </strong>

                          <span className="task-subtext">
                            #
                            {
                              task.id
                            }
                          </span>
                        </td>

                        <td>
                          {
                            task
                              .project
                              .name
                          }
                        </td>

                        <td>
                          {task
                            .assignedTo
                            ?.name ||
                            "Unassigned"}
                        </td>

                        <td>
                          <span
                            className={`priority-badge priority-${task.priority.toLowerCase()}`}
                          >
                            {
                              task.priority
                            }
                          </span>
                        </td>

                        <td>
                          <span className="status-badge">
                            {formatStatus(
                              task.status
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              task.isOverdue &&
                              task.status !==
                                "DONE"
                                ? "overdue-text"
                                : ""
                            }
                          >
                            {formatDate(
                              task.dueDate
                            )}

                            {task.isOverdue &&
                              task.status !==
                                "DONE" &&
                              " · Overdue"}
                          </span>
                        </td>

                        <td>
                          <select
                            value={
                              task.status
                            }
                            disabled={
                              updatingId ===
                              task.id
                            }
                            onChange={(
                              event
                            ) =>
                              void updateStatus(
                                task.id,
                                event
                                  .target
                                  .value
                              )
                            }
                            style={{
                              padding:
                                "7px",
                              borderRadius:
                                "7px",
                              border:
                                "1px solid #d7deea",
                            }}
                          >
                            {statusOptions
                              .filter(
                                Boolean
                              )
                              .map(
                                (
                                  option
                                ) => (
                                  <option
                                    key={
                                      option
                                    }
                                    value={
                                      option
                                    }
                                  >
                                    {formatStatus(
                                      option
                                    )}
                                  </option>
                                )
                              )}
                          </select>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TasksPage;