import { Router } from "express";

import {
  createClient,
  createUser,
  deleteClient,
  deleteUser,
  getClients,
  getUsers,
  updateClient,
  updateUserRole,
} from "../controllers/admin.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.get("/clients", getClients);
router.post("/clients", createClient);
router.patch("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);

export default router;