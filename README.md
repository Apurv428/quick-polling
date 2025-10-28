# QuickPoll: Real-Time Opinion Polling Platform

A production-ready, full-stack real-time polling application with analytics dashboard, AI-powered poll generation, admin features, social features, and comprehensive export capabilities.

## Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

## What's Implemented

### Core Features

* Create polls with multiple options
* Real-time voting with live updates
* Like/unlike polls
* Polling-based live synchronization
* Responsive, modern UI with shadcn/ui
* Anonymous user identification
* Vote tracking and visualization
* Percentage-based results display
* Redux Toolkit state management

### Admin Features

* Admin Dashboard with authentication
* Statistics overview (total polls, votes, active users)
* Interactive charts and graphs (bar, line, pie charts)
* System performance metrics
* Most popular poll tracking
* Real-time analytics

### AI Features (OpenAI GPT)

* AI-powered poll generation
* Generate questions and options from topics
* Smart content suggestions

### Export & Sharing Features

* QR Code generation for polls
* CSV export of poll data
* Embed widget code generation
* Shareable poll links

### Advanced Features

* Live presence tracking (see viewers)
* Optimistic UI updates
* Animated vote bars with framer-motion
* Toast notifications
* Rate limiting (SlowAPI)
* Skeleton loaders
* Polling real-time updates

## Tech Stack

### Backend

* **FastAPI** - High-performance Python web framework
* **OpenAI GPT AI** - AI-powered features
* **Pydantic** - Data validation
* **SlowAPI** - Rate limiting

### Frontend

* **Next.js 14** - React framework with App Router
* **TypeScript** - Type-safe development
* **Redux Toolkit** - State management
* **Tailwind CSS** - Styling
* **shadcn/ui** - UI components
* **Recharts** - Charts for admin dashboard
* **Framer Motion** - Animations
* **react-hot-toast** - Notifications

## Features List

### 1. Poll Management

* Create polls with custom questions
* Add 2-10 options per poll
* Real-time vote counting
* Change votes anytime
* View results with percentages

### 2. Admin Dashboard

* Secure authentication with API key
* Overview statistics cards
* Bar chart - Overview statistics
* Line chart - Activity trends (7 days)
* Pie chart - System performance
* Pie chart - Engagement metrics
* Average response time tracking
* Most popular poll display

### 3. AI-Powered Features

* Generate poll questions from topics
* Auto-generate answer options
* Smart content suggestions

### 4. Export & Sharing

* Generate QR codes for polls
* Export poll data to CSV
* Get embed widget code
* Copy shareable links

### 5. Real-Time Features

* Live vote updates via WebSocket
* See active viewers count
* Toast notifications for actions
* Presence tracking

### 6. Social Features

* Like/unlike polls
* Vote tracking per user
* User profiles (stored locally)
* Reaction animations


### Admin Access

* Visit: `http://localhost:3001/admin`
* Enter the admin key to access dashboard

## Project Structure

```text
polling/
├── backend/
│   ├── main.py # FastAPI application
│   ├── requirements.txt # Python dependencies
│   ├── .env # Environment variables
│   └── app/
│       └── config/
│           └── settings.py # Configuration
└── frontend/
    ├── app/
    │   ├── page.tsx # Main polls page
    │   ├── layout.tsx # Root layout
    │   ├── globals.css # Global styles
    │   └── admin/
    │       └── page.tsx # Admin dashboard
    ├── components/
    │   └── ui/ # UI components
    ├── store/ # Redux store
    ├── package.json
    └── next.config.js
```

## API Endpoints

### REST API

* `GET /` - Health check
* `GET /api/polls` - Get all polls
* `POST /api/polls` - Create poll
* `POST /api/votes` - Submit vote
* `POST /api/likes` - Toggle like
* `GET /api/admin/stats` - Admin statistics
* `POST /api/ai/generate-poll` - AI generate poll
* `GET /api/polls/{id}/qr` - Generate QR code
* `GET /api/polls/{id}/export` - Export to CSV
* `GET /api/polls/{id}/embed` - Get embed code

## Troubleshooting

**Backend not starting:**

* Make sure you're in the backend directory
* Check if port 8000 is available
* Install dependencies: `pip install -r requirements.txt`

**Frontend not starting:**

* Make sure you're in the frontend directory
* Check if port 3000 is available
* Install dependencies: `npm install`

**Admin dashboard not loading:**

* Use admin key: `3ORVaFuXUzD3nsvYLi7iXvd4F2S1JMNN1iLzsm6qsK8`
* Make sure backend is running
* Check browser console for errors
