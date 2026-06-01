const whatsappNumber = "918447842244";
let taxChart = null;

// Helper to format currency in Indian style
const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

// Parse formatted number string back to integer
const parseINR = (str) => {
  const cleanStr = str.replace(/[₹,\s]/g, '');
  return parseInt(cleanStr, 10) || 0;
};

// Accordion Collapsible Logic
const setupAccordions = () => {
  const trigger = document.querySelector('.accordion-trigger');
  const content = document.querySelector('.accordion-content');
  const icon = document.querySelector('.accordion-icon');
  
  if (trigger && content) {
    trigger.addEventListener('click', () => {
      const parent = trigger.parentElement;
      parent.classList.toggle('active');
      if (parent.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.textContent = "−";
      } else {
        content.style.maxHeight = "0px";
        icon.textContent = "+";
      }
    });
  }

  const trigger2 = document.querySelector('.accordion-trigger2');
  const content2 = document.querySelector('.accordion-content2');
  const icon2 = document.querySelector('.accordion-icon2');
  
  if (trigger2 && content2) {
    trigger2.addEventListener('click', () => {
      const parent2 = trigger2.parentElement;
      parent2.classList.toggle('active');
      if (parent2.classList.contains('active')) {
        content2.style.maxHeight = content2.scrollHeight + "px";
        icon2.textContent = "−";
      } else {
        content2.style.maxHeight = "0px";
        icon2.textContent = "+";
      }
    });
  }
};

// Calculate Indian Income Tax (Old vs New Regime) for FY 2026-27
const calculateTax = () => {
  const salaried = document.getElementById('tax-salaried').checked;
  const grossIncome = parseINR(document.getElementById('tax-income-slider').value);
  
  // Old Regime Deductions
  const ded80C = Math.min(parseINR(document.getElementById('tax-80c-slider').value), 150000);
  const ded80D = Math.min(parseINR(document.getElementById('tax-80d-slider').value), 100000);
  const ded24b = Math.min(parseINR(document.getElementById('tax-24b-slider').value), 200000);
  const dedNps = Math.min(parseINR(document.getElementById('tax-nps-slider').value), 50000);
  const dedHra = parseINR(document.getElementById('tax-hra-slider').value);
  const dedOther = parseINR(document.getElementById('tax-other-slider').value);
  
  // New Regime Deductions
  const dedNps2 = parseINR(document.getElementById('tax-nps2-slider').value); // Employer NPS Sec 80CCD(2)
  
  // Standard Deductions
  const stdOld = salaried ? 50000 : 0;
  const stdNew = salaried ? 75000 : 0;
  
  // Total Deductions
  const totalDeductionsOld = stdOld + ded80C + ded80D + ded24b + dedNps + dedHra + dedOther;
  const totalDeductionsNew = stdNew + dedNps2;
  
  // Taxable Incomes
  const taxableOld = Math.max(0, grossIncome - totalDeductionsOld);
  const taxableNew = Math.max(0, grossIncome - totalDeductionsNew);
  
  // 1. Calculate Old Regime Slab Tax
  let taxOldBeforeRebate = 0;
  let tempOld = taxableOld;
  if (tempOld > 1000000) {
    taxOldBeforeRebate += (tempOld - 1000000) * 0.30;
    tempOld = 1000000;
  }
  if (tempOld > 500000) {
    taxOldBeforeRebate += (tempOld - 500000) * 0.20;
    tempOld = 500000;
  }
  if (tempOld > 250000) {
    taxOldBeforeRebate += (tempOld - 250000) * 0.05;
  }
  
  // Sec 87A Rebate (Old Regime): Available if taxable income <= 5L, rebate up to 12.5k
  let rebateOld = 0;
  if (taxableOld <= 500000) {
    rebateOld = taxOldBeforeRebate;
  }
  
  const taxOldAfterRebate = Math.max(0, taxOldBeforeRebate - rebateOld);
  
  // Surcharge (Old Regime)
  let surchargeOld = 0;
  if (taxableOld > 5000000) {
    let rate = 0;
    if (taxableOld <= 10000000) rate = 0.10;
    else if (taxableOld <= 20000000) rate = 0.15;
    else if (taxableOld <= 50000000) rate = 0.25;
    else rate = 0.37;
    surchargeOld = taxOldAfterRebate * rate;
  }
  
  const cessOld = (taxOldAfterRebate + surchargeOld) * 0.04;
  const netTaxOld = taxOldAfterRebate + surchargeOld + cessOld;
  
  // 2. Calculate New Regime Slab Tax (Budget 2025 Slabs)
  let taxNewBeforeRebate = 0;
  let tempNew = taxableNew;
  if (tempNew > 2400000) {
    taxNewBeforeRebate += (tempNew - 2400000) * 0.30;
    tempNew = 2400000;
  }
  if (tempNew > 2000000) {
    taxNewBeforeRebate += (tempNew - 2000000) * 0.25;
    tempNew = 2000000;
  }
  if (tempNew > 1600000) {
    taxNewBeforeRebate += (tempNew - 1600000) * 0.20;
    tempNew = 1600000;
  }
  if (tempNew > 1200000) {
    taxNewBeforeRebate += (tempNew - 1200000) * 0.15;
    tempNew = 1200000;
  }
  if (tempNew > 800000) {
    taxNewBeforeRebate += (tempNew - 800000) * 0.10;
    tempNew = 800000;
  }
  if (tempNew > 400000) {
    taxNewBeforeRebate += (tempNew - 400000) * 0.05;
  }
  
  // Sec 87A Rebate (New Regime - Budget 2025):
  // Taxable income up to 12L is fully exempt (rebate up to 60k).
  // Includes marginal relief for income slightly exceeding 12L (tax cannot exceed income over 12L).
  let rebateNew = 0;
  if (taxableNew <= 1200000) {
    rebateNew = taxNewBeforeRebate;
  } else {
    // Check if marginal relief is applicable
    const excessIncome = taxableNew - 1200000;
    if (taxNewBeforeRebate > excessIncome) {
      rebateNew = taxNewBeforeRebate - excessIncome;
    }
  }
  
  const taxNewAfterRebate = Math.max(0, taxNewBeforeRebate - rebateNew);
  
  // Surcharge (New Regime - Capped at 25%)
  let surchargeNew = 0;
  if (taxableNew > 5000000) {
    let rate = 0;
    if (taxableNew <= 10000000) rate = 0.10;
    else if (taxableNew <= 20000000) rate = 0.15;
    else rate = 0.25;
    surchargeNew = taxNewAfterRebate * rate;
  }
  
  const cessNew = (taxNewAfterRebate + surchargeNew) * 0.04;
  const netTaxNew = taxNewAfterRebate + surchargeNew + cessNew;
  
  // Update Results Table UI
  document.getElementById('table-old-gross').textContent = formatINR(grossIncome);
  document.getElementById('table-new-gross').textContent = formatINR(grossIncome);
  
  document.getElementById('table-old-ded').textContent = `- ${formatINR(totalDeductionsOld)}`;
  document.getElementById('table-new-ded').textContent = `- ${formatINR(totalDeductionsNew)}`;
  
  document.getElementById('table-old-taxable').textContent = formatINR(taxableOld);
  document.getElementById('table-new-taxable').textContent = formatINR(taxableNew);
  
  document.getElementById('table-old-slab-tax').textContent = formatINR(taxOldBeforeRebate);
  document.getElementById('table-new-slab-tax').textContent = formatINR(taxNewBeforeRebate);
  
  document.getElementById('table-old-rebate').textContent = rebateOld > 0 ? `- ${formatINR(rebateOld)}` : '₹ 0';
  document.getElementById('table-new-rebate').textContent = rebateNew > 0 ? `- ${formatINR(rebateNew)}` : '₹ 0';
  
  document.getElementById('table-old-cess').textContent = formatINR(cessOld + surchargeOld);
  document.getElementById('table-new-cess').textContent = formatINR(cessNew + surchargeNew);
  
  document.getElementById('table-old-net-tax').textContent = formatINR(netTaxOld);
  document.getElementById('table-new-net-tax').textContent = formatINR(netTaxNew);
  
  // Regime Recommendation Banner
  const banner = document.getElementById('tax-recommendation-banner');
  if (banner) {
    if (netTaxNew < netTaxOld) {
      const diff = netTaxOld - netTaxNew;
      banner.innerHTML = `🌟 New Tax Regime is better! You save <strong>${formatINR(diff)}</strong>`;
      banner.style.background = 'var(--primary-dark)';
      banner.style.borderLeft = '5px solid var(--accent)';
    } else if (netTaxOld < netTaxNew) {
      const diff = netTaxNew - netTaxOld;
      banner.innerHTML = `🌟 Old Tax Regime is better! You save <strong>${formatINR(diff)}</strong>`;
      banner.style.background = 'var(--accent-dark)';
      banner.style.borderLeft = '5px solid var(--primary-light)';
    } else {
      banner.innerHTML = `⚖️ Both tax regimes result in the same tax liability.`;
      banner.style.background = 'var(--muted)';
      banner.style.borderLeft = '5px solid var(--line)';
    }
  }

  // Render/Update Chart
  updateChart(netTaxOld, netTaxNew);
};

// Render & update comparison chart
const updateChart = (taxOld, taxNew) => {
  const ctx = document.getElementById('taxChart');
  if (!ctx) return;

  if (taxChart) {
    taxChart.data.datasets[0].data = [Math.round(taxOld), Math.round(taxNew)];
    taxChart.update();
  } else {
    taxChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Old Regime', 'New Regime'],
        datasets: [{
          label: 'Net Tax Payable (₹)',
          data: [Math.round(taxOld), Math.round(taxNew)],
          backgroundColor: ['#D4AF37', '#0A4D34'], // Gold & Forest Green
          borderColor: ['#AA820A', '#063423'],
          borderWidth: 1.5,
          borderRadius: 4,
          barThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Tax Payable: ${formatINR(context.parsed.y)}`
            }
          }
        },
        scales: {
          y: {
            grid: { color: '#E1E8E5' },
            ticks: {
              color: '#4A5D54',
              font: { family: 'Plus Jakarta Sans', size: 10 },
              callback: (value) => `₹${new Intl.NumberFormat('en-IN').format(value)}`
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#111D18',
              font: { family: 'Plus Jakarta Sans', weight: 'bold' }
            }
          }
        }
      }
    });
  }
};

// Setup Two-way Slider Bindings & Event Listeners
const setupSliders = () => {
  const sliders = [
    { slider: 'tax-income-slider', text: 'tax-income-text' },
    { slider: 'tax-80c-slider', text: 'tax-80c-text' },
    { slider: 'tax-80d-slider', text: 'tax-80d-text' },
    { slider: 'tax-24b-slider', text: 'tax-24b-text' },
    { slider: 'tax-nps-slider', text: 'tax-nps-text' },
    { slider: 'tax-hra-slider', text: 'tax-hra-text' },
    { slider: 'tax-other-slider', text: 'tax-other-text' },
    { slider: 'tax-nps2-slider', text: 'tax-nps2-text' }
  ];

  sliders.forEach(pair => {
    const sEl = document.getElementById(pair.slider);
    const tEl = document.getElementById(pair.text);

    if (!sEl || !tEl) return;

    // Slider updates text box
    sEl.addEventListener('input', () => {
      tEl.value = new Intl.NumberFormat('en-IN').format(sEl.value);
      calculateTax();
      
      // Auto-update collapsible sizes if content changes
      const content = document.querySelector('.accordion-content');
      if (content && content.style.maxHeight !== "0px") {
        content.style.maxHeight = content.scrollHeight + "px";
      }
      const content2 = document.querySelector('.accordion-content2');
      if (content2 && content2.style.maxHeight !== "0px") {
        content2.style.maxHeight = content2.scrollHeight + "px";
      }
    });

    // Text box updates slider
    tEl.addEventListener('change', () => {
      let val = parseINR(tEl.value);
      const min = parseInt(sEl.min, 10);
      const max = parseInt(sEl.max, 10);
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;

      sEl.value = val;
      tEl.value = new Intl.NumberFormat('en-IN').format(val);
      calculateTax();
    });
  });

  // Toggle Listener for salaried checkbox
  const salariedToggle = document.getElementById('tax-salaried');
  if (salariedToggle) {
    salariedToggle.addEventListener('change', calculateTax);
  }

  // WhatsApp Button Click Listener
  const whatsappBtn = document.getElementById('tax-whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const salaried = document.getElementById('tax-salaried').checked ? "Yes" : "No";
      const grossIncome = formatINR(document.getElementById('tax-income-slider').value);
      
      // Deductions
      const oldDed = document.getElementById('table-old-ded').textContent;
      const newDed = document.getElementById('table-new-ded').textContent;
      
      // Taxes
      const oldTax = document.getElementById('table-old-net-tax').textContent;
      const newTax = document.getElementById('table-new-net-tax').textContent;
      
      const bannerText = document.getElementById('tax-recommendation-banner').textContent.trim();
      const recommendedRegime = bannerText.includes("New") ? "New Regime" : bannerText.includes("Old") ? "Old Regime" : "Equally Beneficial";

      const text = [
        "Hi Kalrion Capital,",
        "I compared the Old vs New Tax Regimes on your website.",
        "",
        `*Inputs Summary:*`,
        `- Salaried Employee: ${salaried}`,
        `- Gross Annual Income: ${grossIncome}`,
        `- Old Regime Deductions: ${oldDed.replace('- ', '')}`,
        `- New Regime Deductions: ${newDed.replace('- ', '')}`,
        "",
        `*Comparison Result:*`,
        `- Old Regime Net Tax: ${oldTax}`,
        `- New Regime Net Tax: ${newTax}`,
        `- Recommended Regime: *${recommendedRegime}*`,
        `- Analysis Details: ${bannerText.replace('🌟 ', '')}`,
        "",
        "Please schedule a consultation with Kalrion Capital to help me optimize my tax deductions or file my taxes."
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    });
  }
};

// Responsive grid support for rules panels
const handleResponsiveTaxGrid = () => {
  const grid = document.getElementById('tax-rules-grid');
  if (!grid) return;
  if (window.innerWidth <= 768) {
    grid.style.gridTemplateColumns = '1fr';
  } else {
    grid.style.gridTemplateColumns = '1fr 1fr';
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupAccordions();
  setupSliders();
  calculateTax();
  
  handleResponsiveTaxGrid();
  window.addEventListener('resize', handleResponsiveTaxGrid);
});
