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

// Opdater skærm
async function updateScreen() {
  // Ordreoversigt
  const ordreoversigt = await fetchSheet("Ordreoversigt");
  const scheduleBody = document.querySelector("#schedule tbody");
  scheduleBody.innerHTML = "";
  ordreoversigt.forEach(row => {
    if (row[0] && row[1] && row[2] && row[3] && row[4]) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
      <td>${row[4]}</td>
      <td>${row[5] ? row[5] : ""}</td> <!-- Klar -->
    `;
    scheduleBody.appendChild(tr);
  }
});

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