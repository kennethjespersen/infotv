// ---- INDSTIL DIT SHEET-ID HER ---- 
const SHEET_ID = "1oZCqUjYE54ePWnpYqARtklEBBq1wwl3dKOyF2TmcCtU";

// ---- Live dato og tid ----
function updateDate() {
  const dateEl = document.getElementById('date');
  const now = new Date();
  dateEl.textContent = now.toLocaleString('da-DK', { dateStyle: 'full', timeStyle: 'short' });
}
updateDate();
setInterval(updateDate, 60000);

// ---- VEJRUDSIGT ----
async function updateWeather() {
  const weatherEl = document.getElementById("weather");
  if (!weatherEl) return; // Hvis elementet ikke findes i HTML

  try {
    // Koordinater for Lunderskov
    const lat = 55.4838;
    const lon = 9.2992;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&windspeed_unit=ms`;
    const res = await fetch(url);
    const data = await res.json();

    const temp = Math.round(data.current_weather.temperature);
    const wind = Math.round(data.current_weather.windspeed);
    const icon = data.current_weather.weathercode;

    const hour = new Date().getHours(); // Hent nuværende time
    const isNight = hour >= 20 || hour < 7; // Nat mellem 20:00-06:59

    // Beskrivelse baseret på Open-Meteo weather codes
    const weatherIcons = {
      0: isNight ? "🌙 Klart" : "☀️ Klart", // ☀️ fra 07:00-19:59, 🌙 ellers
      1: "🌤️ Let skyet",
      2: "⛅ Delvist skyet",
      3: "☁️ Overskyet",
      45: "🌫️ Tåge",
      48: "🌫️ Tåge",
      51: "🌦️ Finregn",
      61: "🌧️ Regn",
      63: "🌧️ Kraftig regn",
      71: "❄️ Sne",
      95: "⛈️ Torden"
    };

    const desc = weatherIcons[icon] || "🌡️";

    weatherEl.textContent = `${desc} · ${temp}°C · Vind: ${wind} m/s`;
  } catch (err) {
    console.error("Fejl ved hentning af vejr:", err);
    weatherEl.textContent = "Vejrdata utilgængelige";
  }
}

// Første kald + opdater hver 15. minut
updateWeather();
setInterval(updateWeather, 900000);

// ---- Hent data fra Google Sheet JSON ----
async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(47, text.length - 2));
  return json.table.rows.map(r => r.c.map(c => (c ? c.v : "")));
}

// --- Pagination variabler ---
let ordreData = [];
let currentPage = 0;
const rowsPerPage = 10;

// Vis en side af ordreoversigten
function showPage(page) {
  const scheduleBody = document.querySelector("#schedule tbody");
  scheduleBody.innerHTML = "";

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = ordreData.slice(start, end);

  pageData.forEach(row => {
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

  // Opdater sidetal under tabellen
  const totalPages = Math.ceil(ordreData.length / rowsPerPage);
  let pageIndicator = document.getElementById("pageIndicator");
  if (!pageIndicator) {
    pageIndicator = document.createElement("p");
    pageIndicator.id = "pageIndicator";
    pageIndicator.style.textAlign = "center";
    pageIndicator.style.fontWeight = "bold";
    pageIndicator.style.marginTop = "10px";
    document.querySelector("#schedule").after(pageIndicator);
  }
  pageIndicator.textContent = `Side ${page + 1} af ${totalPages}`;
}

// ---- Opdater skærm ----
async function updateScreen() {
  // Ordreoversigt
  ordreData = await fetchSheet("Ordreoversigt");
  currentPage = 0;
  showPage(currentPage);

  // Arbejdsoversigt
  const tasks = await fetchSheet("Arbejdsoversigt");
  const tasksBody = document.querySelector("#tasks tbody");
  tasksBody.innerHTML = "";
  tasks.forEach(row => {
    if (row[0] && row[1]) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td>`;
      tasksBody.appendChild(tr);
    }
  });
}

// Første opdatering og derefter hvert 2. minut
updateScreen();
setInterval(updateScreen, 120000);

// Skift side i ordreoversigten hvert minut
setInterval(() => {
  if (ordreData.length === 0) return;

  const totalPages = Math.ceil(ordreData.length / rowsPerPage);
  currentPage++;
  if (currentPage >= totalPages) currentPage = 0;

  showPage(currentPage);
}, 60000);

// ---- Rullende nyheder ----
const sheetName = "Nyheder";
const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

async function loadNews() {
  try {
    const res = await fetch(csvUrl);
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
