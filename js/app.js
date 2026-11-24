import {
    loginWithGoogle,
    logoutUser,
    monitorAuth
} from "./firebase.js";
// ======================================
// TASKORA - PROJECT & TASK MANAGEMENT
// ======================================

// LOAD PROJECTS FROM LOCAL STORAGE
let projects = JSON.parse(
    localStorage.getItem("taskora_projects")
) || [];

// Pastikan setiap proyek memiliki daftar tasks
projects = projects.map(project => ({
    ...project,
    tasks: project.tasks || []
}));

// SAVE DATA
function saveProjects() {
    localStorage.setItem(
        "taskora_projects",
        JSON.stringify(projects)
    );
}

// UPDATE DASHBOARD STATISTICS
function updateStatistics() {
    const allTasks = projects.flatMap(project => project.tasks);

    const totalProjects = projects.length;
    const totalTasks = allTasks.length;
    const inProgress = allTasks.filter(
        task => task.status === "In Progress"
    ).length;
    const completed = allTasks.filter(
        task => task.status === "Done"
    ).length;

    const stats = document.querySelectorAll(".stat-card h2");

    if (stats.length >= 4) {
        stats[0].textContent = totalProjects;
        stats[1].textContent = totalTasks;
        stats[2].textContent = inProgress;
        stats[3].textContent = completed;
    }
}

// RENDER ALL PROJECTS AND TASKS
function renderProjects() {
    const projectList = document.getElementById("projectList");

    projectList.innerHTML = "";

    if (projects.length === 0) {
        projectList.innerHTML = `
            <div class="empty-state">
                <h3>No projects yet</h3>
                <p>Create your first project to get started.</p>
            </div>
        `;
    }

    projects.forEach(project => {
        const card = document.createElement("div");
        card.className = "project-item";

        const title = document.createElement("h3");
        title.textContent = project.name;

        const description = document.createElement("p");
        description.textContent = project.description || "No description";

        const actions = document.createElement("div");
        actions.className = "project-actions";

        const addTaskButton = document.createElement("button");
        addTaskButton.textContent = "+ Add Task";
        addTaskButton.addEventListener("click", () => {
            addTask(project.id);
        });

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editProject(project.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteProject(project.id);
        });

        actions.append(addTaskButton, editButton, deleteButton);

        const taskHeading = document.createElement("h4");
        taskHeading.className = "task-heading";
        taskHeading.textContent = `Tasks (${project.tasks.length})`;

        const taskList = document.createElement("div");
        taskList.className = "task-list";

        if (project.tasks.length === 0) {
            const emptyTask = document.createElement("p");
            emptyTask.className = "empty-task";
            emptyTask.textContent = "No tasks added yet.";
            taskList.appendChild(emptyTask);
        }

        project.tasks.forEach(task => {
            const taskCard = document.createElement("div");
            taskCard.className = "task-card";

            const taskInfo = document.createElement("div");
            taskInfo.className = "task-info";

            const taskName = document.createElement("strong");
            taskName.textContent = task.name;

            const taskDescription = document.createElement("p");
            taskDescription.textContent = task.description || "No description";

            const taskDate = document.createElement("small");
            taskDate.textContent = task.dueDate
                ? `Due: ${task.dueDate}`
                : "No deadline";

            taskInfo.append(taskName, taskDescription, taskDate);

            const taskControls = document.createElement("div");
            taskControls.className = "task-controls";

            const statusSelect = document.createElement("select");

            ["To-do", "In Progress", "Done"].forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });

            statusSelect.value = task.status;

            statusSelect.addEventListener("change", () => {
                updateTaskStatus(project.id, task.id, statusSelect.value);
            });

            const editTaskButton = document.createElement("button");
            editTaskButton.textContent = "Edit";
            editTaskButton.addEventListener("click", () => {
                editTask(project.id, task.id);
            });

            const deleteTaskButton = document.createElement("button");
            deleteTaskButton.textContent = "Delete";
            deleteTaskButton.addEventListener("click", () => {
                deleteTask(project.id, task.id);
            });

            taskControls.append(
                statusSelect,
                editTaskButton,
                deleteTaskButton
            );

            taskCard.append(taskInfo, taskControls);
            taskList.appendChild(taskCard);
        });

        card.append(
            title,
            description,
            actions,
            taskHeading,
            taskList
        );

        projectList.appendChild(card);
    });

    updateStatistics();
}

// ADD PROJECT
function addProject() {
    const name = prompt("Enter project name:");

    if (name === null) return;

    if (!name.trim()) {
        alert("Project name cannot be empty.");
        return;
    }

    const description = prompt("Enter project description:") || "";

    projects.push({
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        tasks: []
    });

    saveProjects();
    renderProjects();
}

// EDIT PROJECT
function editProject(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    const newName = prompt("Edit project name:", project.name);

    if (newName === null) return;

    if (!newName.trim()) {
        alert("Project name cannot be empty.");
        return;
    }

    const newDescription = prompt(
        "Edit project description:",
        project.description
    );

    if (newDescription === null) return;

    project.name = newName.trim();
    project.description = newDescription.trim();

    saveProjects();
    renderProjects();
}

// DELETE PROJECT
function deleteProject(id) {
    const confirmation = confirm(
        "Are you sure you want to delete this project and its tasks?"
    );

    if (!confirmation) return;

    projects = projects.filter(project => project.id !== id);

    saveProjects();
    renderProjects();
}

// ADD TASK

function addTask(projectId) {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;

    const name = prompt("Enter task name:");
    if (name === null) return;

    if (!name.trim()) {
        alert("Task name cannot be empty.");
        return;
    }

    const description = prompt("Enter task description:") || "";
    const dueDate = prompt("Enter deadline (YYYY-MM-DD), or leave empty:") || "";

    const task = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        dueDate: dueDate.trim(),
        status: "To-do",
        attachment: null
    };

    const attachFile = confirm(
        "Would you like to attach a file to this task?"
    );

    if (!attachFile) {
        project.tasks.push(task);
        saveProjects();
        renderProjects();
        return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            alert("File size must not exceed 1 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            task.attachment = {
                name: file.name,
                type: file.type,
                data: reader.result
            };

            project.tasks.push(task);
            saveProjects();
            renderProjects();

            alert("Task and attachment saved successfully!");
        };

        reader.onerror = () => {
            alert("Unable to read this file.");
        };

        reader.readAsDataURL(file);
    });

    fileInput.click();
}


// EDIT TASK
function editTask(projectId, taskId) {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;

    const task = project.tasks.find(item => item.id === taskId);
    if (!task) return;

    const newName = prompt("Edit task name:", task.name);

    if (newName === null) return;

    if (!newName.trim()) {
        alert("Task name cannot be empty.");
        return;
    }

    const newDescription = prompt(
        "Edit task description:",
        task.description
    );

    if (newDescription === null) return;

    const newDate = prompt(
        "Edit deadline (YYYY-MM-DD):",
        task.dueDate
    );

    if (newDate === null) return;

    task.name = newName.trim();
    task.description = newDescription.trim();
    task.dueDate = newDate.trim();

    saveProjects();
    renderProjects();
}

// DELETE TASK
function deleteTask(projectId, taskId) {
    const confirmation = confirm("Delete this task?");

    if (!confirmation) return;

    const project = projects.find(item => item.id === projectId);
    if (!project) return;

    project.tasks = project.tasks.filter(
        task => task.id !== taskId
    );

    saveProjects();
    renderProjects();
}

// UPDATE TASK STATUS
function updateTaskStatus(projectId, taskId, newStatus) {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;

    const task = project.tasks.find(item => item.id === taskId);
    if (!task) return;

    task.status = newStatus;

    saveProjects();
    renderProjects();
}


// CONNECT ADD PROJECT BUTTON
const projectModal = document.getElementById("projectModal");
const projectForm = document.getElementById("projectForm");
const projectNameInput = document.getElementById("projectName");
const projectDescriptionInput = document.getElementById("projectDescription");

const PROJECT_DRAFT_KEY = "taskora_project_draft";

// OPEN MODAL
document.getElementById("addProjectBtn")
    .addEventListener("click", () => {
        projectModal.classList.add("active");
    });

// CLOSE MODAL
document.getElementById("closeProjectModal")
    .addEventListener("click", () => {
        projectModal.classList.remove("active");
    });

document.getElementById("cancelProjectBtn")
    .addEventListener("click", () => {
        projectModal.classList.remove("active");
    });

// RESTORE DRAFT
const savedDraft = JSON.parse(
    localStorage.getItem(PROJECT_DRAFT_KEY) || "{}"
);

projectNameInput.value = savedDraft.name || "";
projectDescriptionInput.value = savedDraft.description || "";

// AUTO-SAVE DRAFT
function saveProjectDraft() {
    const draft = {
        name: projectNameInput.value,
        description: projectDescriptionInput.value
    };

    localStorage.setItem(
        PROJECT_DRAFT_KEY,
        JSON.stringify(draft)
    );
}

projectNameInput.addEventListener("input", saveProjectDraft);
projectDescriptionInput.addEventListener("input", saveProjectDraft);

// SAVE PROJECT
projectForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = projectNameInput.value.trim();
    const description = projectDescriptionInput.value.trim();

    if (!name) {
        alert("Project name cannot be empty.");
        return;
    }

    projects.push({
        id: Date.now(),
        name: name,
        description: description,
        tasks: []
    });

    saveProjects();
    renderProjects();
    updateStatistics();

    // CLEAR DRAFT AFTER SUCCESS
    localStorage.removeItem(PROJECT_DRAFT_KEY);
    projectForm.reset();

    projectModal.classList.remove("active");
});



document.getElementById("addProjectBtn")
    .addEventListener("click", () => {
        projectModal.classList.add("active");
    });

document.getElementById("closeProjectModal")
    .addEventListener("click", () => {
        projectModal.classList.remove("active");
    });

document.getElementById("cancelProjectBtn")
    .addEventListener("click", () => {
        projectModal.classList.remove("active");
    });

// INITIALIZE APPLICATION
renderProjects();

// ======================================
// TASKORA - PAGE NAVIGATION
// ======================================

const pageView = document.getElementById("pageView");

const dashboardElements = [
    document.querySelector(".welcome-section"),
    document.querySelector(".stats-grid"),
    document.querySelector(".projects-section")
];

const pageTitles = {
    dashboard: "Dashboard",
    projects: "My Projects",
    tasks: "My Tasks",
    calendar: "Calendar",
    settings: "Settings"
};

// Helper untuk membuat elemen teks dengan aman
function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

// Tampilkan halaman
function showPage(page) {
    const isDashboard = page === "dashboard";

    dashboardElements.forEach(element => {
        element.style.display = isDashboard ? "" : "none";
    });

    pageView.hidden = isDashboard;

    document.querySelector(".topbar h2").textContent =
        pageTitles[page] || "Dashboard";

    document.querySelectorAll("[data-page]").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    if (isDashboard) return;

    pageView.replaceChildren();

    const heading = createTextElement(
        "h2",
        "",
        pageTitles[page] || "Dashboard"
    );

    pageView.appendChild(heading);

    if (page === "projects") {
        renderProjectsPage();
    } else if (page === "tasks") {
        renderTasksPage();
    } else if (page === "calendar") {
        renderCalendarPage();
    } else if (page === "settings") {
        renderSettingsPage();
        } else if (page === "music") {
    renderMusicPage();
}
    }


// MUSIC PAGE
function renderMusicPage() {
    const musicContainer = document.createElement("div");
    musicContainer.className = "music-page";

    musicContainer.innerHTML = `
        <div class="music-header">
            <h2>TASKORA Music 🎧</h2>
            <p>Your soundtrack for getting things done.</p>
        </div>

        <div class="music-search">
            <input
                type="text"
                id="musicSearchInput"
                placeholder="Search songs, artists, or albums..."
            >

            <button id="musicSearchButton">
                Search
            </button>
        </div>

        <div class="music-featured">
            <h3>Find Your Focus.</h3>
            <p>Choose your favorite music and enjoy your study session.</p>

            <div class="music-moods">
                <div class="music-mood">🎧 Lo-fi Study</div>
                <div class="music-mood">🎹 Piano Focus</div>
                <div class="music-mood">🌙 Chill Vibes</div>
                <div class="music-mood">⚡ Energy Boost</div>
            </div>
        </div>

        <div class="spotify-player" id="spotifyPlayer">
            <h3>Spotify Player</h3>
            <p>Your music player will appear here.</p>
        </div>
    `;

    pageView.appendChild(musicContainer);

    document.getElementById("musicSearchButton")
        .addEventListener("click", () => {
            const query = document
                .getElementById("musicSearchInput")
                .value.trim();

            if (!query) {
                alert("Please enter a song or artist name.");
                return;
            }

            const searchUrl =
                "https://open.spotify.com/search/" +
                encodeURIComponent(query);

            window.open(searchUrl, "_blank");
        });
}
// MY PROJECTS PAGE
function renderProjectsPage() {
    pageView.appendChild(
        createTextElement(
            "p",
            "page-description",
            "View all your projects and their tasks."
        )
    );

    if (projects.length === 0) {
        pageView.appendChild(
            createTextElement(
                "div",
                "page-empty",
                "No projects available. Create a project from Dashboard."
            )
        );
        return;
    }

    projects.forEach(project => {
        const row = document.createElement("div");
        row.className = "page-row";

        const info = document.createElement("div");

        info.appendChild(
            createTextElement("strong", "", project.name)
        );

        info.appendChild(
            createTextElement(
                "p",
                "",
                `${project.tasks.length} tasks • ${project.description || "No description"}`
            )
        );

        row.appendChild(info);
        pageView.appendChild(row);
    });


// MY TASKS PAGE

    
// ======================================
// TASKORA - SEARCH & FILTER TASKS
// ======================================

function renderTasksPage() {
    pageView.appendChild(
        createTextElement(
            "p",
            "page-description",
            "Search, filter, and manage tasks across all projects."
        )
    );

    // SEARCH INPUT
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Search task name...";
    searchInput.className = "task-search";

    // STATUS FILTER
    const statusFilter = document.createElement("select");
    statusFilter.className = "task-filter";

    const statusOptions = [
        ["all", "All Status"],
        ["To-do", "To-do"],
        ["In Progress", "In Progress"],
        ["Done", "Done"]
    ];

    statusOptions.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        statusFilter.appendChild(option);
    });

    // PROJECT FILTER
    const projectFilter = document.createElement("select");
    projectFilter.className = "task-filter";

    const allProjectsOption = document.createElement("option");
    allProjectsOption.value = "all";
    allProjectsOption.textContent = "All Projects";
    projectFilter.appendChild(allProjectsOption);

    projects.forEach(project => {
        const option = document.createElement("option");
        option.value = String(project.id);
        option.textContent = project.name;
        projectFilter.appendChild(option);
    });

    // FILTER TOOLBAR
    const toolbar = document.createElement("div");
    toolbar.className = "task-toolbar";
    toolbar.append(searchInput, statusFilter, projectFilter);

    // RESULTS CONTAINER
    const results = document.createElement("div");
    results.className = "task-results";

    pageView.append(toolbar, results);

    // FILTER AND DISPLAY TASKS
    function updateResults() {
        const keyword = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;
        const selectedProject = projectFilter.value;

        const allTasks = projects.flatMap(project =>
            project.tasks.map(task => ({
                ...task,
                projectId: project.id,
                projectName: project.name
            }))
        );

        const filteredTasks = allTasks.filter(task => {
            const matchesName = task.name
                .toLowerCase()
                .includes(keyword);

            const matchesStatus =
                selectedStatus === "all" ||
                task.status === selectedStatus;

            const matchesProject =
                selectedProject === "all" ||
                String(task.projectId) === selectedProject;

            return matchesName && matchesStatus && matchesProject;
        });

        results.replaceChildren();

        if (filteredTasks.length === 0) {
            results.appendChild(
                createTextElement(
                    "div",
                    "page-empty",
                    "No matching tasks found."
                )
            );
            return;
        }

        filteredTasks.forEach(task => {
            const row = document.createElement("div");
            row.className = "page-row";

            const info = document.createElement("div");

            info.appendChild(
                createTextElement("strong", "", task.name)
            );

            info.appendChild(
                createTextElement(
                    "p",
                    "",
                    `${task.projectName} • ${task.dueDate || "No deadline"}`
                )
            );

            const status = document.createElement("select");

            ["To-do", "In Progress", "Done"].forEach(value => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                status.appendChild(option);
            });

            status.value = task.status;

            status.addEventListener("change", () => {
                updateTaskStatus(
                    task.projectId,
                    task.id,
                    status.value
                );

                renderTasksPage();
            });

// SHOW TASK ATTACHMENT
if (task.attachment && task.attachment.data) {
    const attachmentLink = document.createElement("a");

    attachmentLink.href = task.attachment.data;
    attachmentLink.textContent = "📎 " + task.attachment.name;
    attachmentLink.target = "_blank";
    attachmentLink.rel = "noopener noreferrer";
    attachmentLink.download = task.attachment.name;

    attachmentLink.style.display = "block";
    attachmentLink.style.marginTop = "10px";
    attachmentLink.style.color = "#9b87ff";
    attachmentLink.style.fontSize = "13px";

    info.appendChild(attachmentLink);
}

            row.append(info, status);
            results.appendChild(row);
        });

    }

    // LISTEN FOR USER INPUT
    searchInput.addEventListener("input", updateResults);
    statusFilter.addEventListener("change", updateResults);
    projectFilter.addEventListener("change", updateResults);

    // INITIAL DISPLAY
    updateResults();

}

// CALENDAR PAGE
function renderCalendarPage() {
    pageView.appendChild(
        createTextElement(
            "p",
            "page-description",
            "Upcoming task deadlines."
        )
    );

    const allTasks = projects.flatMap(project =>
        project.tasks
            .filter(task => task.dueDate)
            .map(task => ({
                ...task,
                projectName: project.name
            }))
    );

    allTasks.sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate)
    );

    if (allTasks.length === 0) {
        pageView.appendChild(
            createTextElement(
                "div",
                "page-empty",
                "No deadlines scheduled yet."
            )
        );
        return;
    }

    allTasks.forEach(task => {
        const row = document.createElement("div");
        row.className = "page-row";

        const info = document.createElement("div");

        info.appendChild(
            createTextElement("strong", "", task.name)
        );

        info.appendChild(
            createTextElement(
                "p",
                "",
                `${task.projectName} • ${task.dueDate}`
            )
        );

        row.appendChild(info);
        pageView.appendChild(row);
    });
}
}

// SETTINGS PAGE
function renderSettingsPage() {
    pageView.appendChild(
        createTextElement(
            "p",
            "page-description",
            "Basic application information."
        )
    );

    pageView.appendChild(
        createTextElement(
            "div",
            "page-empty",
            "TASKORA • Manage Work. Achieve More."
        )
    );
}

// CONNECT SIDEBAR LINKS
document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});


// GOOGLE LOGIN
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

googleLoginBtn.addEventListener("click", async () => {
    try {
        await loginWithGoogle();
        console.log("Google login berhasil!");
    } catch (error) {
        console.error("Login gagal:", error);
        alert("Login gagal. Silakan coba lagi.");
    }
});

// GOOGLE LOGOUT
logoutBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    try {
        await logoutUser();
        console.log("Logout berhasil!");
    } catch (error) {
        console.error("Logout gagal:", error);
        alert("Logout gagal. Silakan coba lagi.");
    }
});

// PANTAU STATUS LOGIN
monitorAuth((user) => {
    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");
    const dashboardGreeting = document.getElementById("dashboardGreeting");

    if (user) {
        const displayName = user.displayName || user.email || "User";

dashboardGreeting.textContent = `Good day, ${displayName}! 👋`;
        userName.textContent = user.displayName || user.email;

        userAvatar.textContent = "";

        if (user.photoURL) {
            const photo = document.createElement("img");
            photo.src = user.photoURL;
            photo.alt = "Foto profil pengguna";
            photo.style.width = "100%";
            photo.style.height = "100%";
            photo.style.borderRadius = "50%";
            photo.style.objectFit = "cover";

            userAvatar.appendChild(photo);
        } else {
            userAvatar.textContent =
                (user.displayName || user.email || "U")[0].toUpperCase();
        }

        googleLoginBtn.style.display = "none";
        logoutBtn.style.display = "block";

    } else {
        userName.textContent = "Welcome back!";
        userAvatar.textContent = "U";

        googleLoginBtn.style.display = "block";
        logoutBtn.style.display = "none";
    }
});

// =================================
// TASKORA - LIVE CLOCK
// =================================

function updateLiveClock() {
    const clockElement = document.getElementById("liveClock");
    const dateElement = document.getElementById("liveDate");

    if (!clockElement || !dateElement) return;

    const now = new Date();

    clockElement.textContent = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
});

    dateElement.textContent = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

updateLiveClock();
setInterval(updateLiveClock, 1000);


