from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request
from mock_data import MOCK_STUDENTS


BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "students.db"

app = Flask(__name__)


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                roll_number TEXT NOT NULL UNIQUE,
                marks REAL NOT NULL,
                department TEXT NOT NULL
            )
            """
        )
        conn.commit()
        
        # Populate with mock data if table is empty or has fewer students than mock data
        count = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
        if count == 0 or count < len(MOCK_STUDENTS):
            # Clear existing data
            conn.execute("DELETE FROM students")
            conn.commit()
            
            # Load all mock data
            for student in MOCK_STUDENTS:
                try:
                    conn.execute(
                        """
                        INSERT INTO students (name, roll_number, marks, department)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            student["name"],
                            student["roll_number"],
                            student["marks"],
                            student["department"],
                        ),
                    )
                except sqlite3.IntegrityError:
                    # Skip duplicates
                    pass
            conn.commit()


def validate_student_payload(payload: dict[str, Any]) -> tuple[bool, str]:
    required_fields = ["name", "roll_number", "marks", "department"]
    for field in required_fields:
        if field not in payload:
            return False, f"Missing field: {field}"

    name = str(payload["name"]).strip()
    roll_number = str(payload["roll_number"]).strip()
    department = str(payload["department"]).strip()

    if not name or not roll_number or not department:
        return False, "Name, roll number, and department are required."

    try:
        marks = float(payload["marks"])
    except (TypeError, ValueError):
        return False, "Marks must be a valid number."

    if marks < 0 or marks > 100:
        return False, "Marks must be between 0 and 100."

    return True, ""


init_db()


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.get("/api/students")
def list_students():
    search = request.args.get("search", "").strip()

    with get_db_connection() as conn:
        if search:
            pattern = f"%{search}%"
            rows = conn.execute(
                """
                SELECT id, name, roll_number, marks, department
                FROM students
                WHERE name LIKE ? OR roll_number LIKE ? OR department LIKE ?
                ORDER BY id DESC
                """,
                (pattern, pattern, pattern),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT id, name, roll_number, marks, department
                FROM students
                ORDER BY id DESC
                """
            ).fetchall()

    students = [dict(row) for row in rows]
    return jsonify(students)


@app.post("/api/students")
def add_student():
    payload = request.get_json(silent=True) or {}
    is_valid, error = validate_student_payload(payload)
    if not is_valid:
        return jsonify({"error": error}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO students (name, roll_number, marks, department)
                VALUES (?, ?, ?, ?)
                """,
                (
                    payload["name"].strip(),
                    payload["roll_number"].strip(),
                    float(payload["marks"]),
                    payload["department"].strip(),
                ),
            )
            conn.commit()
            student_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"error": "Roll number already exists."}), 409

    return jsonify({"id": student_id, "message": "Student added."}), 201


@app.put("/api/students/<int:student_id>")
def update_student(student_id: int):
    payload = request.get_json(silent=True) or {}
    is_valid, error = validate_student_payload(payload)
    if not is_valid:
        return jsonify({"error": error}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE students
                SET name = ?, roll_number = ?, marks = ?, department = ?
                WHERE id = ?
                """,
                (
                    payload["name"].strip(),
                    payload["roll_number"].strip(),
                    float(payload["marks"]),
                    payload["department"].strip(),
                    student_id,
                ),
            )
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"error": "Student not found."}), 404
    except sqlite3.IntegrityError:
        return jsonify({"error": "Roll number already exists."}), 409

    return jsonify({"message": "Student updated."})


@app.delete("/api/students/<int:student_id>")
def delete_student(student_id: int):
    with get_db_connection() as conn:
        cursor = conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Student not found."}), 404

    return jsonify({"message": "Student deleted."})


if __name__ == "__main__":
    app.run(debug=True)
