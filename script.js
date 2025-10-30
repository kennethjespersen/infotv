// ---- INDSTIL DIT SHEET-ID HER ----
const SHEET_ID = "1oZCqUjYE54ePWnpYqARtklEBBq1wwl3dKOyF2TmcCtU";

// Live dato og tid
function updateDate() {
  const dateEl = document.getElementById('date');
  const now = new Date();
  dateEl.textContent = now.toLocaleString('da-DK', { dateStyle: 'full', timeStyle: 'short' });
}
updateDate();
setInterval(updateDate, 60000);

// Hent data fra Google Sheet JSON
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
    // Hvis elementet ikke findes, opret det under tabellen
    pageIndicator = document.createElement("p");
    pageIndicator.id = "pageIndicator";
    pageIndicator.style.textAlign = "center";
    pageIndicator.style.fontWeight = "bold";
    pageIndicator.style.marginTop = "10px";
    document.querySelector("#schedule").after(pageIndicator);
  }
  pageIndicator.textContent = `Side ${page + 1} af ${totalPages}`;
}

// Opdater skærm
async function updateScreen() {
  // Ordreoversigt
  ordreData = await fetchSheet("Ordreoversigt");
  currentPage = 0; // Start altid fra første side efter opdatering
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

// Rullende nyheder
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
