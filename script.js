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
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47, text.length - 2));
    return json.table.rows.map(r => r.c.map(c => (c ? c.v : "")));
  } catch (err) {
    console.error(`Kan ikke hente arket ${sheetName}:`, err);
    return [];
  }
}

// Opdater ordreoversigt og nyheder
async function updateScreen() {
  // --- Ordreoversigt ---
  const ordreData = await fetchSheet("Ordreoversigt");
  const scheduleBody = document.querySelector("#schedule tbody");
  scheduleBody.innerHTML = "";
  ordreData.forEach(row => {
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

  // --- Nyheder ---
  const newsData = await fetchSheet("Nyheder");
  const nyhederDiv = document.getElementById("nyheder");
  if(newsData.length > 0){
    nyhederDiv.innerText = newsData.map(r => r[0]).join("  |  ");
  } else {
    nyhederDiv.innerText = "Kan ikke indlæse nyheder.";
  }
}

// Første opdatering og derefter hvert 2. minut
updateScreen();
setInterval(updateScreen, 120000);
