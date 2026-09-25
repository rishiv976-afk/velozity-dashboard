import { Router } from "express";
import {
  createTask,
  getTaskById,
  getTasks,
  updateTaskStatus,
} from "../controllers/task.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getTasks);
router.get("/:id", getTaskById);

router.post(
  "/",
  authorize("ADMIN", "PROJECT_MANAGER"),
  createTask
);

router.patch(
  "/:id/status",
  authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  updateTaskStatus
);

export default router;