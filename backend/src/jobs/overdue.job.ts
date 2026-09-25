import cron from "node-cron";
import { TaskStatus } from "@prisma/client";

import prisma from "../config/prisma";

export const startOverdueTaskJob = () => {
  // Run once immediately when the server starts.
  void updateOverdueTasks();

  // Then check every minute.
  cron.schedule("* * * * *", () => {
    void updateOverdueTasks();
  });

  console.log("Overdue task scheduler initialized");
};

const updateOverdueTasks = async () => {
  try {
    const now = new Date();

    const markedOverdue = await prisma.task.updateMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          not: TaskStatus.DONE,
        },
        isOverdue: false,
      },
      data: {
        isOverdue: true,
      },
    });

    const clearedOverdue = await prisma.task.updateMany({
      where: {
        OR: [
          {
            dueDate: {
              gte: now,
            },
            isOverdue: true,
          },
          {
            status: TaskStatus.DONE,
            isOverdue: true,
          },
        ],
      },
      data: {
        isOverdue: false,
      },
    });

    if (
      markedOverdue.count > 0 ||
      clearedOverdue.count > 0
    ) {
      console.log(
        `Overdue job: marked ${markedOverdue.count}, cleared ${clearedOverdue.count}`
      );
    }
  } catch (error) {
    console.error(
      "Overdue task scheduler error:",
      error
    );
  }
};