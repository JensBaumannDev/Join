# Join – Kanban Project Management Application

An agile, collaborative project management application inspired by Kanban boards, developed as a group project within the Developer Akademie.

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A live demo is available at: [jensbaumandev.github.io/join](https://jensbaumandev.github.io/join/)

---

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Installation & Setup](#installation--setup)
5. [Project Structure](#project-structure)
6. [Documentation](#documentation)
7. [Contributors](#contributors)

---

## Introduction

**Join** is a client-side web application designed to facilitate team task coordination and workflow visualization. Emulating Kanban methodology, the platform allows teams to distribute tasks, monitor state transitions, and maintain a centralized contact directory.

This application is built with **Angular 21** using **Signals** for state propagation, integrated with a **Supabase** backend for authentication and data persistence.

---

## Features

* **User Authentication & Authorization:** Secure registration and login workflows via Supabase, including an instantaneous Guest Login mode for evaluation.
* **Kanban Board:** Multi-column board layout partitioned into *To Do*, *In Progress*, *Await Feedback*, and *Done* states. Tasks can be shifted between categories using interactive controls and drag-and-drop actions.
* **Task Management:** Form-based task creation supporting titles, descriptions, due dates, priority tiers (Low, Medium, Urgent), categories, and dynamic subtask lists.
* **Contact Directory:** CRUD operations for contact management. Color-coded initials-based avatars are generated automatically upon contact creation.
* **Dashboard Summary:** Overview statistics displaying high-priority deadlines, total task counts, and state summaries alongside context-aware greetings.

---

## Tech Stack

* **Frontend Framework:** Angular 21 (utilizing reactive Signals)
* **Programming Language:** TypeScript
* **Database & Auth Backend:** Supabase (PostgreSQL, Row Level Security)
* **Styling:** CSS3 / SCSS (utilizing custom variables, Flexbox, and CSS Grid)
* **Unit Testing:** Vitest
* **Documentation Generator:** Compodoc (JSDoc-compliant)

---

## Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18 or higher)
* npm (Node Package Manager)

### 1. Clone the repository
```bash
git clone https://github.com/JensBaumannDev/Join.git
cd Join
```

### 2. Install package dependencies
```bash
npm install
```

### 3. Configure Supabase Credentials
To connect the application to your own Supabase instance, update your environment configuration file at `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

### 4. Run the development server
```bash
npm run start
```
The application will launch and compile. Navigate to `http://localhost:4200` in your web browser.

---

## Project Structure

A high-level directory tree outlining the Angular application structure:

```text
join/
├── src/
│   ├── app/
│   │   ├── components/      # Shared presentation components (Avatar, layouts, etc.)
│   │   ├── pages/           # Routed view components (Board, Contacts, Summary, Authentication)
│   │   ├── services/        # Service layer managing business logic and API requests
│   │   └── app.routes.ts    # Application routing definitions
│   ├── assets/              # Static assets, branding, and icons
│   ├── index.html           # Main document template
│   └── main.ts              # Angular entry point
├── angular.json             # Workspace configuration
├── package.json             # Project dependencies and script runner configurations
└── README.md                # Project documentation
```

---

## Documentation

Code documentation is maintained using JSDoc formatting. You can compile and host an interactive HTML documentation site using Compodoc:

```bash
npm run docs
```
This builds the site and starts a local web server at `http://localhost:8080`.

---

## Contributors

This application was collaboratively developed by the following team members:

| Contributor | GitHub | LinkedIn |
| :--- | :--- | :--- |
| **Jens Baumann** | [@JensBaumannDev](https://github.com/JensBaumannDev) | [Jens Baumann](https://www.linkedin.com/in/jens-baumann-7a6866315/) |
| **Julia Keller** | [@JuliaKeller13](https://github.com/JuliaKeller13) | *Coming soon* |
| **Temirlan Gashimov** | [@TemirlanGashimov](https://github.com/TemirlanGashimov) | *Coming soon* |
| **Mario Ramirez** | [@marioramirez90](https://github.com/marioramirez90) | *Coming soon* |

---
Developed as part of the software engineering curriculum at the [Developer Akademie](https://developerakademie.com/).
