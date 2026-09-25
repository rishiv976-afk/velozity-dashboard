# Velozity Real-Time Project Dashboard

A full-stack real-time client project management dashboard built with React, TypeScript, Node.js, Express, PostgreSQL, Prisma, Socket.io, and JWT authentication.

The application provides role-based dashboards and project/task access for Administrators, Project Managers, and Developers.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Socket.io Client

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.io
- JWT
- bcrypt
- node-cron

---

## Features

### Authentication

- JWT access token authentication
- Refresh token authentication
- Refresh token stored in an HttpOnly cookie
- Automatic frontend access-token refresh
- Secure logout flow

### Role-Based Access Control

#### Admin

- View all projects and tasks
- Manage users
- Manage clients
- Manage projects
- View activity across all projects
- View live online-user count

#### Project Manager

- View only projects created by the logged-in Project Manager
- Create and manage own projects
- Create and manage tasks inside own projects
- View only activity related to own projects
- Receive notifications when tasks move to `IN_REVIEW`

#### Developer

- View only assigned tasks
- Cannot access tasks assigned to other Developers
- Update status of assigned tasks
- View activity related only to assigned tasks
- Receive task-assignment notifications

RBAC is enforced at the API level and is not dependent on frontend route hiding.

---

## Project and Task Management

Projects contain tasks with:

- Title
- Description
- Assigned Developer
- Status
- Priority
- Due date
- Overdue flag

Supported statuses:

- `TODO`
- `IN_PROGRESS`
- `IN_REVIEW`
- `DONE`

Supported priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Tasks can be filtered by:

- Status
- Priority
- Due date

Developer tasks are ordered primarily by priority and then by due date.

---

## Real-Time Activity Feed

Socket.io is used for real-time communication.

When a task status changes:

1. The task status is updated inside PostgreSQL.
2. An ActivityLog record is created.
3. The database transaction is committed.
4. The event is broadcast through Socket.io.

Real-time activity visibility is role-filtered:

- Admin receives activity from all projects.
- Project Managers receive activity from projects they created.
- Developers receive activity only for tasks assigned to them.

When a user reconnects, the latest 20 authorized activity records are loaded from PostgreSQL.

Socket.io was selected because it provides reliable bidirectional communication, automatic reconnection support, event-based messaging, and room-based authorization.

---

## Notifications

Notifications are stored in PostgreSQL.

Notifications are generated when:

- A task is assigned to a Developer.
- A task is moved to `IN_REVIEW`, notifying the Project Manager who owns the project.

Features include:

- Real-time notification delivery
- Unread notification count
- Notification dropdown
- Mark individual notification as read
- Mark all notifications as read

---

## Overdue Task Scheduler

A `node-cron` background job checks tasks every minute.

A task is automatically marked overdue when:

- Its due date has passed.
- Its status is not `DONE`.

Completed tasks are automatically cleared from the overdue state.

---

## Database Design

PostgreSQL is used as the relational database with Prisma ORM.

Main models:

- User
- Client
- Project
- Task
- ActivityLog
- Notification

Relationships are enforced using foreign keys.

Indexes are included for commonly queried fields such as:

- User role
- Project creator
- Task assignee
- Task status
- Task priority
- Task due date
- Overdue status
- Activity project/timestamp
- Notification unread state

---

## Project Structure

```text
velozity-dashboard/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── jobs/
│       ├── middleware/
│       ├── routes/
│       ├── sockets/
│       ├── utils/
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
│
└── README.md