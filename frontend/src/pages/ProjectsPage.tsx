import {
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { Link } from "react-router-dom";

import { api } from "../services/api";

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
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

interface ProjectsResponse {
  success: boolean;
  data: Project[];
}

const ProjectsPage = () => {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response =
          await api.get<ProjectsResponse>(
            "/projects"
          );

        setProjects(response.data.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(
            error.response?.data?.error
              ?.message ||
              "Unable to load projects"
          );
        } else {
          setError(
            "Unable to load projects"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="page-section">
        <div className="panel">
          Loading projects...
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <h1>Projects</h1>
          <p>
            View projects available to your role.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {projects.length === 0 &&
      !error ? (
        <div className="panel">
          No projects found.
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const overdueCount =
              project.tasks.filter(
                (task) =>
                  task.isOverdue &&
                  task.status !== "DONE"
              ).length;

            const completedCount =
              project.tasks.filter(
                (task) =>
                  task.status === "DONE"
              ).length;

            return (
              <article
                key={project.id}
                className="project-card"
              >
                <div className="project-card-header">
                  <div>
                    <span className="project-client">
                      {project.client.name}
                    </span>

                    <h2>
                      {project.name}
                    </h2>
                  </div>

                  <span className="project-id">
                    #{project.id}
                  </span>
                </div>

                <p className="project-description">
                  {project.description ||
                    "No description provided."}
                </p>

                <div className="project-stats">
                  <div>
                    <span>Total tasks</span>
                    <strong>
                      {project.tasks.length}
                    </strong>
                  </div>

                  <div>
                    <span>Completed</span>
                    <strong>
                      {completedCount}
                    </strong>
                  </div>

                  <div>
                    <span>Overdue</span>
                    <strong>
                      {overdueCount}
                    </strong>
                  </div>
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="project-link"
                >
                  View project
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;