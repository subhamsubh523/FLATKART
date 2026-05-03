# Flatkart 🏠

A full-stack flat rental platform where tenants can browse and book flats, owners can manage listings, and admins/moderators can oversee the entire platform.

---

## Live Demo

- **Frontend:** https://flatkart-flat-rental.vercel.app
- **Backend API:** https://flatkart.onrender.com

---

## Features

### Tenant
- Register/Login with OTP email verification
- Browse and search available flats
- Book flats and track booking status (pending, approved, rejected, cancelled)
- Chat with flat owners in real-time
- Leave reviews on approved bookings
- Manage profile and change password

### Owner
- Register/Login with OTP email verification
- List, edit, and delete flats with images
- Approve or reject booking requests
- Chat with tenants in real-time
- Manage profile and change password

### Admin Panel
- Super Admin and Sub-Admin roles
- Manage owners, tenants, flats, bookings
- Block/unblock owners and tenants
- Restrict owners from receiving bookings
- Hide/show flat listings
- Create and manage moderators with granular permissions
- Overview dashboard with platform stats

### Moderator Panel
- Role-based access with granular permissions
- Manage owners, tenants, flats, bookings based on assigned permissions

---

## Tech Stack

### Frontend
| Tech | Usage |
|------|-------|
| React 19 | UI framework |
| React Router v7 | Client-side routing |
| Axios | API requests |
| Socket.io Client | Real-time chat |
| React Hot Toast | Notifications |
| React Icons | Icons |
| Vite | Build tool |

### Backend
| Tech | Usage |
|------|-------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Socket.io | Real-time messaging |
| Nodemailer | OTP emails |
| Cloudinary | Image uploads |
| Multer | File handling |

---

## Project Structure

```
Flatkart/
├── Backend/
│   ├── configure/        # DB and mailer config
│   ├── controllers/      # Route controllers
│   ├── middleware/        # Auth, admin, upload middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── uploads/          # Local uploads (dev only)
│   └── server.js         # Entry point
└── Frontend/
    └── src/
        ├── admin/        # Admin panel pages and API
        ├── moderator/    # Moderator panel pages and API
        ├── components/   # Shared components
        ├── context/      # Auth context
        ├── pages/        # Main app pages
        └── api.js        # Axios instance
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for OTP emails)

### Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` folder:

```env
PORT=5000
MONGO_URL=mongodb://localhost:27017/flat_rental
JWT_SECRET=your_jwt_secret
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

---

## Creating the First Super Admin

Once the backend is running, hit this endpoint once to create the super admin:

```
POST /api/admin/setup
Content-Type: application/json

{
  "name": "Super Admin",
  "email": "admin@flatkart.com",
  "password": "yourpassword"
}
```

> This route only works if no admin exists in the database. After creation, use `/api/admin/login` to login.

On the Admin login page, enter only the prefix before `@flatkart.com` (e.g. type `admin` if email is `admin@flatkart.com`).

---

## Deployment

### Backend → Render
Set these environment variables in Render dashboard:

```
MONGO_URL        = mongodb+srv://...
JWT_SECRET       = your_jwt_secret
EMAIL_USER       = your@gmail.com
EMAIL_PASS       = your_app_password
CLOUDINARY_CLOUD_NAME = ...
CLOUDINARY_API_KEY    = ...
CLOUDINARY_API_SECRET = ...
FRONTEND_URL     = https://your-vercel-frontend-url
```

### Frontend → Vercel
Set this environment variable in Vercel dashboard:

```
VITE_API_URL = https://your-render-backend-url/api
```

### Prevent Render Cold Starts
Use [cron-job.org](https://cron-job.org) to ping `https://your-render-backend-url/` every 10 minutes to keep the server warm.

---

## API Routes Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register user/owner |
| POST | `/api/auth/login` | Login |
| GET | `/api/flats` | Get all flats |
| POST | `/api/bookings` | Create booking |
| GET | `/api/admin/stats` | Admin dashboard stats |
| POST | `/api/admin/setup` | Create first super admin |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/moderator-login` | Moderator login |

---

## Environment Variables Summary

| Variable | Where | Description |
|----------|-------|-------------|
| `MONGO_URL` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | JWT signing secret |
| `EMAIL_USER` | Backend | Gmail address for OTP |
| `EMAIL_PASS` | Backend | Gmail app password |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret |
| `FRONTEND_URL` | Backend | Deployed frontend URL (for CORS) |
| `VITE_API_URL` | Frontend | Backend API base URL |

---

## License

MIT
