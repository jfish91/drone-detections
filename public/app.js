
// poll every 3 seconds to check for new drones
const POLL_INTERVAL_MS = 3 * 1000;

// update table every second (for duration) 
const TABLE_TICK_MS = 1* 1000;

//histogram info
const HISTOGRAM_WINDOW_S = 5 * 60;
const RSSI_MIN = -110;
const RSSI_MAX = -65;
const BIN_SIZE = 5;


// pull all elements that will need to be updated from html file
const el = {
  status: document.getElementById('status'),
  messageCount: document.getElementById('message-count'),
  activeCount: document.getElementById('active-count'),
  bandCounts: document.getElementById('band-counts'),
  classCounts: document.getElementById('class-counts'),
  tableBody: document.getElementById('detections-body'),
  histogram: document.getElementById('rssi-histogram'),
};

// most recent current state, will be updated later
let latest = null;
let chart = null;

// set status in top corner
function setStatus(connected) {
  el.status.textContent = connected ? 'Connected' : 'Disconnected';
  el.status.className = connected ? 'connected' : 'disconnected';
}

// set simple counters to latest values 
function renderCounters() {
  el.messageCount.textContent = latest.messageCount;
  el.activeCount.textContent = latest.activeCount;
}

function renderCountList(ul, counts) {
  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      const value = document.createElement('strong');
      label.textContent = name;
      value.textContent = count;
      li.append(label, value);
      return li;
    });
  ul.replaceChildren(...items);
}

// runs on every main poll and on every second for duration
function renderTable() {
  if (!latest) return;
  const nowSec = Math.floor(Date.now() / 1000);

  // build empty table if no detections
  if (latest.activeDrones.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty';
    td.textContent = 'No active detections';
    tr.append(td);
    el.tableBody.replaceChildren(tr);
    return;
  }

  // one row for each active drone
  const rows = latest.activeDrones.map(d => {
    const tr = document.createElement('tr');
    const cells = [
      d.drone_id,
      new Date(d.start_time * 1000).toLocaleTimeString(),
      d.band,
      d.classification,
      d.rssi.toFixed(4),
      (nowSec - d.start_time),
    ];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.append(td);
    }
    return tr;
  });
  el.tableBody.replaceChildren(...rows);
}

// create empty histogram to be filled later
function createChart() {
  return new Chart(el.histogram, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'RSSI readings', data: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { title: { display: true, text: 'RSSI (dBm)' } },
        y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Count' } },
      },
    },
  });
}

// find labels and update histogram counts
function updateHistogram() {
  chart.data.labels = latest.histogram.labels;
  chart.data.datasets[0].data = latest.histogram.counts;
  console.log(latest)
  chart.update();
}

// poll for most updated information
async function poll() {
  try {
    const resp = await fetch('/api/current');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    latest = await resp.json(); 
    // when get data succesfully, status 'connected' = true
    setStatus(true);
    // render counters
    renderCounters();
    renderCountList(el.bandCounts, latest.bandCounts);
    renderCountList(el.classCounts, latest.classCounts);
    // create active drones table
    renderTable();
    // create histogram
    updateHistogram();
  } catch (err) {
    console.error('poll failed:', err);
    setStatus(false);
  } finally {
    // trigger poll to run on interval
    setTimeout(poll, POLL_INTERVAL_MS);   // schedule next only after this one finishes
  }
}

chart = createChart();
// trigger initial poll then update table every second
poll();
setInterval(renderTable, TABLE_TICK_MS); 