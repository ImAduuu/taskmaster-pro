// DOM Element References
const form = document.getElementById("taskForm");
const textInput = document.getElementById("textInput");
const dateInput = document.getElementById("dateInput");
const priorityInput = document.getElementById("priorityInput");
const textarea = document.getElementById("textarea");
const msg = document.getElementById("msg");
const tasks = document.getElementById("tasks");
const modalHeading = document.getElementById("modalHeading");
const searchInput = document.getElementById("searchInput");

// State
let data = JSON.parse(localStorage.getItem("data")) || [];
let editIndex = null;
let currentFilter = 'all';

// Event Listeners
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formValidation();
});

// Form Validation
const formValidation = () => {
  if (textInput.value.trim() === "" || dateInput.value === "" || textarea.value.trim() === "") {
    msg.style.display = "block";
    msg.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> All fields are required!';
    return;
  }

  msg.style.display = "none";
  msg.innerHTML = "";
  acceptData();

  // Close Modal safely using Bootstrap Instance
  const modalEl = document.getElementById("form");
  const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modalInstance.hide();
};

// Accept & Save Task Data
const acceptData = () => {
  const taskObj = {
    text: textInput.value.trim(),
    date: dateInput.value,
    priority: priorityInput.value || 'medium',
    description: textarea.value.trim(),
    completed: editIndex !== null ? data[editIndex].completed : false
  };

  if (editIndex !== null) {
    data[editIndex] = taskObj;
    showToast("Task updated successfully!", "success");
    editIndex = null;
  } else {
    data.push(taskObj);
    showToast("New task created!", "success");
  }

  localStorage.setItem("data", JSON.stringify(data));
  createTasks();
  resetForm();
};

// Render Tasks Grid
const createTasks = () => {
  tasks.innerHTML = "";

  // Sort tasks by date (ascending)
  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  const query = searchInput.value.toLowerCase().trim();

  // Filter tasks based on search & filter status
  const filteredData = data.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    const matchesFilter = currentFilter === 'all' ? true :
      currentFilter === 'completed' ? item.completed :
        !item.completed;
    return matchesSearch && matchesFilter;
  });

  // Render Empty State if no tasks match
  if (filteredData.length === 0) {
    tasks.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list empty-icon"></i>
        <div class="empty-title">No tasks found</div>
        <div class="empty-sub">
          ${data.length === 0 ? "You haven't added any tasks yet. Click 'Add New Task' to begin!" : "Try adjusting your search or filter options."}
        </div>
      </div>
    `;
  } else {
    filteredData.forEach((x) => {
      const realIndex = data.indexOf(x);
      const isCompleted = x.completed ? 'completed-card' : '';
      const priority = x.priority || 'medium';

      tasks.innerHTML += `
        <div id="task-${realIndex}" class="task-card priority-${priority} ${isCompleted}">
          <div class="task-header">
            <h3 class="task-title">${escapeHTML(x.text)}</h3>
            <span class="priority-tag ${priority}">${priority}</span>
          </div>

          <div class="task-date">
            <i class="fas fa-calendar-day"></i>
            <span>${x.date}</span>
          </div>

          <p class="task-description">${escapeHTML(x.description)}</p>

          <div class="task-footer-actions">
            <div class="d-flex gap-2">
              <button class="action-btn edit" title="Edit Task" onClick="editTask(${realIndex})">
                <i class="fas fa-pen"></i>
              </button>
              <button class="action-btn delete" title="Delete Task" onClick="deleteTask(${realIndex})">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
            <button class="action-btn complete" title="Toggle Complete" onClick="toggleComplete(${realIndex})">
              <i class="fas fa-check"></i>
            </button>
          </div>
        </div>
      `;
    });
  }

  updateStats();
  document.getElementById("visibleCount").innerText = filteredData.length;
};

// Toggle Completion Status
const toggleComplete = (index) => {
  data[index].completed = !data[index].completed;
  localStorage.setItem("data", JSON.stringify(data));

  const statusMsg = data[index].completed ? "Task marked as completed!" : "Task marked as pending!";
  showToast(statusMsg, "info");

  createTasks();
};

// Delete Single Task
const deleteTask = (index) => {
  data.splice(index, 1);
  localStorage.setItem("data", JSON.stringify(data));
  showToast("Task deleted", "danger");
  createTasks();
};

// Edit Existing Task
const editTask = (index) => {
  editIndex = index;
  const target = data[index];

  textInput.value = target.text;
  dateInput.value = target.date;
  priorityInput.value = target.priority || 'medium';
  textarea.value = target.description;

  modalHeading.innerText = "Edit Task";

  // Open Modal programmatically
  const modalEl = document.getElementById("form");
  const modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();
};

// Reset Form State
const resetForm = () => {
  textInput.value = "";
  dateInput.value = "";
  priorityInput.value = "medium";
  textarea.value = "";
  msg.style.display = "none";
  msg.innerHTML = "";
  editIndex = null;
  modalHeading.innerText = "Add New Task";
};

// Clear All Tasks
const confirmClearAll = () => {
  if (data.length === 0) {
    showToast("No tasks to clear!", "info");
    return;
  }

  if (confirm("Are you sure you want to delete ALL tasks?")) {
    clearAll();
  }
};

const clearAll = () => {
  data = [];
  localStorage.removeItem("data");
  showToast("All tasks cleared!", "danger");
  createTasks();
};

// Update Dashboard Statistics
const updateStats = () => {
  const total = data.length;
  const completed = data.filter(t => t.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalCount").innerText = total;
  document.getElementById("completedCount").innerText = completed;
  document.getElementById("pendingCount").innerText = pending;
  document.getElementById("progressPercent").innerText = `${percent}%`;
  document.getElementById("progressBar").style.width = `${percent}%`;
};

// Search & Filter Helpers
const filterTasks = () => {
  createTasks();
};

const setFilter = (filter, btnElement) => {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
  createTasks();
};

// Toast Notifications Helper
const showToast = (message, type = "info") => {
  const toastEl = document.getElementById('appToast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  toastMessage.innerText = message;

  // Set colors based on notification type
  if (type === "success") {
    toastIcon.className = "fas fa-check-circle me-2 text-success";
  } else if (type === "danger") {
    toastIcon.className = "fas fa-exclamation-triangle me-2 text-danger";
  } else {
    toastIcon.className = "fas fa-info-circle me-2 text-info";
  }

  const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
  toast.show();
};

// HTML Escaper to protect against XSS
const escapeHTML = (str) => {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

// Initial App Initialization
(() => {
  data = JSON.parse(localStorage.getItem("data")) || [];
  createTasks();
})();