// ---- INDSTIL DIT SHEET-ID OG VEJR ----
const SHEET_ID = "1oZCqUjYE54ePWnpYqARtklEBBq1wwl3dKOyF2TmcCtU";
const CITY = "Lunderskov";
const WEATHER_API_KEY = "1479d27b5af8ba5ba10105874505ff92";

// --- Live dato og klokke ---
function updateDate() {
  const dateEl = document.getElementById('date');
  const now = new Date();
  dateEl.textContent = now.toLocaleString('da-DK', { dateStyle: 'full', timeStyle: 'short' });
}
updateDate();
setInterval(updateDate, 1000);

// --- Hent data fra Google Sheet JSON med fejlhåndtering ---
async function fetchSheet(sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
    if (!json.table.rows) return [];
    return json.table.rows.map(r => r.c.map(c => (c ? c.v : "")));
  } catch (err) {
    console.error("Fejl ved hentning af sheet:", sheetName, err);
    return [];
  }
}

// --- Ordreoversigt med pagination ---
let ordreData = [];
let currentPage = 0;
const rowsPerPage = 10;

async function updateOrders() {
  ordreData = await fetchSheet("Ordreoversigt");
  showPage(); // vis første side
}

function showPage() {
  const scheduleBody = document.querySelector("#schedule tbody");
  if (!scheduleBody) return;
  scheduleBody.innerHTML = "";

  const start = currentPage * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = ordreData.slice(start, end);

  pageRows.forEach(row => {
    if (row[0] && row[1] && row[2] && row[3] && row[4]) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
        <td>${row[5] ? row[5] : ""}</td>
      `;
      scheduleBody.appendChild(tr);
    }
  });

  currentPage++;
  if (currentPage * rowsPerPage >= ordreData.length) {
    currentPage = 0;
  }
}

// --- Arbejdsoversigt ---
async function updateTasks() {
  const tasks = await fetchSheet("Arbejdsoversigt");
  const tasksBody = document.querySelector("#tasks tbody");
  if (!tasksBody) return;
  tasksBody.innerHTML = "";
  tasks.forEach(row => {
    if (row[0] && row[1]) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td>`;
      tasksBody.appendChild(tr);
    }
  });
}

// --- Opdater hele skærmen ---
async function updateScreen() {
  await updateOrders();
  await updateTasks();
}

// Første opdatering
updateScreen();
setInterval(showPage, 30 * 1000);           // Skift side i Ordreoversigt
setInterval(updateScreen, 10 * 60 * 1000);   // Opdater hele skærmen hvert 10. minut

// --- Rullende nyheder ---
const newsCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Nyheder`;

async function loadNews() {
  try {
    const res = await fetch(newsCsvUrl);
    const text = await res.text();
    const rows = text.split("\n").map(r => r.split(",")[0].trim());
    const newsText = rows.join("  |  ");
    document.getElementById("nyheder").innerText = newsText;
  } catch (err) {
    console.error("Kan ikke hente nyheder:", err);
    document.getElementById("nyheder").innerText = "Kan ikke indlæse nyheder.";
  }
}

loadNews();
setInterval(loadNews, 60000);

// --- Vejr ---
async function hentVejr() {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&lang=da&appid=${WEATHER_API_KEY}`);
    if (!res.ok) throw new Error("API-fejl");
    const data = await res.json();

    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;

    document.getElementById("city").innerText = CITY;
    document.getElementById("temp").innerText = `${temp}°C`;
    document.getElementById("desc").innerText = desc;
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    document.getElementById("weather-icon").alt = desc;

  } catch (err) {
    console.error(err);
    document.getElementById("temp").innerText = "Kunne ikke hente vejr 🌧️";
    document.getElementById("desc").innerText = "";
    document.getElementById("weather-icon").src = "";
  }
}

// Opdater vejret én gang og derefter hvert 1. minut
hentVejr();
setInterval(hentVejr, 1 * 60 * 1000);
