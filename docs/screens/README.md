# TPI — Tribunal PDF Indexing (Laravel + React)

TPI is a web application designed to help a tribunal (court office) manage, upload, index, and search PDF documents.  
The system supports role-based access (**User / Admin / Super Admin**) and includes document extraction status tracking (**pending / processing / done / failed**).

---

## 📌 Project Context (Internship)
This project was carried out during an internship in a tribunal environment.  
The work included:
- Business discovery and functional analysis
- UML + Merise data modeling (MCD)
- UI/UX mockups with Figma
- Backend (Laravel API) + Frontend (React/Vite) development
- Functional testing + bug fixing
- Project management using Jira (Scrum + Kanban) and Gantt planning

---

## ✨ Key Features

### ✅ Authentication & Security
- Login / Logout
- View profile (Me)
- Change password
- Password reset flow (Forgot/Reset)
- Bearer Token authentication (Laravel Sanctum)

### ✅ Document Management
- Upload PDF documents
- Store PDF files and metadata
- Extraction status tracking: `pending | processing | done | failed`
- Search documents
- View document details
- Download PDF

### ✅ Lookups (Reference Data)
- Divisions
- Case types
- Judges

### ✅ Admin Management
- Manage employees (create/edit/delete regular users)
- Manage divisions / case types / judges
- Dashboard KPIs (if enabled)

### ✅ Super Admin Rules
- Only Super Admin can disable/enable accounts
- Admin cannot disable accounts (especially himself or Super Admin)

---

## 🧱 Tech Stack

### Backend
- Laravel (API)
- Sanctum (Personal Access Tokens)
- MySQL
- Storage for PDFs (local filesystem)

### Frontend
- React + Vite
- React Router
- Axios
- AuthContext + route guards (RequireAuth / RequireAdmin)

---

## 📁 Repository Structure


---

## 🗃️ Database (MySQL)

### Main Tables
- `users`
- `documents`
- `divisions`
- `case_types`
- `judges`
- `personal_access_tokens` (Sanctum)

### `documents` main fields
- `file_path`, `original_filename`
- `content_text`
- `status` (default: pending)
- `extract_status` (pending/processing/done/failed)
- `extract_error`

---

## 🔐 Roles & Permissions

### User
- Authenticate
- Upload document
- Search documents
- View details
- Download PDF
- View lookups

### Admin (inherits User)
- Manage employees (CRUD regular users)
- Manage lookups (divisions, case types, judges)
- View dashboard KPIs

### Super Admin (inherits Admin)
- Disable/enable accounts

---

## ⚙️ Setup (Local Development)

### ✅ Prerequisites
- PHP 8.x
- Composer
- Node.js 18+ (recommended)
- MySQL
- Git

---

## 1) Backend (Laravel)

### Install
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

APP_NAME=TPI
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tpi
DB_USERNAME=root
DB_PASSWORD=

php artisan migrate --seed

php artisan storage:link

php artisan queue:work

php artisan serve --host=0.0.0.0 --port=8000

cd frontend
npm install

VITE_API_BASE_URL=http://127.0.0.1:8000/api

npm run dev -- --host

