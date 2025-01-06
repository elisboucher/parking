const url = window.location.href;
const urlObj = new URL(url);
const params = new URLSearchParams(urlObj.search);
const scriptURL = `https://script.google.com/macros/s/${params.get('q')}/exec`

document.getElementById("doc").innerHTML = `<a href="https://docs.google.com/spreadsheets/d/${params.get('g')}/edit?gid=0#gid=0" target="_blank">DOC</a>`; 

document.getElementById("parking-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const action = document.getElementById("action").value;
    const responseDiv = document.getElementById("response");

    const data = { name, action };

    try {
        const response = await fetch(scriptURL, {
            redirect: "follow",
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "text/plain;charset=utf-8" },
        });
        const result = await response.json();
        responseDiv.textContent = result.message;
    } catch (error) {
        responseDiv.textContent = "Error: Could not connect to the server.";
    }
});