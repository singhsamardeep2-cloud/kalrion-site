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
        <button class="status-btn" onclick="openReplyModal('${lead.id}')" style="border-color: var(--primary); color: var(--primary); background: var(--cream);">💬 Draft Reply</button>
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
    'Tax Planner': 0,
    'Book Shop': 0
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
        labels: ['Home Page', 'Loans', 'SIP', 'Gold', 'Tax', 'Book Shop'],
        datasets: [{
          data: Object.values(sources),
          backgroundColor: ['#4A5D54', '#D4AF37', '#AA820A', '#166D4C', '#0A4D34', '#7f5a04'],
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

// CRM Lead Outreach Automation & AI Content Factory Addition

// Extractor helper to parse key-value lines out of details string
const extractField = (str, label) => {
  const regex = new RegExp(`(?:${label})\\s*:\\s*([^|\\n]+)`, 'i');
  const match = str.match(regex);
  return match ? match[1].trim() : null;
};

// Generate personalized WhatsApp Outreach Scripts based on lead parameters
const generateOutreachDraft = (lead) => {
  const details = lead.details || '';
  // Try parsing name, default to "Customer"
  let name = extractField(details, "Buyer") || extractField(details, "name") || "Customer";
  
  const page = lead.page || '';

  if (page.includes("SIP Growth")) {
    const sip = extractField(details, "Monthly SIP") || "₹10,000";
    const rate = extractField(details, "Return Rate") || "12%";
    const term = extractField(details, "Duration") || "15";
    const futureVal = extractField(details, "Future Value") || "₹50,00,000";
    return `Hi ${name},\n\nThank you for exploring the Mutual Fund SIP Planner on Kalrion.in.\n\nI saw you checked a monthly investment of ${sip} for a duration of ${term} Years with an expected return of ${rate}. According to your plan, your total wealth compiles to *${futureVal}*.\n\nWe have a list of handpicked mutual fund schemes matching your timeline. Would you like to schedule a quick call to review them?\n\nRegards,\nKalrion Capital Team`;
  } 
  
  if (page.includes("Loan EMI")) {
    const type = extractField(details, "Type") || "Home Loan";
    const amount = extractField(details, "Amount") || "₹25,00,000";
    const rate = extractField(details, "Rate") || "8.5%";
    const term = extractField(details, "Tenure") || "15";
    const emi = extractField(details, "EMI") || "₹24,000";
    return `Hi ${name},\n\nI noticed you used our Loan EMI Calculator for a *${type}* of ${amount} at ${rate} interest for ${term} Years.\n\nYour calculated EMI is *${emi}*. We partner with major banks and can help you secure interest rates up to 0.25% lower than standard rates.\n\nWould you like us to run a free eligibility check and fetch rate offers for you?\n\nRegards,\nKalrion Capital Team`;
  }

  if (page.includes("Gold Tracker")) {
    const year = extractField(details, "Year") || "2005";
    const capital = extractField(details, "Capital") || "₹50,000";
    const valNow = extractField(details, "Current Value") || "₹5,00,000";
    const growth = extractField(details, "Growth") || "11%";
    return `Hi ${name},\n\nThank you for checking the Gold Investment CAGR tool on Kalrion.in.\n\nYour calculation starting in year ${year} with a capital of ${capital} grew to *${valNow}* at a CAGR of ${growth}.\n\nWith rising inflation, allocating 10-15% of your portfolio to Sovereign Gold Bonds (SGB) or digital gold is highly recommended. Let me know if you would like guidance on SGB application portals.\n\nRegards,\nKalrion Capital Team`;
  }

  if (page.includes("Tax Planner")) {
    const income = extractField(details, "Income") || "₹12,00,000";
    const recommended = extractField(details, "Recommended") || "New Regime";
    const taxNew = extractField(details, "Net Tax New") || "₹0";
    const taxOld = extractField(details, "Net Tax Old") || "₹0";
    return `Hi ${name},\n\nThank you for using the Income Tax Advisor on Kalrion.in for your annual income of ${income}.\n\nBased on your entries, the optimal choice is the *${recommended}*, saving you tax compared to the alternative (Net Tax: ${taxNew} vs ${taxOld}).\n\nOur CA partners can assist in filing your tax return quickly and maximizing your deductions. Let us know if you need help with ITR filing!\n\nRegards,\nKalrion Capital Team`;
  }

  if (page.includes("Book Shop")) {
    const order = extractField(details, "Order") || "Investment Books";
    const total = extractField(details, "Total") || "₹499";
    const address = extractField(details, "Address") || "your address";
    return `Hi ${name},\n\nThank you for ordering from our Investor's Knowledge Hub!\n\n*Order Summary:*\n- ${order}\n*Total Bill:* ${total}\n\nWe are preparing your shipment to ${address}. Please complete UPI payment to confirm your order. You can send it to: pay@kalrion (or scan our QR code).\n\nLet us know once paid so we can share your tracking link!\n\nRegards,\nKalrion Capital Team`;
  }

  // Fallback for general enquiries or Home Page
  const msg = extractField(details, "message") || "Advisory assistance";
  return `Hi ${name},\n\nThank you for reaching out to Kalrion Capital.\n\nI received your enquiry from our website regarding: *"${msg}"*.\n\nI am analyzing your query and will share details shortly. Let me know if we can connect over a quick call to discuss this further.\n\nRegards,\nKalrion Capital Team`;
};

// Open Reply Modal
window.openReplyModal = (leadId) => {
  const leads = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)) || [];
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;

  const overlay = document.getElementById('reply-modal');
  if (!overlay) return;

  // Extract metadata
  const details = lead.details || '';
  const name = extractField(details, "Buyer") || extractField(details, "name") || "Customer";
  let phone = extractField(details, "Mob") || extractField(details, "phone") || "N/A";
  
  document.getElementById('outreach-cust-name').textContent = name;
  document.getElementById('outreach-cust-source').textContent = lead.page || 'Home Page';
  document.getElementById('outreach-cust-phone').textContent = phone;

  // Generate outreach draft
  const draftMessage = generateOutreachDraft(lead);
  const msgArea = document.getElementById('outreach-msg-text');
  if (msgArea) msgArea.value = draftMessage;

  // Setup WhatsApp redirect link
  const waBtn = document.getElementById('outreach-wa-btn');
  if (waBtn) {
    waBtn.onclick = () => {
      let cleanPhone = phone.replace(/\D/g, '');
      // If phone length is 10 digit (Indian format), prefix with country code 91
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }
      
      // Mark lead as contacted upon outreach click
      lead.status = 'Contacted';
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(leads));
      renderLeads();
      updateMetrics();
      
      closeReplyModal();
      window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftMessage)}`;
    };
  }

  overlay.classList.add('open');
};

// Close Reply Modal
window.closeReplyModal = () => {
  const overlay = document.getElementById('reply-modal');
  if (overlay) overlay.classList.remove('open');
};

// Copy Outreach Text
window.copyOutreachText = () => {
  const msgArea = document.getElementById('outreach-msg-text');
  if (msgArea) {
    msgArea.select();
    document.execCommand('copy');
    showNotification("📋 Outreach text copied to clipboard!");
  }
};

// Tab Switching
window.switchAdminTab = (tabId) => {
  // Toggle buttons
  const buttons = document.querySelectorAll('.admin-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Find which button was clicked
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    }
  });

  // Toggle panels
  document.querySelectorAll('.tab-content-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });

  if (tabId === 'marketing-tab') {
    updateMarketingScripts();
  }
};

// Toast notification trigger for admin console
const showNotification = (msg) => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
};

// AI Marketing Hub Templates Dictionary
const marketingTemplates = {
  loans: {
    reel: `[Visual: Screen record of Kalrion EMI slider moving from 50L to 20L. Text on screen: "Home Loan EMI hack SBI vs HDFC!"]
[Audio Hook]: "Kya aapka home loan SBI ya HDFC se chal raha hai? Stop! Ye video save karo aur ₹5 Lakhs bachao."

[Dialogue]:
"Dosto, jab hum home loan lete hain, bank hume 8.5% se 9% ka card rate chipka dete hain. But, did you know? Agar aap bank rates compare karke negotiation karte ho, toh aaram se 0.25% se 0.50% rate drop ho jata hai.
Abhi jaao Kalrion.in pe, apna EMI calculate karo aur free comparative quotes nikaalo. Single click pe pure bank listings check karo aur savings check karo. Link bio me hai!"`,
    linkedin: `📊 Home Loan Interest Hack: How standard comparison can save you ₹5 Lakhs.

Most home buyers simply accept the first loan offer provided by their builder's partner bank. Here's why that's a massive mistake:

A 0.3% difference in interest rate on a ₹50 Lakh loan for 20 years translates to a saving of over ₹2.4 Lakhs in interest payable!

At Kalrion Capital, we have built a free Loan EMI Calculator & Bank rate comparison advisor. You can:
1. Visualise your complete amortization schedule.
2. Toggle SBI, HDFC, and other private bank interest rates side-by-side.
3. Check pre-approved bank limits in one click.

Stop overpaying your bank. Analyze your EMI size today: https://kalrion.in/loans.html

#HomeLoans #PersonalFinance #MortgageTips #IndiaFinance #WealthManagement`,
    whatsapp: `*🏠 Home Loan EMI Hack!*

Getting a new home/car loan or want to transfer your existing high-interest loan? Don't blindly accept bank offers.

Check EMI splits and compare SBI, HDFC, ICICI, and bank rates side-by-side for free:
👉 https://kalrion.in/loans.html

*Calculate your exact monthly savings in 10 seconds!*`
  },
  sip: {
    reel: `[Visual: Background showing stock market indexes and SIP future value chart. Text: "₹5000/month = ₹1.01 Crore! How?"]
[Audio Hook]: "Sirf ₹5,000 monthly SIP se ₹1 Crore kaise banega? Compounding ka jaadu dekho."

[Dialogue]:
"Dosto, SIP sab karte hain par timing aur returns koi calculate nahi karta. Agar aap ₹5,000 monthly aache mutual fund me 20 saal ke liye daalte ho at 15% annual return, toh aapka total return banta hai ₹75 Lakhs se zyada! Aur total value hoti hai 1 Crore!
Nahi yakeen aata? Kalrion.in ke SIP growth calculator pe jaake khud check karo. Aap details input karke chart curves dekh sakte ho. Abhi start karo aur details bio me link pe paao!"`,
    linkedin: `📈 The Power of Compounding: How ₹5,000/month becomes ₹1 Crore.

Many young salaried professionals wait to start their investment journey until they have a "large capital". However, compounding rewards TIME, not just size.

Here's the math:
- Monthly SIP: ₹5,000
- Investment Duration: 20 Years
- Expected Return: 15% p.a. (Historical Nifty Midcap/Smallcap averages)
- Total Invested: ₹12 Lakhs
- Wealth Gain: ₹67.8 Lakhs
- Total Value: ~₹80 Lakhs! (Push it to 22 years and it crosses ₹1.1 Crore).

Use our free Mutual Fund SIP Growth Planner to visualize your wealth goals with interactive charts:
👉 https://kalrion.in/sip.html

Start small, start early. 

#MutualFunds #SIP #InvestingIndia #FinancialFreedom #Compounding`,
    whatsapp: `*📈 Can ₹5,000 monthly make you a Crorepati?*

Yes, if you understand the compounding curves! See how much wealth you will accumulate based on different return rates and durations:
👉 https://kalrion.in/sip.html

*Calculate your wealth goal in 10 seconds!*`
  },
  tax: {
    reel: `[Visual: Split screen comparing Old vs New regime tables. Text: "₹12 Lakh Salary = ₹0 Income Tax!"]
[Audio Hook]: "₹12 Lakh salary pe zero income tax kaise? Budget 2025 ka New Regime scheme dekho."

[Dialogue]:
"Suno salaried walo! Agar aapki taxable salary new regime me standard deductions ke baad ₹12 Lakh se kam hai, toh Section 87A rebate ke chalte aapka total tax ₹0 ho jata hai! Old regime me deductions dhoondte reh jaoge.
Apna exact tax compute karne ke liye and Old vs New savings check karne ke liye run your details on Kalrion.in Tax Planner right now. Link bio me hai!"`,
    linkedin: `📊 Old vs. New Tax Regime: The ₹12 Lakh Zero-Tax Threshold explained.

Under the Union Budget, the New Tax Regime offers full tax rebate (Section 87A) for net taxable incomes up to ₹12 Lakhs. 

But what if your income is slightly higher (e.g., ₹12.5 Lakhs)? 
This is where **Marginal Relief** comes into play, ensuring your tax does not exceed the extra income you earned above ₹12 Lakhs.

Our latest Income Tax Calculator handles:
1. Standard salaried deductions automatically.
2. Collapsible accordion inputs for Old Regime (80C, 80D, Section 24).
3. Section 87A marginal relief checks live.
4. Optimal advisory recommendation showing exactly which regime saves you money.

Compare your tax liability side-by-side: https://kalrion.in/tax.html

#IncomeTax #TaxPlanning #Budget2025 #SalariedEmployees #IndiaTax`,
    whatsapp: `*📊 Save maximum tax on your Salary!*

Confused between Old and New Tax Regimes? Input your deductions and compare your net tax side-by-side for FY 2026-27:
👉 https://kalrion.in/tax.html

*Find out which regime saves you more money instantly!*`
  },
  gold: {
    reel: `[Visual: 30-year gold price history graph, and a gold bar icon. Text: "CAGR of Gold: 1995 to 2026?"]
[Audio Hook]: "Aapke daada-dadi ne ₹50,000 ka sona liya tha, uski aaj ki value kya hai? Chalo check karein."

[Dialogue]:
"Dosto, gold sirf jewelry nahi, ek power hedge hai. Agar 2005 me ₹50,000 ka gold physical buy kiya hota at ₹7000/10g, toh aaj uski price ₹75,000/10g se upar hai - yaani ₹11 Lakhs se zyada value! That is around 15.9% CAGR return!
Aise historic Gold stats aur digital gold values calculate karne ke liye explore Kalrion Gold Tracker. CAGR growth check karo, link bio me hai!"`,
    linkedin: `🏆 The Historical Return of Gold: More than just a hedge?

Over the last 20 years, gold in India has delivered a CAGR of nearly 11% to 15%, matching many equity index returns during market downturns.

For instance:
- In 2005, gold rate was ~₹7,000 per 10 grams.
- Today, it stands above ₹75,000 per 10 grams.
- A capital of ₹50,000 invested then has multiplied by 10x+ today!

With Sovereign Gold Bonds (SGB) offering an extra 2.5% fixed interest, gold is an essential asset class for Indian household portfolios.

Analyze historic gold growth starting from any year (1995-2026) using our tracker:
👉 https://kalrion.in/gold.html

#GoldPrice #SGB #WealthAdvisory #Hedging #IndiaEconomy #Investing`,
    whatsapp: `*🏆 How much did Gold return in the last 20 years?*

Track 30-year Indian gold rate history and check what your capital would be worth today at current market rates:
👉 https://kalrion.in/gold.html

*Track compound gold growth instantly!*`
  },
  shop: {
    reel: `[Visual: Stack of books including The Intelligent Investor, The Psychology of Money. Text: "Don't trade blindly! Read these 3 books first."]
[Audio Hook]: "Bina knowledge trade karoge toh loss pakka hai. Sahi investing seekhne ke liye 3 books read karo."

[Dialogue]:
"Dosto, stock market me profit banana koi lottery nahi hai. Pehle concepts clear hone chahiye. 'The Intelligent Investor', 'Psychology of Money' and 'Technical Analysis' - ye books har investor ke table pe honi chahiye.
Humne in major books ka handpicked set curate kiya hai. Kalrion.in Book Shop pe jao, shopping cart me add karo aur direct WhatsApp checkout pe order karo. Delivery is free! Link in bio."`,
    linkedin: `📚 Invest in your financial education before investing in stocks.

90% of retail traders lose money in the stock market. The root cause is a lack of structured learning and emotional trading.

Before you buy your next stock, invest in these foundational books:
1. *The Intelligent Investor* by Benjamin Graham (Understanding value margins).
2. *The Psychology of Money* by Morgan Housel (Mastering financial behavior).
3. *Technical Analysis of Financial Markets* by John Murphy (Decoding charts).

We have launched our curated **Knowledge Hub Book Shop** with flat GST billing and free shipping across India. Order directly via one-click WhatsApp Checkout:
👉 https://kalrion.in/shop.html

Build your investing library today.

#FinancialLiteracy #StockMarkets #Trading #BookRecommend #CareerDevelopment`,
    whatsapp: `*📚 Master the Stock Market & Investing!*

Curated stock market and investing books (The Intelligent Investor, Psychology of Money, Technical Analysis) are now available on our store.

Check listings and order via WhatsApp with Free Shipping:
👉 https://kalrion.in/shop.html

*Start building your investing library today!*`
  }
};

// Update Marketing content text areas
const updateMarketingScripts = () => {
  const select = document.getElementById('marketing-tool-select');
  if (!select) return;

  const key = select.value;
  const templates = marketingTemplates[key];
  if (!templates) return;

  document.getElementById('reel-script-container').textContent = templates.reel;
  document.getElementById('linkedin-script-container').textContent = templates.linkedin;
  document.getElementById('whatsapp-script-container').textContent = templates.whatsapp;
};

// Copy script block helper
window.copyScriptText = (elementId) => {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Use temporary textarea to copy formatting exactly
  const textarea = document.createElement('textarea');
  textarea.value = el.textContent;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);

  showNotification("📋 Script content copied to clipboard!");
};

// Setup change event for marketing select
const setupMarketingEvents = () => {
  const select = document.getElementById('marketing-tool-select');
  if (select) {
    select.addEventListener('change', updateMarketingScripts);
  }
};

// DOMContentLoaded Initialization listener
document.addEventListener('DOMContentLoaded', () => {
  setupAdminEvents();
  setupMarketingEvents();
  checkAuth();
});

