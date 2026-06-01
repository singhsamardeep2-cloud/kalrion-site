// Admin Console and CRM Analytics Logic


let sourceChart = null;
let timelineChart = null;

// Helper to format date cleanly
const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Check authentication state
const checkAuth = () => {
  const logged = sessionStorage.getItem('kalrion_admin_logged') === 'true';
  const loginSec = document.getElementById('login-section');
  const dashSec = document.getElementById('dashboard-section');
  const userInfo = document.getElementById('admin-user-info');

  if (logged) {
    if (loginSec) loginSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'block';
    if (userInfo) userInfo.style.display = 'flex';
    initDashboard();
  } else {
    if (loginSec) loginSec.style.display = 'block';
    if (dashSec) dashSec.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
  }
};

// Handle Login Submission
const handleLogin = (e) => {
  e.preventDefault();
  const user = document.getElementById('login-username').value.trim();
  const pass = document.getElementById('login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  // Accept admin/admin or admin/kalrion2026
  if (user === 'admin' && (pass === 'admin' || pass === 'kalrion2026')) {
    sessionStorage.setItem('kalrion_admin_logged', 'true');
    if (errorMsg) errorMsg.style.display = 'none';
    document.getElementById('admin-login-form').reset();
    checkAuth();
  } else {
    if (errorMsg) errorMsg.style.display = 'block';
  }
};

// Toggle Lead Status
const toggleLeadStatus = (leadId) => {
  try {
    const leads = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)) || [];
    const leadIndex = leads.findIndex(l => l.id === leadId);
    if (leadIndex > -1) {
      leads[leadIndex].status = leads[leadIndex].status === 'New' ? 'Contacted' : 'New';
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(leads));
      renderLeads();
      updateMetrics();
    }
  } catch (e) {
    console.error("Error toggling lead status", e);
  }
};

// Update Metrics Row
const updateMetrics = () => {
  const leads = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)) || [];
  const total = leads.length;

  document.getElementById('metric-total-leads').textContent = total;

  const waCount = leads.filter(l => l.actionType === 'WhatsApp Click').length;
  const callCount = leads.filter(l => l.actionType === 'Call Click').length;

  document.getElementById('metric-wa-leads').textContent = waCount;
  document.getElementById('metric-call-leads').textContent = callCount;

  const waPercent = total > 0 ? Math.round((waCount / total) * 100) : 0;
  const callPercent = total > 0 ? Math.round((callCount / total) * 100) : 0;

  document.getElementById('metric-wa-percent').textContent = `${waPercent}% of total`;
  document.getElementById('metric-call-percent').textContent = `${callPercent}% of total`;

  // Calculate Popular Source Page
  if (total > 0) {
    const pageCounts = {};
    leads.forEach(l => {
      pageCounts[l.page] = (pageCounts[l.page] || 0) + 1;
    });
    let maxPage = 'N/A';
    let maxCount = 0;
    Object.keys(pageCounts).forEach(page => {
      if (pageCounts[page] > maxCount) {
        maxCount = pageCounts[page];
        maxPage = page;
      }
    });
    const pageName = (maxPage && typeof maxPage === 'string') ? maxPage.split(' - ')[0] : 'N/A';
    document.getElementById('metric-popular-source').textContent = pageName;
  } else {
    document.getElementById('metric-popular-source').textContent = 'N/A';
  }
};

// Filter and Render Leads Feed
const renderLeads = () => {
  const leads = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)) || [];
  const tableBody = document.getElementById('leads-table-body');
  
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // Get filter inputs
  const searchQuery = document.getElementById('crm-search-filter').value.toLowerCase();
  const sourceFilter = document.getElementById('crm-source-filter').value;
  const actionFilter = document.getElementById('crm-action-filter').value;

  const filteredLeads = leads.filter(lead => {
    const detailsVal = lead.details || '';
    const pageVal = lead.page || '';
    const matchesSearch = detailsVal.toLowerCase().includes(searchQuery) || pageVal.toLowerCase().includes(searchQuery);
    const matchesSource = sourceFilter === 'all' || lead.page === sourceFilter;
    const matchesAction = actionFilter === 'all' || lead.actionType === actionFilter;
    return matchesSearch && matchesSource && matchesAction;
  });

  document.getElementById('crm-active-leads-count').textContent = `${filteredLeads.length} matches`;

  if (filteredLeads.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 30px;">No matching enquiries found in log.</td></tr>`;
    return;
  }

  filteredLeads.forEach(lead => {
    const tr = document.createElement('tr');
    
    const dateStr = formatDate(lead.timestamp);
    const statusClass = lead.status.toLowerCase();
    const actionText = lead.actionType;
    
    tr.innerHTML = `
      <td><strong>${dateStr.split(',')[0]}</strong><br/><small style="color: var(--muted);">${dateStr.split(',')[1] || ''}</small></td>
      <td><span style="font-weight:700; color: var(--primary-dark);">${lead.page}</span></td>
      <td><span style="font-weight:600; color: ${actionText.includes('Call') ? 'var(--accent-dark)' : 'var(--primary)'}">${actionText}</span></td>
      <td><code style="background: var(--paper); padding: 4px 8px; border-radius: 4px; font-size: 0.76rem; display: block; border: 1px solid var(--line); white-space: pre-wrap; line-height: 1.4;">${lead.details}</code></td>
      <td style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
        <span class="status-badge ${statusClass}">${lead.status}</span>
        <button class="status-btn" onclick="toggleLeadStatus('${lead.id}')">Toggle Status</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
};

// Render Chart.js Analytics Diagrams
const renderAnalyticsCharts = () => {
  if (typeof Chart === 'undefined') {
    console.warn("Kalrion CRM: Chart.js library is not loaded. Skipping chart rendering.");
    return;
  }
  const leads = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)) || [];

  // 1. Source Breakup Chart
  const sources = {
    'Home Page': 0,
    'Loan EMI Calculator': 0,
    'SIP Growth Planner': 0,
    'Gold Tracker': 0,
    'Tax Planner': 0
  };

  leads.forEach(l => {
    // Group sub-pages together
    let key = l.page;
    if (key.includes('Home Page')) key = 'Home Page';
    if (sources.hasOwnProperty(key)) {
      sources[key]++;
    }
  });

  const sourceCtx = document.getElementById('sourceSplitChart');
  if (sourceCtx) {
    if (sourceChart) sourceChart.destroy();
    
    sourceChart = new Chart(sourceCtx, {
      type: 'doughnut',
      data: {
        labels: ['Home Page', 'Loans', 'SIP', 'Gold', 'Tax'],
        datasets: [{
          data: Object.values(sources),
          backgroundColor: ['#4A5D54', '#D4AF37', '#AA820A', '#166D4C', '#0A4D34'],
          borderWidth: 1.5,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 9, family: 'Plus Jakarta Sans' }, boxWidth: 10 }
          }
        },
        cutout: '60%'
      }
    });
  }

  // 2. Daily Timeline Timeline Chart (Last 7 Days)
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    days[dateStr] = 0;
  }

  leads.forEach(l => {
    const dateStr = new Date(l.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (days.hasOwnProperty(dateStr)) {
      days[dateStr]++;
    }
  });

  const timelineCtx = document.getElementById('timelineChart');
  if (timelineCtx) {
    if (timelineChart) timelineChart.destroy();

    timelineChart = new Chart(timelineCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(days),
        datasets: [{
          label: 'Total Leads',
          data: Object.values(days),
          backgroundColor: '#0A4D34',
          borderRadius: 4,
          barThickness: 18
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: '#E1E8E5' },
            ticks: {
              stepSize: 1,
              font: { size: 8, family: 'Plus Jakarta Sans' }
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 8, family: 'Plus Jakarta Sans' } }
          }
        }
      }
    });
  }
};

// Export leads to CSV Sheet
const exportToCSV = () => {
  const leads = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)) || [];
  if (leads.length === 0) {
    alert("CRM is empty. No data to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Lead ID,Date & Time,Page Source,Action Type,Enquiry Details,Status\n";

  leads.forEach(l => {
    const detailsStr = l.details || '';
    const row = [
      l.id || '',
      formatDate(l.timestamp).replace(',', ' -'),
      l.page || '',
      l.actionType || '',
      `"${detailsStr.replace(/"/g, '""')}"`,
      l.status || ''
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `kalrion_crm_leads_${Date.now()}.csv`);
  document.body.appendChild(link); // Required for FF
  link.click();
  document.body.removeChild(link);
};

// Clear Logs
const clearLogs = () => {
  const confirmClear = confirm("⚠️ Are you sure you want to reset all CRM logs? This will delete all current lead entries and restore initial mock data.");
  if (confirmClear) {
    localStorage.removeItem(CRM_STORAGE_KEY);
    // Trigger seed from crm-logger
    if (window.logLead) {
      window.logLead("System", "Reset", "CRM database reset and re-seeded.");
    }
    initDashboard();
  }
};

// Initialize Admin Dashboard
const initDashboard = () => {
  updateMetrics();
  renderLeads();
  renderAnalyticsCharts();

  // Setup lead toggling globally
  window.toggleLeadStatus = toggleLeadStatus;
};

// Event Bindings
const setupAdminEvents = () => {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('kalrion_admin_logged');
      checkAuth();
    });
  }

  // Filters Event Listeners
  const searchFilter = document.getElementById('crm-search-filter');
  const sourceFilter = document.getElementById('crm-source-filter');
  const actionFilter = document.getElementById('crm-action-filter');

  if (searchFilter) searchFilter.addEventListener('input', renderLeads);
  if (sourceFilter) sourceFilter.addEventListener('change', renderLeads);
  if (actionFilter) actionFilter.addEventListener('change', renderLeads);

  // Exporter and resets
  const exportBtn = document.getElementById('crm-export-btn');
  const clearBtn = document.getElementById('crm-clear-btn');

  if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
  if (clearBtn) clearBtn.addEventListener('click', clearLogs);
};

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupAdminEvents();
  checkAuth();
});
