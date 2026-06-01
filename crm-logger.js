// Shared Lead Logger for Kalrion Capital CRM
const CRM_STORAGE_KEY = 'kalrion_crm_leads';

// Mock Leads to seed if CRM is empty
const mockLeads = [
  {
    id: "lead_1779836400000",
    timestamp: "2026-05-30T10:30:00Z",
    page: "Loan EMI Calculator",
    actionType: "WhatsApp Click",
    details: "Loan Amount: ₹50,00,000 | Rate: 8.5% | Tenure: 20 Years | EMI: ₹43,391",
    status: "New"
  },
  {
    id: "lead_1779922800000",
    timestamp: "2026-05-31T12:15:00Z",
    page: "SIP Growth Planner",
    actionType: "WhatsApp Click",
    details: "Monthly SIP: ₹15,000 | Return Rate: 15% | Duration: 15 Years | Future Value: ₹1,01,79,116",
    status: "Contacted"
  },
  {
    id: "lead_1780009200000",
    timestamp: "2026-06-01T09:05:00Z",
    page: "Gold Tracker",
    actionType: "WhatsApp Click",
    details: "Investment Year: 2005 (Rate: ₹7,000/10g) | Capital: ₹50,000 | Current Value: ₹11,15,857 | CAGR: 15.9%",
    status: "New"
  },
  {
    id: "lead_1780074000000",
    timestamp: "2026-06-01T15:45:00Z",
    page: "Tax Planner",
    actionType: "WhatsApp Click",
    details: "Gross Income: ₹15,00,000 | Recommended: New Regime (Saves: ₹42,500) | Net Tax: ₹1,24,800",
    status: "Contacted"
  },
  {
    id: "lead_1780088400000",
    timestamp: "2026-06-01T19:20:00Z",
    page: "Home Page",
    actionType: "Call Click",
    details: "Clicked Call CTA (+91 8447842244) from Header",
    status: "New"
  },
  {
    id: "lead_1780138800000",
    timestamp: "2026-06-02T08:10:00Z",
    page: "Home Page - Health Cover Advisor",
    actionType: "WhatsApp Click",
    details: "Requested split health insurance coverage comparison details",
    status: "New"
  }
];

// Seed function
const checkAndSeedCRM = () => {
  const existing = localStorage.getItem(CRM_STORAGE_KEY);
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(mockLeads));
    console.log("Kalrion CRM: Successfully seeded mock leads.");
  }
};

// Global logger function
window.logLead = (page, actionType, details) => {
  checkAndSeedCRM();
  
  try {
    const leadsStr = localStorage.getItem(CRM_STORAGE_KEY);
    const leads = leadsStr ? JSON.parse(leadsStr) : [];
    
    const newLead = {
      id: "lead_" + Date.now(),
      timestamp: new Date().toISOString(),
      page: page,
      actionType: actionType,
      details: details,
      status: "New"
    };
    
    leads.unshift(newLead); // Add to the top (most recent first)
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(leads));
    console.log("Kalrion CRM: Logged new lead successfully.", newLead);
  } catch (e) {
    console.error("Kalrion CRM: Error logging lead.", e);
  }
};

// Auto-seed on load
checkAndSeedCRM();
