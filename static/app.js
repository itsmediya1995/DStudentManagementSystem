const form = document.getElementById("student-form");
const studentIdInput = document.getElementById("student-id");
const nameInput = document.getElementById("name");
const rollInput = document.getElementById("roll-number");
const marksInput = document.getElementById("marks");
const departmentInput = document.getElementById("department");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const openFormBtn = document.getElementById("open-form-btn");
const formPanel = document.getElementById("form-panel");
const formTitle = document.getElementById("form-title");
const searchInput = document.getElementById("search");
const departmentFilter = document.getElementById("department-filter");
const tableBody = document.getElementById("students-table-body");
const messageEl = document.getElementById("message");
const totalStudentsEl = document.getElementById("total-students");
const avgMarksEl = document.getElementById("avg-marks");
const topGradeEl = document.getElementById("top-grade");
const departmentCountEl = document.getElementById("department-count");
const departmentBarsEl = document.getElementById("department-bars");
const departmentLegendEl = document.getElementById("department-legend");
const showDetailsBtn = document.getElementById("show-details-btn");
const detailsView = document.getElementById("details-view");
const dashboardShell = document.querySelector(".dashboard-shell");
const studentDetailsGrid = document.getElementById("student-details-grid");
const detailsMessage = document.getElementById("details-message");
const detailsSearch = document.getElementById("details-search");
const detailsDepartmentFilter = document.getElementById("details-department-filter");
const backToDashboardBtn = document.getElementById("back-to-dashboard-btn");
const showAllStudentsBtn = document.getElementById("show-all-students-btn");

let currentStudents = [];

const BAR_COLORS = ["#22d3ee", "#3b82f6", "#a78bfa", "#f59e0b", "#ef4444", "#14b8a6"];

function showMessage(text, type = "success") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  setTimeout(() => {
    if (messageEl.textContent === text) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  }, 2500);
}

function getPayload() {
  return {
    name: nameInput.value.trim(),
    roll_number: rollInput.value.trim(),
    marks: Number(marksInput.value),
    department: departmentInput.value.trim(),
  };
}

function resetForm() {
  form.reset();
  studentIdInput.value = "";
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelBtn.classList.add("hidden");
  openFormBtn.textContent = "+ Add Student";
}

function startEdit(student) {
  studentIdInput.value = student.id;
  nameInput.value = student.name;
  rollInput.value = student.roll_number;
  marksInput.value = student.marks;
  departmentInput.value = student.department;
  formTitle.textContent = "Update Student";
  submitBtn.textContent = "Update Student";
  cancelBtn.classList.remove("hidden");
  formPanel.classList.remove("hidden");
  openFormBtn.textContent = "Hide Form";
  nameInput.focus();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRows(students) {
  const limitedStudents = students.slice(0, 5);
  if (!limitedStudents.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">No student records found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = limitedStudents
    .map(
      (student) => `
      <tr>
        <td>${escapeHtml(student.roll_number)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.department)}</td>
        <td>${Number(student.marks).toFixed(2)}</td>
        <td><span class="grade ${getGrade(student.marks).toLowerCase()}">${getGrade(student.marks)}</span></td>
        <td>
          <div class="table-actions">
            <button data-action="edit" data-id="${student.id}">Edit</button>
            <button class="danger" data-action="delete" data-id="${student.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function getGrade(marks) {
  const score = Number(marks);
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function renderStats(students) {
  totalStudentsEl.textContent = String(students.length);
  const avg = students.length
    ? students.reduce((sum, student) => sum + Number(student.marks), 0) / students.length
    : 0;
  avgMarksEl.textContent = `${avg.toFixed(1)}%`;

  const gradeCount = students.reduce((acc, student) => {
    const grade = getGrade(student.marks);
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});
  const bestGrade = ["A", "B", "C", "D", "F"].find((grade) => gradeCount[grade]) || "-";
  topGradeEl.textContent = bestGrade;

  const departments = new Set(students.map((student) => student.department));
  departmentCountEl.textContent = String(departments.size);
}

function renderDepartmentStats(students) {
  const grouped = students.reduce((acc, student) => {
    const key = student.department;
    if (!acc[key]) acc[key] = [];
    acc[key].push(Number(student.marks));
    return acc;
  }, {});

  const entries = Object.entries(grouped);
  if (!entries.length) {
    departmentBarsEl.innerHTML = "<p class='bar-label'>No department data available.</p>";
    departmentLegendEl.innerHTML = "";
    return;
  }

  departmentBarsEl.innerHTML = entries
    .map(([department, marks], index) => {
      const average = marks.reduce((sum, value) => sum + value, 0) / marks.length;
      const color = BAR_COLORS[index % BAR_COLORS.length];
      return `
        <div class="bar-wrap">
          <div class="bar" style="height:${Math.max(average, 3)}%; background:${color};"></div>
          <div class="bar-label">${escapeHtml(department)} (${average.toFixed(0)}%)</div>
        </div>
      `;
    })
    .join("");

  departmentLegendEl.innerHTML = entries
    .map(([department, marks], index) => {
      const average = marks.reduce((sum, value) => sum + value, 0) / marks.length;
      const color = BAR_COLORS[index % BAR_COLORS.length];
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${color};"></span>
          ${escapeHtml(department)} - ${marks.length} students | Avg: ${average.toFixed(1)}%
        </div>
      `;
    })
    .join("");
}

function renderDepartmentFilter(students) {
  const previous = departmentFilter.value;
  const departments = [...new Set(students.map((student) => student.department))].sort();
  departmentFilter.innerHTML = `<option value="">All Departments</option>${departments
    .map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`)
    .join("")}`;
  if (departments.includes(previous)) {
    departmentFilter.value = previous;
  }
}

function applyLocalFilters(students) {
  const query = searchInput.value.trim().toLowerCase();
  const department = departmentFilter.value;

  return students.filter((student) => {
    const matchesSearch =
      !query ||
      student.name.toLowerCase().includes(query) ||
      student.roll_number.toLowerCase().includes(query);
    const matchesDepartment = !department || student.department === department;
    return matchesSearch && matchesDepartment;
  });
}

function renderAll(students) {
  currentStudents = students;
  renderStats(students);
  renderDepartmentStats(students);
  renderDepartmentFilter(students);
  renderRows(applyLocalFilters(students));
}

async function fetchStudents(query = "") {
  const url = query ? `/api/students?search=${encodeURIComponent(query)}` : "/api/students";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load student records.");
  }
  const data = await response.json();
  renderAll(data);
  return data;
}

async function submitForm(event) {
  event.preventDefault();
  const payload = getPayload();
  const studentId = studentIdInput.value;

  const isUpdate = Boolean(studentId);
  const url = isUpdate ? `/api/students/${studentId}` : "/api/students";
  const method = isUpdate ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    showMessage(result.error || "Request failed.", "error");
    return;
  }

  showMessage(isUpdate ? "Student updated successfully." : "Student added successfully.");
  resetForm();
  await fetchStudents();
}

async function removeStudent(studentId) {
  const confirmed = window.confirm("Delete this student record?");
  if (!confirmed) return;

  const response = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
  const result = await response.json();
  if (!response.ok) {
    showMessage(result.error || "Delete failed.", "error");
    return;
  }

  showMessage("Student deleted successfully.");
  if (studentIdInput.value === String(studentId)) {
    resetForm();
  }
  await fetchStudents();
}

form.addEventListener("submit", (event) => {
  submitForm(event).catch((err) => showMessage(err.message, "error"));
});

cancelBtn.addEventListener("click", resetForm);

tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const studentId = button.dataset.id;
  if (!action || !studentId) return;

  const student = currentStudents.find((item) => String(item.id) === studentId);
  if (!student) {
    showMessage("Student not found.", "error");
    return;
  }

  if (action === "edit") {
    startEdit(student);
  } else if (action === "delete") {
    removeStudent(studentId).catch((err) => showMessage(err.message, "error"));
  }
});

searchInput.addEventListener("input", () => {
  renderRows(applyLocalFilters(currentStudents));
});

departmentFilter.addEventListener("change", () => {
  renderRows(applyLocalFilters(currentStudents));
});

openFormBtn.addEventListener("click", () => {
  formPanel.classList.toggle("hidden");
  const isHidden = formPanel.classList.contains("hidden");
  if (isHidden) {
    openFormBtn.textContent = "+ Add Student";
    if (!studentIdInput.value) {
      resetForm();
    }
  } else {
    openFormBtn.textContent = "Hide Form";
  }
});

function showDetailsMessage(text, type = "success") {
  detailsMessage.textContent = text;
  detailsMessage.className = `message ${type}`;
  setTimeout(() => {
    if (detailsMessage.textContent === text) {
      detailsMessage.textContent = "";
      detailsMessage.className = "message";
    }
  }, 2500);
}

function applyDetailsFilters(students) {
  const query = detailsSearch.value.trim().toLowerCase();
  const department = detailsDepartmentFilter.value;

  return students.filter((student) => {
    const matchesSearch =
      !query ||
      student.name.toLowerCase().includes(query) ||
      student.roll_number.toLowerCase().includes(query);
    const matchesDepartment = !department || student.department === department;
    return matchesSearch && matchesDepartment;
  });
}

function renderStudentCards(students) {
  if (!students.length) {
    studentDetailsGrid.innerHTML = `
      <div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: #93a7d2;">
        No student records found.
      </div>
    `;
    return;
  }

  studentDetailsGrid.innerHTML = students
    .map(
      (student) => `
      <div class="student-card">
        <div class="student-card-header">
          <div>
            <div class="student-name">${escapeHtml(student.name)}</div>
            <div class="student-roll">${escapeHtml(student.roll_number)}</div>
          </div>
          <span class="grade ${getGrade(student.marks).toLowerCase()}">${getGrade(student.marks)}</span>
        </div>
        <div class="student-card-body">
          <div class="detail-item">
            <span class="detail-label">Department:</span>
            <span class="detail-value department">${escapeHtml(student.department)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Marks:</span>
            <span class="detail-value marks">${Number(student.marks).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function renderDetailsView(students) {
  const previous = detailsDepartmentFilter.value;
  const departments = [...new Set(students.map((student) => student.department))].sort();
  detailsDepartmentFilter.innerHTML = `<option value="">All Departments</option>${departments
    .map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`)
    .join("")}`;
  if (departments.includes(previous)) {
    detailsDepartmentFilter.value = previous;
  }

  renderStudentCards(applyDetailsFilters(students));
}

showDetailsBtn.addEventListener("click", () => {
  dashboardShell.classList.toggle("hidden");
  detailsView.classList.toggle("hidden");
  if (!detailsView.classList.contains("hidden")) {
    renderDetailsView(currentStudents);
  }
});

backToDashboardBtn.addEventListener("click", () => {
  dashboardShell.classList.toggle("hidden");
  detailsView.classList.toggle("hidden");
});

detailsSearch.addEventListener("input", () => {
  renderStudentCards(applyDetailsFilters(currentStudents));
});

detailsDepartmentFilter.addEventListener("change", () => {
  renderStudentCards(applyDetailsFilters(currentStudents));
});

showAllStudentsBtn.addEventListener("click", () => {
  dashboardShell.classList.add("hidden");
  detailsView.classList.remove("hidden");
  renderDetailsView(currentStudents);
});

fetchStudents().catch((err) => showMessage(err.message, "error"));
