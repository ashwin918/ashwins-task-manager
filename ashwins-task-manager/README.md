# 🚀 Ashwin's Task Manager

A full-stack office task management system with Admin and Employee roles.

---

## ⚙️ SETUP INSTRUCTIONS

### STEP 1 — PostgreSQL Database

1. Open **pgAdmin** and connect to your server
2. Create a new database named: `ashwins_task_manager`
3. Right-click the database → **Query Tool**
4. Open and paste the contents of `database.sql`
5. Click **▶ Execute** (F5)

---

### STEP 2 — Backend Setup

1. Open a terminal, navigate to the `backend` folder:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Open `backend/.env` and update your PostgreSQL password:
   ```
   DB_PASSWORD=your_actual_postgres_password
   ```
   (Keep everything else the same if you used default settings)

4. Start the backend server:
   ```
   npm run dev
   ```
   You should see: `🚀 Server running on port 5000` and `✅ Connected to PostgreSQL database`

---

### STEP 3 — Frontend Setup

1. Open a **new terminal**, navigate to the `frontend` folder:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend:
   ```
   npm start
   ```
   The app will open at: **http://localhost:3000**

---

## 🔐 Login Credentials

| Role     | Username | Password |
|----------|----------|----------|
| Admin    | admin    | admin    |
| Employee | (set by admin) | (set by admin) |

---

## 📋 Features

### Admin
- Dashboard with team statistics
- Add / Edit / Remove employees with unique credentials
- Assign tasks to employees with priority & due date
- Monitor all tasks and progress in real-time

### Employee
- Personal dashboard with task overview
- View assigned tasks with full details
- Update completion percentage (0–100%) with a slider
- Add comments when updating progress
- Full activity log per task

---

## 🗂️ Project Structure

```
ashwins-task-manager/
├── database.sql          ← Run this in pgAdmin first!
├── backend/
│   ├── .env              ← Update DB_PASSWORD here
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── employees.js
│       └── tasks.js
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/AuthContext.js
        ├── components/Layout.js
        └── pages/
            ├── Login.js
            ├── AdminDashboard.js
            ├── AdminTasks.js
            ├── Employees.js
            ├── EmpDashboard.js
            └── EmpTasks.js
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6, Axios
- **Backend**: Node.js, Express.js, JWT Auth
- **Database**: PostgreSQL
- **Fonts**: Syne + DM Sans (Google Fonts)
