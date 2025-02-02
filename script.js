const url = window.location.href;
const urlObj = new URL(url);
const params = new URLSearchParams(urlObj.search);
const scriptURL = `https://script.google.com/macros/s/${params.get('q')}/exec`;

// Function to update the preview of LocalStorage entries
function updateLocalStoragePreview() {
    const tableBody = document.querySelector("#local-entries-table tbody");
    const unsentData = JSON.parse(localStorage.getItem("unsentData")) || [];

    tableBody.innerHTML = ""; // Clear the table
    if (unsentData.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.textContent = "No entries in LocalStorage";
        cell.colSpan = 5;
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    // Populate the table with the latest entries
    unsentData.forEach(entry => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = entry.name;

        const actionCell = document.createElement("td");
        actionCell.textContent = entry.action;

        const timestampCell = document.createElement("td");
        timestampCell.textContent = new Date(entry.timestamp).toLocaleString();

        const durationCell = document.createElement("td");
        durationCell.textContent = entry.duration || "--";

        const statusCell = document.createElement("td");
        statusCell.textContent = entry.status === "local" ? "Local *" : "Synced";

        row.appendChild(nameCell);
        row.appendChild(actionCell);
        row.appendChild(timestampCell);
        row.appendChild(durationCell);
        row.appendChild(statusCell);

        tableBody.appendChild(row);
    });
}

// Save to LocalStorage with 'local' status
function saveToLocalStorage(data) {
    const unsentData = JSON.parse(localStorage.getItem("unsentData")) || [];
    data.status = "local";
    unsentData.push(data);
    localStorage.setItem("unsentData", JSON.stringify(unsentData));
    updateLocalStoragePreview();
}

// Find the closest check-in and calculate duration
function calculateDuration(name) {
    const unsentData = JSON.parse(localStorage.getItem("unsentData")) || [];
    let closestCheckIn = null;

    for (let i = unsentData.length - 1; i >= 0; i--) {
        const entry = unsentData[i];
        if (entry.name === name && entry.action === "check-in" && !entry.duration) {
            closestCheckIn = entry;
            break;
        }
    }

    if (closestCheckIn) {
        const checkInTime = new Date(closestCheckIn.timestamp);
        const checkOutTime = new Date();
        const durationHours = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);

        closestCheckIn.duration = `${durationHours} hours`;
        saveToLocalStorage({ name, action: "check-out", timestamp: checkOutTime.toISOString(), duration: `${durationHours} hours` });

        document.getElementById("duration-display").textContent = `Duration: ${durationHours} hours`;
    } else {
        document.getElementById("duration-display").textContent = "Duration: --";
    }
}

// Publish unsent data to the server
async function publishToServer() {
    const responseDiv = document.getElementById("response");
    const unsentData = JSON.parse(localStorage.getItem("unsentData")) || [];

    if (unsentData.length === 0) {
        responseDiv.textContent = "No data to publish.";
        return;
    }

    try {
        const updatedData = await Promise.all(
            unsentData.map(async (entry) => {
                if (entry.status === "local") {
                    const response = await fetch(scriptURL, {
                        redirect: "follow",
                        method: "POST",
                        body: JSON.stringify(entry),
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                    });

                    if (response.ok) {
                        entry.status = "sync"; // Update status to 'sync' if successful
                    }
                }
                return entry;
            })
        );

        localStorage.setItem("unsentData", JSON.stringify(updatedData)); // Save updated data back to LocalStorage
        responseDiv.textContent = "Data published successfully.";
    } catch (error) {
        responseDiv.textContent = "Error: Could not connect to the server.";
    }

    updateLocalStoragePreview(); // Refresh the table
}

// Update the preview on page load
document.addEventListener("DOMContentLoaded", updateLocalStoragePreview);

// Attach event listeners for Check In and Check Out
document.querySelector(".check-in-btn").addEventListener("click", () => {
    const name = document.getElementById("name").value.trim();
    if (name) saveToLocalStorage({ name, action: "check-in", timestamp: new Date().toISOString() });
});
document.querySelector(".check-out-btn").addEventListener("click", () => {
    const name = document.getElementById("name").value.trim();
    if (name) calculateDuration(name);
});

// Attach event listener for Publish to Server button
document.getElementById("publish-btn").addEventListener("click", publishToServer);
