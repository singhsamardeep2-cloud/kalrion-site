const whatsappNumber = "918447842244";
let goldChart = null;

// 30-Year Historical Gold Rate in India (per 10g of 24K Gold in INR)
const goldPrices = [
  { year: 1996, price: 5100 },
  { year: 1997, price: 4700 },
  { year: 1998, price: 4200 },
  { year: 1999, price: 4250 },
  { year: 2000, price: 4400 },
  { year: 2001, price: 4300 },
  { year: 2002, price: 5000 },
  { year: 2003, price: 5600 },
  { year: 2004, price: 5850 },
  { year: 2005, price: 7000 },
  { year: 2006, price: 8400 },
  { year: 2007, price: 10800 },
  { year: 2008, price: 12500 },
  { year: 2009, price: 14500 },
  { year: 2010, price: 18500 },
  { year: 2011, price: 26400 },
  { year: 2012, price: 31050 },
  { year: 2013, price: 29600 },
  { year: 2014, price: 28000 },
  { year: 2015, price: 26343 },
  { year: 2016, price: 28661 },
  { year: 2017, price: 29667 },
  { year: 2018, price: 31438 },
  { year: 2019, price: 35220 },
  { year: 2020, price: 48651 },
  { year: 2021, price: 48720 },
  { year: 2022, price: 52950 },
  { year: 2023, price: 60100 },
  { year: 2024, price: 71800 },
  { year: 2025, price: 76500 },
  { year: 2026, price: 156220 }
];

const todayPrice = 156220; // 2026 current average price

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

// Populate the years dropdown list dynamically
const populateYearsDropdown = () => {
  const select = document.getElementById('gold-year');
  if (!select) return;

  select.innerHTML = '';
  // Loop backward from 2025 to 1996
  for (let i = goldPrices.length - 2; i >= 0; i--) {
    const yearObj = goldPrices[i];
    const option = document.createElement('option');
    option.value = yearObj.year;
    option.text = `Year ${yearObj.year} (₹${new Intl.NumberFormat('en-IN').format(yearObj.price)} / 10g)`;
    select.appendChild(option);
  }
};

// Calculate gold returns
const calculateGoldReturns = () => {
  const select = document.getElementById('gold-year');
  const amountSlider = document.getElementById('gold-amount-slider');

  if (!select || !amountSlider) return;

  const yearSelected = parseInt(select.value, 10);
  const capital = parseFloat(amountSlider.value);

  // Find buy price for selected year
  const startPriceObj = goldPrices.find(g => g.year === yearSelected);
  if (!startPriceObj) return;

  const buyPricePer10g = startPriceObj.price;
  const gramsBought = (capital / buyPricePer10g) * 10;
  const currentValue = (gramsBought / 10) * todayPrice;

  const absoluteGrowth = ((todayPrice - buyPricePer10g) / buyPricePer10g) * 100;
  const yearsDiff = 2026 - yearSelected;
  const cagr = (Math.pow(currentValue / capital, 1 / yearsDiff) - 1) * 100;

  // Update UI Elements
  document.getElementById('gold-current-value').textContent = formatINR(currentValue);
  document.getElementById('res-gold-buy-rate').textContent = `${formatINR(buyPricePer10g)} per 10g`;
  document.getElementById('res-gold-weight').textContent = `${gramsBought.toFixed(2)} grams`;
  document.getElementById('res-gold-growth').textContent = `+${Math.round(absoluteGrowth)}% (CAGR: ${cagr.toFixed(1)}%)`;
};

// Render 30-Year Chart.js
const renderGoldChart = () => {
  const ctx = document.getElementById('goldChart');
  if (!ctx) return;

  const labels = goldPrices.map(g => g.year);
  const dataValues = goldPrices.map(g => g.price);

  // Create smooth gold gradient background
  const canvasCtx = ctx.getContext('2d');
  const gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
  gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

  goldChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gold Rate in India (₹/10g)',
        data: dataValues,
        borderColor: '#0A4D34', // Forest Green line
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.15,
        pointBackgroundColor: '#D4AF37', // Gold points
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#0A4D34'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide legend to look cleaner
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || 0;
              return ` Gold Price: ${formatINR(value)} per 10g`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#4A5D54',
            font: {
              family: 'Plus Jakarta Sans'
            }
          }
        },
        y: {
          grid: {
            color: '#E1E8E5'
          },
          ticks: {
            color: '#4A5D54',
            font: {
              family: 'Plus Jakarta Sans'
            },
            callback: (value) => {
              return `₹${new Intl.NumberFormat('en-IN').format(value)}`;
            }
          }
        }
      }
    }
  });
};

// Setup Two-way Slider Bindings & Event Listeners
const setupBindings = () => {
  const amountSlider = document.getElementById('gold-amount-slider');
  const amountText = document.getElementById('gold-amount-text');
  const selectYear = document.getElementById('gold-year');

  if (!amountSlider || !amountText || !selectYear) return;

  // Slider updates text box
  amountSlider.addEventListener('input', () => {
    amountText.value = new Intl.NumberFormat('en-IN').format(amountSlider.value);
    calculateGoldReturns();
  });

  // Text box updates slider
  amountText.addEventListener('change', () => {
    let val = parseINR(amountText.value);
    const min = parseInt(amountSlider.min, 10);
    const max = parseInt(amountSlider.max, 10);
    if (isNaN(val) || val < min) val = min;
    if (val > max) val = max;

    amountSlider.value = val;
    amountText.value = new Intl.NumberFormat('en-IN').format(val);
    calculateGoldReturns();
  });

  // Year dropdown change
  selectYear.addEventListener('change', calculateGoldReturns);

  // WhatsApp Button Click Listener
  const whatsappBtn = document.getElementById('gold-whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const year = document.getElementById('gold-year').value;
      const capital = formatINR(document.getElementById('gold-amount-slider').value);
      const buyPrice = document.getElementById('res-gold-buy-rate').textContent;
      const weight = document.getElementById('res-gold-weight').textContent;
      const valueNow = document.getElementById('gold-current-value').textContent;
      const growth = document.getElementById('res-gold-growth').textContent;

      // Log Lead to CRM
      if (window.logLead) {
        window.logLead(
          "Gold Tracker",
          "WhatsApp Click",
          `Year: ${year} | Capital: ${capital} | Current Value: ${valueNow} | Growth: ${growth}`
        );
      }

      const text = [
        "Hi Kalrion Capital,",
        `I computed my gold investment compound growth starting in year *${year}* on your website.`,
        "",
        `*Investment Details:*`,
        `- Initial Investment Amount: ${capital}`,
        `- Historical Rate (Year ${year}): ${buyPrice}`,
        `- Gold Weight Purchased: ${weight}`,
        `- Value of Investment Today: ${valueNow}`,
        `- Investment Growth Performance: ${growth}`,
        "",
        "I want to explore sovereign gold bonds (SGB) or digital gold investment routes with Kalrion."
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    });
  }
};

// Responsive Grid fix for the stats dashboard
const handleResponsiveGrid = () => {
  const grid = document.getElementById('gold-stats-grid');
  if (!grid) return;
  if (window.innerWidth <= 768) {
    grid.style.gridTemplateColumns = '1fr';
  } else {
    grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  populateYearsDropdown();
  setupBindings();
  calculateGoldReturns();
  renderGoldChart();
  
  handleResponsiveGrid();
  window.addEventListener('resize', handleResponsiveGrid);
});
