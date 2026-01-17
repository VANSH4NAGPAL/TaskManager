# Primetrade Project - Complete Technical Breakdown

This document provides an exhaustive list of all technologies, architectural decisions, and specific features implemented in the Primetrade project. It is designed to be used as a reference for a Full Stack Developer resume or portfolio.

## 🏗️ Project Architecture
- **Architecture Style:** Decoupled Client-Server Monorepo
- **Frontend:** Next.js 15 (App Router) Single Page Application (SPA)
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL (Relational) with Prisma ORM
- **Communication:** REST API + Server-Sent Events (SSE) for Real-time Streaming

---

## 💻 Frontend Ecosystem (Next.js & React)

### Core Technologies
- **Next.js 15+ (App Router):** Utilized for file-based routing, server-side rendering (SSR), and simplified deployment.
- **React 19:** Leveraging latest features like Actions and optimistic UI updates.
- **TypeScript:** Strict type safety (Interfaces for Task, User, API Responses) to prevent runtime errors.
- **Tailwind CSS 4:** Utility-first styling engine used for a completely custom, responsive design system without component library bloat.

### State Management & Data Fetching
- **TanStack Query (React Query) v5:**
  - **Server State Management:** Handles caching, deduping, and background refetching of data.
  - **Optimistic Updates:** Immediate UI reflection of actions (e.g., deleting a task) before server confirmation.
  - **Auto-Refetching:** Polling strategies for Notifications to keep data fresh.
- **React Context API:** Used for global Authentication state (`AuthProvider`) and Theme management.

### UI/UX & Components
- **Framer Motion:** Implemented for complex animations:
  - Page transitions
  - Modal presence (enter/exit animations)
  - Staggered list animations
  - Dropdowns and expandable panels
- **Tiptap Editor:** Headless, block-based Rich Text Editor integration. Customized for Markdown support, placeholder handling, and clean output sanitized for specific HTML tags.
- **dnd-kit:** Modern, lightweight drag-and-drop library used for the Kanban Board view (Sortable/Draggable contexts).
- **Lucide React:** Consistent, lightweight SVG icon system.
- **Sonner:** High-performance toast notification system for user feedback (Success/Error states).
- **Radix UI / Shadcn Concepts:** Used patterns like `class-variance-authority` (CVA) and `clsx` for building reusable accessible components (Buttons, Inputs, Modals).

### Form Handling & Validation
- **React Hook Form:** Uncontrolled form inputs for performance optimization.
- **Zod:** Schema-based validation library used for:
  - Form input validation (email formats, password strength).
  - API response parsing to ensure data integrity.

### Specific Features Implemented
- **Responsive Mobile-First Design:** Complex grid layouts that stack on mobile (`grid-cols-4` -> `grid-cols-2`), collapsible filters, and adaptive padding `sm:` breakpoints.
- **Keyboard Shortcuts:** Global event listeners for power-user navigation (`C` to create, `CMD+K` to search).
- **Safety UI Patterns:** "Countdown Buttons" for destructive actions (e.g., "Delete Forever" requires holding or waiting) to prevent accidental data loss.

---

## 🛠️ Backend Infrastructure (Node.js)

### Core Technologies
- **Node.js & Express.js v5:** Modern backend framework chosen for its robust middleware ecosystem and async support.
- **TypeScript:** Full backend type safety mirroring frontend types.

### Database & ORM
- **PostgreSQL:** Reliable relational database chosen for structured data (Tasks, Users, Relations).
- **Prisma ORM:**
  - **Schema Modeling:** Declarative `schema.prisma` defining complex relationships (One-to-Many for Tasks, Many-to-Many for Collaboration).
  - **Migrations:** Version-controlled database schema changes.
  - **Type-Safe Queries:** Auto-generated TypeScript client preventing SQL injection and type mismatches.

### Authentication & Security
- **JWT (JSON Web Tokens):** Stateless authentication mechanism.
- **bcrypt:** Industry-standard password hashing with salting.
- **Helmet:** Sets secure HTTP headers (X-Frame-Options, HSTS, etc.) to prevent common web vulnerabilities.
- **Express Rate Limit:** Middleware to prevent DDoS and Brute-force attacks.
- **CORS Config:** Strict origin policies to allow only the specific frontend domain.
- **Input Sanitization:** Custom regex and Zod schemas to strip dangerous characters and validate all incoming request bodies.

### AI Integration (LLM Engineering)
- **Groq SDK:** Integration with high-performance LLM inference engine.
- **Server-Sent Events (SSE):** Custom implementation of streaming responses to pipe AI output token-by-token to the frontend.
- **Prompt Engineering:** Context-aware prompts that inject User Tasks into the LLM context for relevant advice.
- **Safety Filtering:**
  - **Regex Engines:** Custom pattern matching engines to block unsafe content (violence, injection attacks) with word-boundary detection (`\b`).
  - **Latency Tracking:** Real-time measurement of "Time to First Token" (TTFT) for monitoring AI performance.

### API Architecture
- **RESTful Endpoints:** Standardized resource-based routing (`/tasks`, `/auth`, `/users`).
- **Middleware Pattern:** utilized for Authentication checks (`requireAuth`), Error Handling, and Logging (`morgan`).

---

## 🚀 Key Workflows & Systems

### 1. The Collaboration System
- **Role-Based Access Control (RBAC):** Tasks have `OWNER`, `EDITOR`, and `VIEWER` permissions.
- **Sharing Logic:** Users can invite others via email. The backend verifies user existence and creates relation records.
- **Invite Handling:** Logic to prevent self-invites or duplicate access.

### 2. The Task Management Engine
- **Views:** Switchable layouts: List View (Table), Kanban Board (Columns), and Calendar View (Date-based).
- **Filtering & Search:** Client-side filtering for immediate feedback combined with server-side query capabilities.
- **Soft Delete:** "Trash Bin" system where items are flagged `deletedAt` rather than removed, allowing for a 7-day restoration window.

### 3. The AI Assistant
- **Contextual Awareness:** The AI knows the user's current task title and description to generate relevant subtasks.
- **Steaming Response:** Implementation of a custom `TextDecoder` stream reader on the frontend to display text progressively (Typewriter effect) without blocking the UI.
