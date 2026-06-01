const whatsappNumber = "918447842244";
let loanChart = null;

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

// Calculate EMI and build amortization schedule
const calculateEMI = () => {
  const amountSlider = document.getElementById('loan-amount-slider');
  const rateSlider = document.getElementById('loan-rate-slider');
  const termSlider = document.getElementById('loan-term-slider');

  if (!amountSlider || !rateSlider || !termSlider) return;

  const P = parseFloat(amountSlider.value);
  const annualRate = parseFloat(rateSlider.value);
  const years = parseInt(termSlider.value, 10);

  const monthlyRate = annualRate / 12 / 100;
  const numberOfMonths = years * 12;

  // Formula: EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
  let emi = 0;
  if (monthlyRate === 0) {
    emi = P / numberOfMonths;
  } else {
    emi = P * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths) / (Math.pow(1 + monthlyRate, numberOfMonths) - 1);
  }

  const monthlyEMI = Math.round(emi);
  const totalPayment = monthlyEMI * numberOfMonths;
  const totalInterest = totalPayment - P;

  // Update UI Elements
  document.getElementById('loan-emi-value').textContent = formatINR(monthlyEMI);
  document.getElementById('res-principal').textContent = formatINR(P);
  document.getElementById('res-interest').textContent = formatINR(totalInterest);
  document.getElementById('res-total').textContent = formatINR(totalPayment);

  // Render/Update Chart
  updateChart(P, totalInterest);

  // Generate Amortization schedule (Yearly)
  generateAmortizationTable(P, annualRate, monthlyEMI, years);
};

// Render or update Chart.js instance
const updateChart = (principal, interest) => {
  const ctx = document.getElementById('loanChart');
  if (!ctx) return;

  if (loanChart) {
    loanChart.data.datasets[0].data = [principal, interest];
    loanChart.update();
  } else {
    loanChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Interest'],
        datasets: [{
          data: [principal, interest],
          backgroundColor: ['#0A4D34', '#D4AF37'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
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
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return ` ${label}: ${formatINR(value)}`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }
};

// Generate Yearly breakdown of payments
const generateAmortizationTable = (principal, annualRate, monthlyEMI, years) => {
  const tbody = document.getElementById('amort-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  let balance = principal;
  const monthlyRate = annualRate / 12 / 100;

  for (let year = 1; year <= years; year++) {
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;

    for (let month = 1; month <= 12; month++) {
      const interestPaid = balance * monthlyRate;
      const principalPaid = monthlyEMI - interestPaid;

      yearlyInterest += interestPaid;
      yearlyPrincipal += principalPaid;
      balance -= principalPaid;
      
      if (balance < 0) balance = 0;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Year ${year}</td>
      <td>${formatINR(Math.round(yearlyPrincipal))}</td>
      <td>${formatINR(Math.round(yearlyInterest))}</td>
      <td>${formatINR(Math.round(yearlyPrincipal + yearlyInterest))}</td>
      <td>${formatINR(Math.round(balance))}</td>
    `;
    tbody.appendChild(tr);
  }
};

// Setup Two-way Slider Bindings & Event Listeners
const setupBindings = () => {
  const bindings = [
    { slider: 'loan-amount-slider', text: 'loan-amount-text', format: true },
    { slider: 'loan-rate-slider', text: 'loan-rate-text', format: false },
    { slider: 'loan-term-slider', text: 'loan-term-text', format: false }
  ];

  bindings.forEach(bind => {
    const sliderEl = document.getElementById(bind.slider);
    const textEl = document.getElementById(bind.text);

    if (!sliderEl || !textEl) return;

    // Slider moves -> Text Box updates
    sliderEl.addEventListener('input', () => {
      textEl.value = bind.format ? new Intl.NumberFormat('en-IN').format(sliderEl.value) : sliderEl.value;
      calculateEMI();
    });

    // Text Box typing -> Slider updates
    textEl.addEventListener('change', () => {
      let val = bind.format ? parseINR(textEl.value) : parseFloat(textEl.value);
      
      // Clamp inputs within bounds
      const min = parseFloat(sliderEl.min);
      const max = parseFloat(sliderEl.max);
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;

      sliderEl.value = val;
      textEl.value = bind.format ? new Intl.NumberFormat('en-IN').format(val) : val;
      calculateEMI();
    });
  });

  // Loan Type radio change handles avg interest rates
  const loanRadios = document.querySelectorAll('input[name="loan-type"]');
  loanRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const type = e.target.value;
      const rateSlider = document.getElementById('loan-rate-slider');
      const rateText = document.getElementById('loan-rate-text');
      const termSlider = document.getElementById('loan-term-slider');
      const termText = document.getElementById('loan-term-text');

      if (type === 'home') {
        rateSlider.value = 8.5;
        termSlider.value = 20;
      } else if (type === 'car') {
        rateSlider.value = 9.8;
        termSlider.value = 7;
      } else if (type === 'personal') {
        rateSlider.value = 12.5;
        termSlider.value = 5;
      } else if (type === 'lap') {
        rateSlider.value = 9.2;
        termSlider.value = 15;
      }

      rateText.value = rateSlider.value;
      termText.value = termSlider.value;
      calculateEMI();
    });
  });

  // WhatsApp Button Click Listener
  const whatsappBtn = document.getElementById('loan-whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="loan-type"]:checked');
      const typeText = selectedRadio ? selectedRadio.parentNode.querySelector('.tile-title').textContent : "Home Loan";
      
      const amount = formatINR(document.getElementById('loan-amount-slider').value);
      const rate = document.getElementById('loan-rate-slider').value;
      const term = document.getElementById('loan-term-slider').value;
      const emi = document.getElementById('loan-emi-value').textContent;
      const interest = document.getElementById('res-interest').textContent;
      const total = document.getElementById('res-total').textContent;

      // Log Lead to CRM
      if (window.logLead) {
        window.logLead(
          "Loan EMI Calculator",
          "WhatsApp Click",
          `Type: ${typeText} | Amount: ${amount} | Rate: ${rate}% | Tenure: ${term} Years | EMI: ${emi}`
        );
      }

      const text = [
        "Hi Kalrion Capital,",
        `I am planning to apply for a *${typeText}* and used the EMI calculator on your website.`,
        "",
        `*Loan Configuration:*`,
        `- Loan Amount: ${amount}`,
        `- Annual Interest: ${rate}% p.a.`,
        `- Loan Tenure: ${term} Years`,
        `- Monthly EMI: ${emi}`,
        `- Total Interest Paid: ${interest}`,
        `- Total Amount Payable: ${total}`,
        "",
        "Please help me check eligibility and compare bank interest rates for this configuration."
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    });
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupBindings();
  calculateEMI();
});
