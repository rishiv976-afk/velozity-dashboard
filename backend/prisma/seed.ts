import {
  PrismaClient,
  Role,
  TaskStatus,
  Priority,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // Demo password for seeded users
  const passwordHash = await bcrypt.hash("Password@123", 12);

  // -------------------------------------------------------
  // USERS
  // -------------------------------------------------------

  const admin = await prisma.user.create({
    data: {
      name: "Arun Admin",
      email: "admin@velozity.test",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: "Priya Manager",
      email: "pm1@velozity.test",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: "Karthik Manager",
      email: "pm2@velozity.test",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      name: "Ravi Developer",
      email: "dev1@velozity.test",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      name: "Meena Developer",
      email: "dev2@velozity.test",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      name: "Vijay Developer",
      email: "dev3@velozity.test",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      name: "Divya Developer",
      email: "dev4@velozity.test",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  // -------------------------------------------------------
  // CLIENTS
  // -------------------------------------------------------

  const client1 = await prisma.client.create({
    data: {
      name: "Acme Technologies",
      email: "contact@acme.test",
      phone: "+91 9000000001",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Nova Retail",
      email: "contact@nova.test",
      phone: "+91 9000000002",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Orbit Finance",
      email: "contact@orbit.test",
      phone: "+91 9000000003",
    },
  });

  // -------------------------------------------------------
  // PROJECTS
  // -------------------------------------------------------

  const project1 = await prisma.project.create({
    data: {
      name: "Acme Customer Portal",
      description: "Customer self-service web portal",
      clientId: client1.id,
      createdById: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Nova Commerce Platform",
      description: "E-commerce platform for Nova Retail",
      clientId: client2.id,
      createdById: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Orbit Finance Dashboard",
      description: "Financial analytics dashboard",
      clientId: client3.id,
      createdById: pm2.id,
    },
  });

  const now = new Date();

  const futureDate = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const pastDate = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // -------------------------------------------------------
  // PROJECT 1 TASKS
  // -------------------------------------------------------

  const task1 = await prisma.task.create({
    data: {
      title: "Create login interface",
      description: "Build responsive login interface",
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: futureDate(2),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Implement authentication API",
      description: "JWT authentication endpoints",
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.CRITICAL,
      dueDate: futureDate(1),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Customer profile page",
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: futureDate(5),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Fix profile validation",
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: pastDate(2),
      isOverdue: true,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Database integration",
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: pastDate(1),
    },
  });

  // -------------------------------------------------------
  // PROJECT 2 TASKS
  // -------------------------------------------------------

  const task6 = await prisma.task.create({
    data: {
      title: "Product catalogue",
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: futureDate(3),
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: "Shopping cart",
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: Priority.CRITICAL,
      dueDate: futureDate(4),
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: "Checkout API",
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: Priority.CRITICAL,
      dueDate: futureDate(6),
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: "Order history",
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.MEDIUM,
      dueDate: futureDate(2),
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: "Payment integration",
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: Priority.CRITICAL,
      dueDate: pastDate(3),
      isOverdue: true,
    },
  });

  // -------------------------------------------------------
  // PROJECT 3 TASKS
  // -------------------------------------------------------

  const task11 = await prisma.task.create({
    data: {
      title: "Dashboard layout",
      projectId: project3.id,
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      dueDate: pastDate(2),
    },
  });

  const task12 = await prisma.task.create({
    data: {
      title: "Revenue analytics",
      projectId: project3.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: futureDate(2),
    },
  });

  const task13 = await prisma.task.create({
    data: {
      title: "Transaction report",
      projectId: project3.id,
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: futureDate(4),
    },
  });

  const task14 = await prisma.task.create({
    data: {
      title: "Export reports",
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: futureDate(7),
    },
  });

  const task15 = await prisma.task.create({
    data: {
      title: "Financial charts",
      projectId: project3.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.HIGH,
      dueDate: futureDate(1),
    },
  });

  // -------------------------------------------------------
  // ACTIVITY HISTORY
  // -------------------------------------------------------

  await prisma.activityLog.createMany({
    data: [
      {
        taskId: task1.id,
        projectId: project1.id,
        userId: dev1.id,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
      },
      {
        taskId: task2.id,
        projectId: project1.id,
        userId: dev2.id,
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
      },
      {
        taskId: task6.id,
        projectId: project2.id,
        userId: dev3.id,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
      },
      {
        taskId: task9.id,
        projectId: project2.id,
        userId: dev4.id,
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
      },
      {
        taskId: task11.id,
        projectId: project3.id,
        userId: dev1.id,
        oldStatus: TaskStatus.IN_REVIEW,
        newStatus: TaskStatus.DONE,
      },
      {
        taskId: task12.id,
        projectId: project3.id,
        userId: dev2.id,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
      },
      {
        taskId: task15.id,
        projectId: project3.id,
        userId: dev2.id,
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
      },
    ],
  });

  // -------------------------------------------------------
  // INITIAL NOTIFICATIONS
  // -------------------------------------------------------

  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        taskId: task1.id,
        message: `You were assigned to "${task1.title}"`,
      },
      {
        userId: dev2.id,
        taskId: task2.id,
        message: `You were assigned to "${task2.title}"`,
      },
      {
        userId: pm1.id,
        taskId: task2.id,
        message: `"${task2.title}" was moved to In Review`,
      },
    ],
  });

  console.log("✅ Seed completed successfully.");
  console.log("");
  console.log("Demo accounts:");
  console.log("Admin:     admin@velozity.test");
  console.log("PM 1:      pm1@velozity.test");
  console.log("PM 2:      pm2@velozity.test");
  console.log("Developer: dev1@velozity.test");
  console.log("Password:  Password@123");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });