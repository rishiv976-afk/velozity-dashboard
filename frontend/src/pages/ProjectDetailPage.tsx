import {
  useEffect,
  useState,
} from "react";

import axios from "axios";
import {
  Link,
  useParams,
} from "react-router-dom";

import { api } from "../services/api";

interface AssignedUser {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
  assignedTo: AssignedUser | null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;

  client: {
    id: number;
    name: string;
  };

  tasks: Task[];
}

interface ProjectResponse {
  success: boolean;
  data: Project;
}

const formatStatus = (status: string) => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const ProjectDetailPage = () => {
  const { id } = useParams();

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response =
          await api.get<ProjectResponse>(
            `/projects/${id}`
          );

        setProject(response.data.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(
            error.response?.data?.error
              ?.message ||
              "Unable to load project"
          );
        } else {
          setError(
            "Unable to load project"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="page-section">
        <div className="panel">
          Loading project...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-section">
        <div className="error-message">
          {error || "Project not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <Link
            to="/projects"
            className="back-link"
          >
            ← Back to projects
          </Link>

          <h1>{project.name}</h1>

          <p>
            {project.description ||
              "No description provided."}
          </p>
        </div>

        <div className="project-client-badge">
          {project.client.name}
        </div>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Tasks</h2>
            <p>
              {project.tasks.length} task
              {project.tasks.length === 1
                ? ""
                : "s"}{" "}
              in this project
            </p>
          </div>
        </div>

        {project.tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          <div className="task-table-wrapper">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>

              <tbody>
                {project.tasks.map(
                  (task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>
                          {task.title}
                        </strong>

                        <span className="task-subtext">
                          #{task.id}
                        </span>
                      </td>

                      <td>
                        {task.assignedTo
                          ?.name ||
                          "Unassigned"}
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
                          className={`priority-badge priority-${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
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
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectDetailPage;