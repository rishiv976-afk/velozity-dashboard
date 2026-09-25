import { Router } from "express";

import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.get("/:id", getProjectById);

router.post(
  "/",
  authorize("ADMIN", "PROJECT_MANAGER"),
  createProject
);

router.patch(
  "/:id",
  authorize("ADMIN", "PROJECT_MANAGER"),
  updateProject
);

router.delete(
  "/:id",
  authorize("ADMIN", "PROJECT_MANAGER"),
  deleteProject
);

export default router;