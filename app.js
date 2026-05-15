const state = {
  user: null,
  tasks: [],
  goals: [],
  notes: localStorage.getItem("keynan_notes") || "",
  theme: localStorage.getItem("keynan_theme") || "light",
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const taskList = document.getElementById("taskList");
const weekBoard = document.getElementById("weekBoard");
const calendar = document.getElementById("calendar");
const notes = document.getElementById("notes");
const goalList = document.getElementById("goalList");

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
}

function renderCalendar() {
  const total = 35;
  calendar.innerHTML = "";
  for (let i = 1; i <= total; i++) {
    const cell = document.createElement("div");
    cell.textContent = i;
    calendar.appendChild(cell);
  }
}

function renderWeekBoard() {
  weekBoard.innerHTML = "";
  days.forEach((day) => {
    const col = document.createElement("div");
    col.className = "day-col";
    col.dataset.day = day;
    col.innerHTML = `<h4>${day}</h4>`;

    state.tasks
      .filter((t) => t.day === day)
      .forEach((t) => {
        const item = document.createElement("div");
        item.className = "task-item draggable";
        item.draggable = true;
        item.dataset.id = t.id;
        item.innerHTML = `<span>${t.title}</span>`;
        col.appendChild(item);
      });

    col.addEventListener("dragover", (e) => e.preventDefault());
    col.addEventListener("drop", (e) => {
      const id = e.dataTransfer.getData("text/plain");
      const task = state.tasks.find((x) => x.id === id);
      if (task) task.day = day;
      renderWeekBoard();
    });

    weekBoard.appendChild(col);
  });

  document.querySelectorAll(".draggable").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", el.dataset.id);
    });
  });
}

function analytics() {
  const done = state.tasks.filter((t) => t.done).length;
  const total = state.tasks.length;
  const ratio = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("tasksDone").textContent = done;
  document.getElementById("goalRate").textContent = `${ratio}%`;
  document.getElementById("analyticsText").textContent = total
    ? `${done}/${total} tasks complete. Keep the momentum.`
    : "Start adding tasks to see trends.";
  const next = state.tasks
    .filter((t) => t.reminder)
    .sort((a, b) => a.reminder.localeCompare(b.reminder))[0];
  document.getElementById("nextReminder").textContent = next
    ? `${next.title} at ${next.reminder}`
    : "No reminders set";
}

function renderCategoryFilter() {
  const filter = document.getElementById("taskCategoryFilter");
  const cats = [...new Set(state.tasks.map((t) => t.category))];
  const selected = filter.value;
  filter.innerHTML = `<option value="all">All categories</option>` +
    cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  filter.value = cats.includes(selected) || selected === "all" ? selected : "all";
}

function renderTasks() {
  const selected = document.getElementById("taskCategoryFilter").value;
  taskList.innerHTML = "";
  state.tasks
    .filter((t) => selected === "all" || t.category === selected)
    .forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.done ? "done" : ""}`;
      li.innerHTML = `
        <input type="checkbox" ${task.done ? "checked" : ""} data-toggle="${task.id}" />
        <span>${task.title}</span>
        <span class="pill">${task.category}</span>
      `;
      taskList.appendChild(li);
    });

  taskList.querySelectorAll("input[data-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const task = state.tasks.find((t) => t.id === input.dataset.toggle);
      task.done = input.checked;
      renderTasks();
      renderWeekBoard();
      analytics();
    });
  });

  renderCategoryFilter();
  analytics();
}

function renderGoals() {
  goalList.innerHTML = "";
  state.goals.forEach((goal) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `<input type="checkbox"><span>${goal}</span>`;
    goalList.appendChild(li);
  });
}

document.getElementById("authBtn").addEventListener("click", () => {
  state.user = state.user ? null : { name: "Alex" };
  document.getElementById("authBtn").textContent = state.user ? "Sign Out" : "Sign In";
});

document.getElementById("themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("keynan_theme", state.theme);
  applyTheme();
});

document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskInput").value.trim();
  const category = document.getElementById("categoryInput").value;
  const reminder = document.getElementById("reminderInput").value;
  if (!title) return;
  state.tasks.push({
    id: crypto.randomUUID(),
    title,
    category,
    reminder,
    done: false,
    day: days[Math.floor(Math.random() * days.length)],
  });
  e.target.reset();
  renderTasks();
  renderWeekBoard();
});

document.getElementById("taskCategoryFilter").addEventListener("change", renderTasks);

document.getElementById("goalForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = document.getElementById("goalInput").value.trim();
  if (!val) return;
  state.goals.push(val);
  e.target.reset();
  renderGoals();
});

notes.value = state.notes;
notes.addEventListener("input", () => {
  localStorage.setItem("keynan_notes", notes.value);
});

applyTheme();
renderCalendar();
renderTasks();
renderWeekBoard();
renderGoals();
