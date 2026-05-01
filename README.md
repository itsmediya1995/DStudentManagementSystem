# Student Management System (One-Page CRUD)

Minimal full-stack web app to manage student records with:
- Add student
- Update student
- Delete student
- Search student records

Data is stored in `students.db` (SQLite).

## Local Run

1. Create and activate virtual environment:
   - Windows PowerShell:
     - `python -m venv .venv`
     - `.venv\Scripts\Activate.ps1`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Start server:
   - `python app.py`
4. Open:
   - `http://127.0.0.1:5000`

## Deploy (Render or similar)

This repo is ready for deployment:
- `requirements.txt` for Python dependencies
- `Procfile` using `gunicorn app:app`

For Render:
1. Push this folder to a GitHub repository.
2. Create a new **Web Service** in Render.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Deploy.

Your database will be file-based SQLite on the deployed instance.
