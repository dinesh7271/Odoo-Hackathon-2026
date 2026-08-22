# Dayflow - Human Resource Management System

Dayflow is a full-stack Human Resource Management System built for tracking employee attendance, leaves, profiles, and payroll.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (configured in Docker Compose)
- **Containerization**: Docker & Docker Compose

## Project Structure
```
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py          # Entrypoint & API endpoints
│   ├── Dockerfile
│   └── requirements.txt     # Python Dependencies
├── frontend/                 # React Vite Application
│   ├── src/
│   │   ├── App.jsx          # React Main Application
│   │   ├── main.jsx
│   │   └── index.css        # CSS & Tailwind styling
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml       # Multi-container orchestration
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- Docker and Docker Compose (optional, for containerized environment)

---

### Running Locally (Without Docker)

#### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be running at `http://localhost:8000`.

#### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:5173`.

---

### Running with Docker Compose

To start all services (Backend, Frontend, and PostgreSQL database) in containers:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API documentation (Swagger): `http://localhost:8000/docs`

---

### Verification and Health Check

To verify the backend health check endpoint:
- **cURL**:
  ```bash
  curl http://localhost:8000/api/health
  ```
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "Dayflow Backend"
  }
  ```
- **Browser**:
  Open `http://localhost:8000/api/health` or view the status directly in the frontend application at `http://localhost:5173`.
