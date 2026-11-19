
// Hospital Emergency Patient Management System

let waitingPatients = JSON.parse(
    localStorage.getItem("waitingPatients") || "[]"
);

let treatedPatients = JSON.parse(
    localStorage.getItem("treatedPatients") || "[]"
);

// Save patient records
function saveData() {
    localStorage.setItem(
        "waitingPatients",
        JSON.stringify(waitingPatients)
    );

    localStorage.setItem(
        "treatedPatients",
        JSON.stringify(treatedPatients)
    );
}

// Priority names
function getPriorityName(priority) {
    if (priority === 1) return "Critical";
    if (priority === 2) return "Moderate";
    return "Low";
}

// Display date and time
function formatDate(date) {
    return new Date(date).toLocaleString();
}

// Register patient
document.getElementById("patientForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    let id = Number(document.getElementById("patientId").value);
    let name = document.getElementById("patientName").value.trim();
    let priority = Number(document.getElementById("priority").value);

    let message = document.getElementById("message");

    if (!Number.isSafeInteger(id) || id <= 0 || name === "") {
        message.textContent = "Please enter valid patient details.";
        return;
    }

    if (![1, 2, 3].includes(priority)) {
        message.textContent = "Please select a valid priority.";
        return;
    }

    let exists = [...waitingPatients, ...treatedPatients]
        .some(patient => patient.id === id);

    if (exists) {
        message.textContent = "Patient ID already exists!";
        return;
    }

    let patient = {
        id: id,
        name: name,
        priority: priority,
        registeredTime: Date.now()
    };

    waitingPatients.push(patient);

    saveData();
    displayPatients();

    message.textContent = "Patient registered successfully!";
    message.style.color = "green";

    document.getElementById("patientForm").reset();
});

// Display waiting and treated patients
function displayPatients() {

    let waitingTable = document.getElementById("waitingTable");
    let treatedTable = document.getElementById("treatedTable");

    waitingTable.innerHTML = "";
    treatedTable.innerHTML = "";

    // Sort by priority, then registration time
    let sortedPatients = [...waitingPatients].sort((a, b) => {
        return a.priority - b.priority ||
               a.registeredTime - b.registeredTime;
    });

    sortedPatients.forEach(patient => {

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${escapeHTML(patient.name)}</td>
            <td>${getPriorityName(patient.priority)}</td>
            <td>${formatDate(patient.registeredTime)}</td>
        `;

        waitingTable.appendChild(row);
    });

    // Treated patients: newest first
    treatedPatients.forEach(patient => {

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${escapeHTML(patient.name)}</td>
            <td>${getPriorityName(patient.priority)}</td>
            <td>${formatDate(patient.treatedTime)}</td>
        `;

        treatedTable.appendChild(row);
    });

    // Dashboard counts
    document.getElementById("waitingCount").textContent =
        waitingPatients.length;

    document.getElementById("criticalCount").textContent =
        waitingPatients.filter(p => p.priority === 1).length;

    document.getElementById("moderateCount").textContent =
        waitingPatients.filter(p => p.priority === 2).length;

    document.getElementById("treatedCount").textContent =
        treatedPatients.length;
}

// Prevent HTML injection through patient names
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Treat next patient
document.getElementById("treatButton")
.addEventListener("click", function() {

    if (waitingPatients.length === 0) {
        alert("No patients waiting for treatment!");
        return;
    }

    // Find highest priority, preserving arrival order for ties
    let selectedIndex = 0;

    for (let i = 1; i < waitingPatients.length; i++) {

        if (
            waitingPatients[i].priority <
            waitingPatients[selectedIndex].priority
        ) {
            selectedIndex = i;
        }
    }

    // Remove from waiting list
    let patient = waitingPatients.splice(selectedIndex, 1)[0];

    // Push into treated history
    patient.treatedTime = Date.now();
    treatedPatients.unshift(patient);

    saveData();
    displayPatients();

    alert(patient.name + " has been moved to treated records.");
});

// Search patient
document.getElementById("searchButton")
.addEventListener("click", function() {

    let id = Number(document.getElementById("searchId").value);

    let result = document.getElementById("searchResult");

    if (!Number.isSafeInteger(id) || id <= 0) {
        result.textContent = "Enter a valid patient ID.";
        return;
    }

    let patient = waitingPatients.find(p => p.id === id);

    let status = "Waiting";

    if (!patient) {
        patient = treatedPatients.find(p => p.id === id);
        status = "Treated";
    }

    if (patient) {

        result.innerHTML = `
            <h3>Patient Found</h3>
            <p>Patient ID: ${patient.id}</p>
            <p>Name: ${escapeHTML(patient.name)}</p>
            <p>Priority: ${getPriorityName(patient.priority)}</p>
            <p>Status: ${status}</p>
        `;

    } else {

        result.textContent = "Patient not found!";
    }
});

// Load saved records when website opens
displayPatients();
