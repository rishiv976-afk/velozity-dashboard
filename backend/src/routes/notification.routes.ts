import { Router } from "express";

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);

router.get(
  "/unread-count",
  getUnreadCount
);

router.patch(
  "/read-all",
  markAllNotificationsRead
);

router.patch(
  "/:id/read",
  markNotificationRead
);

export default router;