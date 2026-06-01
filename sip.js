const whatsappNumber = "918447842244";
let sipChart = null;

// Helper to format currency in Indian style (Lakhs, Crores)
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

// Quick setting helper for rate buttons
window.setSIPRate = (rate) => {
  const slider = document.getElementById('sip-rate-slider');
  const text = document.getElementById('sip-rate-text');
  if (slider && text) {
    slider.value = rate;
    text.value = rate;
    calculateSIP();
  }
};

// Main calculation logic
const calculateSIP = () => {
  const amountSlider = document.getElementById('sip-amount-slider');
  const rateSlider = document.getElementById('sip-rate-slider');
  const termSlider = document.getElementById('sip-term-slider');

  if (!amountSlider || !rateSlider || !termSlider) return;

  const P = parseFloat(amountSlider.value);
  const annualRate = parseFloat(rateSlider.value);
  const years = parseInt(termSlider.value, 10);

  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = years * 12;

  // Formula: FV = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
  let fv = 0;
  if (monthlyRate === 0) {
    fv = P * totalMonths;
  } else {
    fv = P * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const futureValue = Math.round(fv);
  const investedAmount = P * totalMonths;
  const wealthGain = futureValue - investedAmount;

  // Update UI Elements
  document.getElementById('sip-total-value').textContent = formatINR(futureValue);
  document.getElementById('res-sip-invested').textContent = formatINR(investedAmount);
  document.getElementById('res-sip-gain').textContent = formatINR(wealthGain);

  // Generate data points for chart
  const labels = [];
  const investedData = [];
  const totalData = [];

  for (let year = 1; year <= years; year++) {
    labels.push(`Yr ${year}`);
    const months = year * 12;
    let val = 0;
    if (monthlyRate === 0) {
      val = P * months;
    } else {
      val = P * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }
    investedData.push(P * months);
    totalData.push(Math.round(val));
  }

  updateSIPChart(labels, investedData, totalData);
};

// Render or update Chart.js instance for SIP growth
const updateSIPChart = (labels, investedData, totalData) => {
  const ctx = document.getElementById('sipChart');
  if (!ctx) return;

  if (sipChart) {
    sipChart.data.labels = labels;
    sipChart.data.datasets[0].data = investedData;
    sipChart.data.datasets[1].data = totalData;
    sipChart.update();
  } else {
    sipChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Invested Capital',
            data: investedData,
            borderColor: '#4A5D54',
            backgroundColor: 'rgba(74, 93, 84, 0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.1,
            pointRadius: 0
          },
          {
            label: 'Compound Wealth',
            data: totalData,
            borderColor: '#0A4D34',
            backgroundColor: 'rgba(10, 77, 52, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.1,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Plus Jakarta Sans',
                weight: 'bold'
              },
              color: '#111D18'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return ` ${label}: ${formatINR(value)}`;
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
                if (value >= 10000000) return `₹${(value/10000000).toFixed(1)} Cr`;
                if (value >= 100000) return `₹${(value/100000).toFixed(0)} L`;
                return `₹${value}`;
              }
            }
          }
        }
      }
    });
  }
};

// Setup Two-way Bindings & Event Listeners
const setupBindings = () => {
  const bindings = [
    { slider: 'sip-amount-slider', text: 'sip-amount-text', format: true },
    { slider: 'sip-rate-slider', text: 'sip-rate-text', format: false },
    { slider: 'sip-term-slider', text: 'sip-term-text', format: false }
  ];

  bindings.forEach(bind => {
    const sliderEl = document.getElementById(bind.slider);
    const textEl = document.getElementById(bind.text);

    if (!sliderEl || !textEl) return;

    sliderEl.addEventListener('input', () => {
      textEl.value = bind.format ? new Intl.NumberFormat('en-IN').format(sliderEl.value) : sliderEl.value;
      calculateSIP();
    });

    textEl.addEventListener('change', () => {
      let val = bind.format ? parseINR(textEl.value) : parseFloat(textEl.value);
      
      const min = parseFloat(sliderEl.min);
      const max = parseFloat(sliderEl.max);
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;

      sliderEl.value = val;
      textEl.value = bind.format ? new Intl.NumberFormat('en-IN').format(val) : val;
      calculateSIP();
    });
  });

  // WhatsApp Button Click Listener
  const whatsappBtn = document.getElementById('sip-whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const amount = formatINR(document.getElementById('sip-amount-slider').value);
      const rate = document.getElementById('sip-rate-slider').value;
      const term = document.getElementById('sip-term-slider').value;
      const capital = document.getElementById('res-sip-invested').textContent;
      const gain = document.getElementById('res-sip-gain').textContent;
      const total = document.getElementById('sip-total-value').textContent;

      const text = [
        "Hi Kalrion Capital,",
        "I calculated my Mutual Fund SIP compounding projections on your website.",
        "",
        `*SIP Projections:*`,
        `- Monthly SIP Amount: ${amount}`,
        `- Expected Return Rate: ${rate}% p.a.`,
        `- Investment Duration: ${term} Years`,
        `- Total Invested Capital: ${capital}`,
        `- Estimated Wealth Gain: ${gain}`,
        `- Projected Total Value: ${total}`,
        "",
        "Please suggest suitable mutual fund schemes matching this investment timeline and profile."
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    });
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupBindings();
  calculateSIP();
});
