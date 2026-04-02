// ================================
// Teacher Dashboard – teacher.js
// ================================

const SHEETDB_URL = "https://sheetdb.io/api/v1/zx6dhwh919vkh";
let allData = [];

// Helper
function $(sel) {
  return document.querySelector(sel);
}

// ── Load data from SheetDB ──
async function loadData() {
  setStatus('Loading...');
  try {
    const res = await fetch(SHEETDB_URL);
    allData = await res.json();
    renderTable(allData);
    setStatus(`${allData.length} entries loaded.`);
  } catch (err) {
    setStatus('Failed to load data. Check your connection.');
    console.error(err);
  }
}

// ── Render table ──
function renderTable(data) {
  const body = $('#tableBody');
  body.innerHTML = '';

  if (data.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;">No entries found.</td></tr>';
    return;
  }

  data.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(e.date    || '')}</td>
      <td>${escapeHtml(e.org     || '')}</td>
      <td>${escapeHtml(e.cause   || '')}</td>
      <td>${escapeHtml(e.desc    || '')}</td>
      <td>${escapeHtml(String(e.hours || ''))}</td>
      <td>${escapeHtml(e.contact || '')}</td>
    `;
    body.appendChild(tr);
  });

  updateTotals(data);
}

// ── Total hours summary ──
function updateTotals(data) {
  const total = data.reduce((acc, e) => acc + Number(e.hours || 0), 0);
  const totalEl = $('#totalHours');
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

// ── Filter ──
function applyFilter() {
  const org   = $('#filterOrg')   ? $('#filterOrg').value.trim().toLowerCase()   : '';
  const cause = $('#filterCause') ? $('#filterCause').value.trim().toLowerCase() : '';

  const filtered = allData.filter(e =>
    (e.org   || '').toLowerCase().includes(org) &&
    (e.cause || '').toLowerCase().includes(cause)
  );

  renderTable(filtered);
  setStatus(`${filtered.length} of ${allData.length} entries shown.`);
}

function clearFilter() {
  if ($('#filterOrg'))   $('#filterOrg').value   = '';
  if ($('#filterCause')) $('#filterCause').value = '';
  renderTable(allData);
  setStatus(`${allData.length} entries loaded.`);
}

// ── Export CSV ──
function exportCSV() {
  if (!allData.length) return alert('No data to export.');
  const rows = [
    ['Date', 'Organization', 'Cause', 'Description', 'Hours', 'Contact'],
    ...allData.map(e => [e.date, e.org, e.cause, e.desc, e.hours, e.contact])
  ];
  const csv = rows
    .map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'all_service_hours.csv';
  a.click();
}

// ── Helpers ──
function setStatus(msg) {
  const el = $('#status');
  if (el) el.textContent = msg;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Wire up buttons ──
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  const refreshBtn = $('#refreshBtn');
  const filterBtn  = $('#applyFilter');
  const clearBtn   = $('#clearFilter');
  const exportBtn  = $('#exportBtn');

  if (refreshBtn) refreshBtn.addEventListener('click', loadData);
  if (filterBtn)  filterBtn.addEventListener('click', applyFilter);
  if (clearBtn)   clearBtn.addEventListener('click', clearFilter);
  if (exportBtn)  exportBtn.addEventListener('click', exportCSV);
});