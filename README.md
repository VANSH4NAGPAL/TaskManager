# PrimeDashboard - Scalable Task Management System

<div align="center">

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**[Live Demo](https://task-manager-ten-omega-60.vercel.app) • [API Documentation](#-api-documentation) • [GitHub Repo](https://github.com/VANSH4NAGPAL/TaskManager)**

A modern, scalable, and secure full-stack web application with authentication and task management dashboard.

**🌐 Live Application:** [https://task-manager-ten-omega-60.vercel.app](https://task-manager-ten-omega-60.vercel.app)  
**🔗 Backend API:** [https://taskmanager-production-622d.up.railway.app](https://taskmanager-production-622d.up.railway.app)

</div>

---

## 👨‍💻 About the Developer

**Vansh Nagpal**

Full Stack Developer experienced in building web applications using React, Tailwind CSS, and JavaScript, with
backend integration using Firebase. Worked on UI implementation, animations, authentication, API integration, and
image optimization across client and academic projects

**Skills Demonstrated:** React.js, Next.js, TypeScript, Node.js, Express, Prisma ORM, PostgreSQL, JWT Authentication, Zod Validation, RESTful APIs, Framer Motion, React Query, Responsive Design, State Management, Security Best Practices

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Scalability & Production Notes](#-scalability--production-notes)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)

---

## 🎯 About the Project

**PrimeDashboard** is a full-stack web application that combines a beautiful, minimal frontend with a robust backend to deliver a complete task management solution. Built with modern technologies and best practices, it showcases:

- **Secure Authentication** with JWT tokens and HTTP-only refresh cookies
- **Real-time Task Management** with CRUD operations, search, and filtering
- **Responsive Design** with smooth animations and minimal aesthetic
- **RESTful API** with proper error handling and validation
- **Production-Ready Code** with TypeScript, proper project structure, and scalability in mind

### Why This Project?

This project showcases my ability to:
- Build scalable, modern web applications from scratch
- Integrate frontend and backend seamlessly
- Implement security best practices
- Write clean, maintainable, and well-documented code
- Think about production deployment and scaling

---

## ✨ Features

### 🔐 Authentication System
- ✅ User registration with email and password
- ✅ Secure login with JWT access tokens (15 min expiry)
- ✅ HTTP-only refresh tokens (7 day expiry)
- ✅ Password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Secure logout (token invalidation)
- ✅ Protected routes with middleware
- ✅ Duplicate email detection

### 📊 Dashboard Features
- ✅ User profile display (name, email, total tasks)
- ✅ Task status analytics (To Do, In Progress, Done)
- ✅ Real-time task counts with animated number transitions
- ✅ Create, Read, Update, Delete tasks
- ✅ Search tasks with debounced input (500ms)
- ✅ Filter by status (All, To Do, In Progress, Done)
- ✅ Tag-based organization
- ✅ Custom delete confirmation modal
- ✅ Responsive grid layout

### 🎨 UI/UX Excellence
- ✅ Minimal, clean black/white aesthetic
- ✅ Smooth page transitions with Framer Motion
- ✅ Animated SVG curved backgrounds
- ✅ Bouncing dots loader
- ✅ Staggered entrance animations
- ✅ Hover effects and micro-interactions
- ✅ Glass morphism effects on auth pages
- ✅ Fully responsive (mobile, tablet, desktop)

### 🛡️ Security Features
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token validation middleware
- ✅ HTTP-only cookies for refresh tokens
- ✅ CORS configuration
- ✅ Rate limiting (1000 requests/minute)
- ✅ Input validation with Zod (frontend) and manual checks (backend)
- ✅ SQL injection protection via Prisma ORM
- ✅ Error messages without sensitive data leakage

### 🚀 Developer Experience
- ✅ TypeScript for type safety
- ✅ Modular, scalable code structure
- ✅ React Query for efficient data fetching
- ✅ React Hook Form for optimized forms
- ✅ Toast notifications for user feedback
- ✅ Environment variable configuration
- ✅ Comprehensive error handling

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16.1.1** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript 5.9** | Type safety |
| **TailwindCSS 4** | Utility-first styling |
| **Framer Motion 11** | Animations |
| **React Query** | Server state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express 5.2.1** | Web framework |
| **TypeScript 5.9** | Type safety |
| **Prisma 5.16.1** | ORM for database |
| **PostgreSQL (Supabase)** | Relational database |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **express-rate-limit** | API rate limiting |

---

## 🏗️ Architecture

### System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │         │              │         │             │
│   Browser   │ ◄─────► │   Next.js    │ ◄─────► │   Express   │
│   (Client)  │   HTTP  │  (Frontend)  │   API   │  (Backend)  │
│             │         │              │         │             │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                                                         │ Prisma
                                                         │
                                                  ┌──────▼──────┐
                                                  │             │
                                                  │  PostgreSQL │
                                                  │  (Supabase) │
                                                  │             │
                                                  └─────────────┘
```

### Authentication Flow

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│  Client │                  │  Server │                  │ Database │
└────┬────┘                  └────┬────┘                  └────┬─────┘
     │                            │                            │
     │ POST /auth/signup          │                            │
     ├───────────────────────────►│                            │
     │                            │ Hash password (bcrypt)     │
     │                            │ Store user                 │
     │                            ├───────────────────────────►│
     │                            │◄───────────────────────────┤
     │                            │ Generate JWT tokens        │
     │◄───────────────────────────┤                            │
     │ Set-Cookie: refreshToken   │                            │
     │ { accessToken, user }      │                            │
     │                            │                            │
     │ GET /tasks                 │                            │
     │ Authorization: Bearer ...  │                            │
     ├───────────────────────────►│                            │
     │                            │ Verify JWT                 │
     │                            │ Fetch tasks for user       │
     │                            ├───────────────────────────►│
     │                            │◄───────────────────────────┤
     │◄───────────────────────────┤                            │
     │ { tasks: [...] }           │                            │
     │                            │                            │
```

### Project Structure

```
Primetrade/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/page.tsx      # Login page
│   │   │   ├── signup/page.tsx     # Signup page
│   │   │   ├── dashboard/page.tsx  # Main dashboard
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── globals.css         # Global styles
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── modal.tsx
│   │   │   │   ├── loader.tsx
│   │   │   │   └── ...
│   │   │   └── providers.tsx       # React Query provider
│   │   ├── hooks/
│   │   │   └── useAuth.ts          # Auth hooks
│   │   └── lib/
│   │       └── api.ts              # API client
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts                # Express server entry
│   │   ├── middleware/
│   │   │   └── auth.ts             # JWT verification
│   │   └── routes/
│   │       ├── auth.ts             # Auth endpoints
│   │       └── tasks.ts            # Task CRUD endpoints
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/primetrade.git
   cd primetrade
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your database URL and JWT secrets
   
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Start backend server
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env.local file
   cp .env.example .env.local
   # Edit .env.local with your API URL
   
   # Start frontend development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_ACCESS_SECRET=your-secret-key-minimum-32-chars
JWT_REFRESH_SECRET=your-secret-key-minimum-32-chars
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=7
REFRESH_COOKIE_DOMAIN=localhost
REFRESH_COOKIE_SECURE=false
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=1000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 📡 API Documentation

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/auth/refresh`
Refresh access token using HTTP-only refresh cookie.

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/auth/logout`
Invalidate refresh token.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/auth/me`
Get current user profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Task Endpoints (Protected)

All task endpoints require `Authorization: Bearer <accessToken>` header.

#### GET `/tasks`
List all tasks for authenticated user.

**Query Parameters:**
- `q` (optional): Search query
- `status` (optional): Filter by status (TODO, IN_PROGRESS, DONE)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "TODO",
    "tags": ["urgent", "frontend"],
    "createdAt": "2026-01-09T10:00:00Z",
    "updatedAt": "2026-01-09T10:00:00Z"
  }
]
```

#### POST `/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "status": "TODO",
  "tags": ["urgent", "frontend"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "Task description",
  "status": "TODO",
  "tags": ["urgent", "frontend"],
  "createdAt": "2026-01-09T10:00:00Z",
  "updatedAt": "2026-01-09T10:00:00Z"
}
```

#### PUT `/tasks/:id`
Update an existing task.

**Request Body (all fields optional):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "tags": ["urgent"]
}
```

#### DELETE `/tasks/:id`
Delete a task.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## 🔒 Security

### Implemented Security Measures

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - No plaintext passwords stored
   - Minimum password validation

2. **Token Security**
   - JWT with strong secrets (>= 32 chars)
   - Short-lived access tokens (15 minutes)
   - HTTP-only refresh cookies (7 days)
   - Token validation on every protected request

3. **API Security**
   - CORS configured for allowed origins
   - Rate limiting (1000 requests/minute)
   - Input validation
   - Proper error messages without leaking sensitive data

4. **Database Security**
   - Prisma ORM prevents SQL injection
   - User-scoped queries (users only access their own data)
   - Database connection string in environment variables

5. **Frontend Security**
   - Protected routes with authentication checks
   - No tokens in localStorage (XSS protection)
   - Form validation with Zod
   - Secure cookie settings in production

---

## 📈 Scalability & Production Notes

### Current Architecture Strengths

✅ **Modular Code Structure** - Easy to add new features
✅ **TypeScript** - Catches errors at compile time
✅ **Prisma ORM** - Database-agnostic, easy to switch DBs
✅ **Stateless Backend** - Horizontal scaling ready
✅ **React Query** - Built-in caching and background refetching
✅ **Environment Variables** - Easy configuration management

### Scaling for Production

#### Frontend Scaling
```
Users (1M+) → CDN (Cloudflare) → Load Balancer
                                      ↓
                               ┌──────┴──────┐
                               │             │
                           Vercel Edge    Vercel Edge
                           (Region 1)     (Region 2)
```

**Recommendations:**
- Deploy on **Vercel** for automatic edge caching
- Enable **Image Optimization** (Next.js built-in)
- Implement **Code Splitting** (already done with App Router)
- Add **Service Worker** for offline support
- Use **Redis** for React Query cache persistence
- Implement **Websockets** for real-time updates

#### Backend Scaling
```
                    Load Balancer (NGINX)
                           ↓
         ┌─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
    Express (1)       Express (2)       Express (3)
         ↓                 ↓                 ↓
         └─────────────────┼─────────────────┘
                           ↓
                   PostgreSQL (Primary)
                           ↓
                   PostgreSQL (Replica)
```

**Recommendations:**
- **Containerize with Docker** - Consistent deployments
- **Kubernetes** for orchestration
- **Redis** for session storage and caching
- **Database Read Replicas** for query scaling
- **Connection Pooling** (Prisma already supports this)
- **Microservices** - Split auth and tasks into separate services
- **Message Queue** (RabbitMQ/Kafka) for async operations
- **Monitoring** (Datadog, New Relic)
- **Logging** (Winston, Elasticsearch)

#### Database Scaling
- **Indexing** on frequently queried columns (email, userId)
- **Database Partitioning** for large task tables
- **Caching Layer** (Redis) for frequently accessed data
- **Full-Text Search** (Elasticsearch) for task search

#### Security Enhancements for Production
- **Refresh Token Rotation** - Issue new refresh token on each use
- **Token Revocation List** - Redis-based blacklist
- **HTTPS Only** - Enforce secure connections
- **CSP Headers** - Content Security Policy
- **Rate Limiting per User** - Not just IP-based
- **API Gateway** (Kong, AWS API Gateway)
- **Secrets Management** (AWS Secrets Manager, Vault)

#### Monitoring & Observability
```typescript
// Example: Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: req.user?.id
    });
  });
  next();
});
```

---

## ✅ Project Features Checklist

### Frontend
- [x] Built with **Next.js** (React framework)
- [x] **Responsive design** using TailwindCSS
- [x] **Forms with validation** (client + server side)
  - [x] Zod validation on frontend
  - [x] Manual validation on backend
- [x] **Protected routes** (login required for dashboard)
  - [x] Redirect to login if not authenticated
  - [x] Automatic redirect to dashboard if already logged in

### Basic Backend (Supportive)
- [x] Lightweight backend using **Node.js/Express**
- [x] APIs for:
  - [x] User signup/login (JWT-based authentication)
  - [x] Profile fetching/updating (GET /auth/me)
  - [x] CRUD operations on tasks entity
- [x] Connected to **PostgreSQL** database via Prisma

### Dashboard Features
- [x] Display **user profile** (fetched from backend)
  - [x] Name, email, total tasks
- [x] **CRUD operations** on tasks
  - [x] Create new task with modal
  - [x] View all tasks
  - [x] Update task (title, description, status, tags)
  - [x] Delete task with custom confirmation modal
- [x] **Search and filter UI**
  - [x] Debounced search (500ms)
  - [x] Status filter (All, To Do, In Progress, Done)
  - [x] Tag-based organization
- [x] **Logout flow**
  - [x] Clear tokens
  - [x] Redirect to landing page

### Security & Scalability
- [x] **Password hashing** (bcrypt with 10 rounds)
- [x] **JWT authentication middleware**
  - [x] Access token validation
  - [x] Refresh token mechanism
- [x] **Error handling & validation**
  - [x] Try-catch blocks
  - [x] Proper HTTP status codes
  - [x] User-friendly error messages
- [x] **Code structured for easy scaling**
  - [x] Modular architecture
  - [x] Separation of concerns
  - [x] Environment-based configuration

### Deliverables
- [x] **Frontend (Next.js) + Backend (Node.js)** in GitHub repo
- [x] **Functional authentication** (register/login/logout with JWT)
- [x] **Dashboard with CRUD-enabled tasks**
- [x] **API documentation** (this README)
- [x] **Scaling notes** (see Scalability section)

---

## 📸 Screenshots

### Landing Page
<img width="2557" height="1266" alt="image" src="https://github.com/user-attachments/assets/d57452c2-71bf-4806-9da6-9ff053b59134" />



### Authentication
<img width="2559" height="1268" alt="image" src="https://github.com/user-attachments/assets/c4214d6f-a0bc-460d-a200-25b7e37222b7" />



### Dashboard
<img width="2559" height="1267" alt="image" src="https://github.com/user-attachments/assets/0064df44-56a1-4423-906a-6d1c1823b982" />



### Task Management
<img width="485" height="534" alt="image" src="https://github.com/user-attachments/assets/92291337-338a-4b77-9203-87cac951caf4" />



---

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. **Prepare for deployment**
   ```bash
   # Ensure Prisma is configured for production
   npm run build
   ```

2. **Environment Variables**
   - Set all variables from `.env.example`
   - Update `DATABASE_URL` with production database
   - Set `REFRESH_COOKIE_SECURE=true`
   - Update `CORS_ORIGIN` with frontend URL

3. **Deploy to Railway**
   - Connect GitHub repository
   - Auto-deploy from main branch
   - Railway will run `npm install` and `npm start`

### Frontend Deployment (Vercel)

1. **Connect to Vercel**
   ```bash
   cd frontend
   vercel
   ```

2. **Environment Variables**
   - `NEXT_PUBLIC_API_URL` - Your backend API URL

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Post-Deployment
- Update backend `CORS_ORIGIN` with Vercel URL
- Test all authentication flows
- Verify API endpoints work with production URLs

---

## 🤝 Contributing

This is a portfolio project, but suggestions are welcome! Feel free to open an issue or submit a pull request.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 📞 Contact

**Vansh Nagpal**

- Email: nagpalvansh2004@gmail.com
- GitHub: [@VANSH4NAGPAL](https://github.com/VANSH4NAGPAL)
- LinkedIn: [Vansh Nagpal](https://linkedin.com/in/yourlinkedin)](https://www.linkedin.com/in/vansh-nagpal/)
- Portfolio: [https://vanshdev.netlify.app/](https://vanshdev.netlify.app/)

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ by Vansh Nagpal

</div>
