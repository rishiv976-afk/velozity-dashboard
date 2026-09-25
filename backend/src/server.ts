import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import taskRoutes from "./routes/task.routes";
import notificationRoutes from "./routes/notification.routes";
import dashboardRoutes from "./routes/dashboard.routes";

import { initializeSocket } from "./sockets/socket";
import { setSocketIO } from "./sockets/socket-instance";
import { startOverdueTaskJob } from "./jobs/overdue.job";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Velozity Dashboard API is running",
  });
});

// Unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "API endpoint not found",
    },
  });
});

// HTTP + WebSocket server
const httpServer = createServer(app);

const io = initializeSocket(httpServer);

setSocketIO(io);

// Background jobs
startOverdueTaskJob();

httpServer.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  console.log(
    "Socket.io server initialized"
  );
});