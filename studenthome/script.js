// ================================
// Community Service Hours Tracker
// Clean Local Version
// ================================

const GOAL_HOURS = 30;
let entries = [];

// Helper for querySelector
function $(sel) {
  return document.querySelector(sel);
}

// Fixed Storage Key
function storageKey() {
  return 'cs_hours_entries_v3_local';
}

// Load entries from localStorage
function load() {
  const raw = localStorage.getItem(storageKey());
  entries = raw ? JSON.parse(raw) : [];
  renderEntries(entries);
  updateSummary();
}

function save() {
  const lastEntry = entries[entries.length - 1];
  const sheetdbUrl = "https://sheetdb.io/api/v1/zx6dhwh919vkh"; // ← paste your URL

  localStorage.setItem(storageKey(), JSON.stringify(entries));

  fetch(sheetdbUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [lastEntry] }) // SheetDB expects { data: [...] }
  })
  .then(res => res.json())
  .then(data => {
    console.log("SheetDB response:", data);
  })
  .catch(err => {
    console.error("Error:", err);
  });
}

// Format date nicely
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString();
}

// Escape HTML for safety
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render table entries
function renderEntries(list) {
  const body = $('#entriesBody');
  if (!body) return;
  body.innerHTML = '';

  list
    .slice()
    .reverse()
    .forEach((e, idx) => {
      const originalIndex = list.length - 1 - idx;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(e.date)}</td>
        <td>${escapeHtml(e.org)}</td>
        <td>${escapeHtml(e.cause || '')}</td>
        <td>${escapeHtml(e.desc || '')}</td>
        <td>${Number(e.hours).toFixed(2)}</td>
        <td>${escapeHtml(e.contact || '')}</td>
        <td>
          <button class="action-btn duplicate-btn" onclick="duplicateEntry(${originalIndex})">Redo</button>
          <button class="action-btn delete-btn" onclick="deleteEntry(${originalIndex})">Delete</button>
        </td>
      `;
      body.appendChild(tr);
    });
}


// Update total hours & progress bar
function updateSummary() {
  const total = entries.reduce((acc, e) => acc + Number(e.hours || 0), 0);
  $('#totalHours').textContent = total.toFixed(2);

  const percent = Math.min(100, Math.round((total / GOAL_HOURS) * 100));
  $('#progressFill').style.width = percent + '%';
  $('#progressPercent').textContent = percent + '%';
  $('#progressBar').setAttribute('aria-valuenow', percent);

  const goalDisplay = $('#goalDisplay');
  if (goalDisplay) goalDisplay.textContent = GOAL_HOURS;
}

// --- Action Functions ---

window.duplicateEntry = function(index) {
  const entry = entries[index];
  if (!entry) return;

  // Populates the form with existing data
  $('#date').value = entry.date;
  $('#org').value = entry.org;
  $('#cause').value = entry.cause;
  $('#hours').value = entry.hours;
  $('#desc').value = entry.desc || '';
  if ($('#contact')) $('#contact').value = entry.contact || '';

  // Focus the date for quick editing
  $('#date').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteEntry = function(index) {
  if (!confirm('Delete this entry?')) return;
  entries.splice(index, 1);
  // Manual save for delete to avoid re-triggering the fetch
  localStorage.setItem(storageKey(), JSON.stringify(entries));
  renderEntries(entries);
  updateSummary();
};

// --- Event Listeners ---

$('#entryForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = $('#date').value;
  const org = $('#org').value.trim();
  const cause = $('#cause').value.trim();
  const hours = parseFloat($('#hours').value);
  const desc = $('#desc').value.trim();
  const contact = $('#contact') ? $('#contact').value.trim() : '';

  if (!date || !org || !hours || hours <= 0) {
    alert('Please fill out all required fields.');
    return;
  }

  entries.push({ date, org, cause, hours: Number(hours), desc, contact });
  save();
  renderEntries(entries);
  updateSummary();

  // Clear specific fields but keep Org/Contact logic for flow? 
  // No, we clear them for a fresh entry. Use 'Redo' to bring them back.
  $('#hours').value = '';
  $('#desc').value = '';
  $('#cause').value = '';
});

$('#clearBtn').addEventListener('click', () => {
  if (!confirm('Clear ALL entries?')) return;
  entries = [];
  // Manual save for clear to avoid re-triggering the fetch
  localStorage.setItem(storageKey(), JSON.stringify(entries));
  renderEntries(entries);
  updateSummary();
});

$('#exportBtn').addEventListener('click', () => {
  if (entries.length === 0) return alert('No entries to export.');
  const rows = [
    ['Date', 'Organization', 'Description', 'Hours', 'Contact'],
    ...entries.map(e => [e.date, e.org, e.cause, e.desc, e.hours, e.contact])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'volunteer_hours.csv';
  a.click();
}); 

// Filtering logic
$('#applyFilter').addEventListener('click', () => {
  const q = $('#filterOrg').value.trim().toLowerCase();
  const filtered = entries.filter(e => e.org.toLowerCase().includes(q));
  renderEntries(filtered);
});

$('#clearFilter').addEventListener('click', () => {
  $('#filterOrg').value = '';
  renderEntries(entries);
});

// ── Auto-fill from QR code URL params ──
function prefillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('org')) return; // no prefill data, skip

  if (params.get('date'))    $('#date').value    = params.get('date');
  if (params.get('org'))     $('#org').value     = params.get('org');
  if (params.get('cause'))   $('#cause').value   = params.get('cause');
  if (params.get('hours'))   $('#hours').value   = params.get('hours');
  if (params.get('desc'))    $('#desc').value    = params.get('desc');
  if (params.get('contact')) $('#contact').value = params.get('contact');
}

prefillFromUrl(); 

// Initialize
load();
