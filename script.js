const whatsappNumber = "918447842244";

// ==========================================================================
// WHATSAPP FORM SUBMISSION LOGIC
// ==========================================================================
const buildWhatsAppUrl = (data) => {
  const name = data.get("name") || "";
  const phone = data.get("phone") || "";
  const need = data.get("need") || "Insurance guidance";
  const message = data.get("message") || "";

  const text = [
    "Hi Kalrion Capital, I want help with insurance.",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Need: ${need}`,
    message ? `Message: ${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
};

const handleForm = (formId, noteId) => {
  const form = document.getElementById(formId);
  const note = document.getElementById(noteId);

  if (form && note) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      note.textContent = "Opening WhatsApp with your enquiry details.";
      
      // Log Lead to CRM
      if (window.logLead) {
        const formName = formId === "quote-form" ? "Home Quote Request" : "Home Contact Form";
        const details = Array.from(data.entries()).map(([k, v]) => `${k}: ${v}`).join(" | ");
        window.logLead("Home Page", "Form Submit", `${formName} | ${details}`);
      }

      window.location.href = buildWhatsAppUrl(data);
    });
  }
};

// ==========================================================================
// HEALTH INSURANCE ADVISOR CALCULATOR
// ==========================================================================
const calculateHealth = () => {
  const memberRadio = document.querySelector('input[name="health-members"]:checked');
  const ageSelect = document.getElementById('health-age');
  const citySelect = document.getElementById('health-city');
  const coverEl = document.getElementById('health-recommended-cover');
  const breakdownEl = document.getElementById('health-cover-breakdown');
  const tipsEl = document.getElementById('health-tips');

  if (!memberRadio || !ageSelect || !citySelect || !coverEl || !breakdownEl || !tipsEl) return;

  const member = memberRadio.value;
  const age = ageSelect.value;
  const city = citySelect.value;

  let base = 5; // in Lakhs
  if (member === 'couple') base = 7.5;
  if (member === 'family') base = 10;
  if (member === 'parents') base = 5;

  let multiplier = 1.0;
  if (age === 'adult') multiplier = 1.2;
  if (age === 'middle') multiplier = 1.4;
  if (age === 'senior') multiplier = 1.5;

  if (city === 'tier1') multiplier *= 1.25;

  const recommendedBase = Math.round(base * multiplier);
  let topUp = 10;
  if (recommendedBase > 7) topUp = 15;
  if (recommendedBase > 12) topUp = 20;

  const total = recommendedBase + topUp;

  // Update sum results
  coverEl.textContent = `₹ ${total} Lakhs`;
  breakdownEl.textContent = `Base Cover: ₹${recommendedBase} Lakhs + Super Top-up: ₹${topUp} Lakhs`;

  // Update tips list dynamically
  tipsEl.innerHTML = '';
  const tips = [];

  if (city === 'tier1') {
    tips.push('<strong>Room Rent Policy:</strong> Insist on "No Room Rent Capping" as room charges in Tier-1 cities are extremely high.');
  } else {
    tips.push('<strong>Cashless Access:</strong> Check cashless hospital networks specifically for private clinics in your city.');
  }

  if (member === 'parents' || age === 'senior') {
    tips.push('<strong>Co-pay Exclusions:</strong> Senior plans often include 10-20% co-payment clauses. Let\'s evaluate if a slightly higher premium is better than paying a co-pay during claims.');
    tips.push('<strong>Pre-Existing Diseases:</strong> Compare policies with a 2-year waiting period for diabetes/hypertension instead of 4 years.');
  } else {
    tips.push('<strong>No Claim Bonus:</strong> Choose plans with 100% NCB boost features to automatically double your cover in claim-free years.');
  }

  tips.push('<strong>Restoration Benefit:</strong> Ensure the policy restores the sum insured up to 100% if it is exhausted in a single hospitalization.');

  tips.forEach(tipText => {
    const li = document.createElement('li');
    li.innerHTML = tipText;
    tipsEl.appendChild(li);
  });
};

const setupHealthCalculator = () => {
  const inputs = [
    ...document.querySelectorAll('input[name="health-members"]'),
    document.getElementById('health-age'),
    document.getElementById('health-city')
  ];

  inputs.forEach(input => {
    if (input) {
      input.addEventListener('change', calculateHealth);
    }
  });

  const whatsappButton = document.getElementById('health-calc-whatsapp');
  if (whatsappButton) {
    whatsappButton.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="health-members"]:checked');
      const member = selectedRadio ? selectedRadio.parentNode.querySelector('.tile-title').textContent : "Family";
      const ageText = document.getElementById('health-age').options[document.getElementById('health-age').selectedIndex].text;
      const cityText = document.getElementById('health-city').options[document.getElementById('health-city').selectedIndex].text;
      const cover = document.getElementById('health-recommended-cover').textContent;
      const breakdown = document.getElementById('health-cover-breakdown').textContent;

      // Log Lead to CRM
      if (window.logLead) {
        window.logLead(
          "Home Page - Health Cover Advisor",
          "WhatsApp Click",
          `Members: ${member} | Age Group: ${ageText} | City: ${cityText} | Recommended Cover: ${cover}`
        );
      }

      const text = [
        "Hi Kalrion Capital,",
        "I calculated my recommended health cover on your website.",
        "",
        `*Details:*`,
        `- Covered Members: ${member}`,
        `- Oldest Age: ${ageText}`,
        `- Location: ${cityText}`,
        `- Recommended Cover: ${cover}`,
        `- Proposed Split: ${breakdown}`,
        "",
        "Please help me shortlist top plans matching this recommendation."
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    });
  }

  // Initial calculation
  calculateHealth();
};

// ==========================================================================
// MOTOR INSURANCE ADVISOR CALCULATOR
// ==========================================================================
const calculateMotor = () => {
  const ageSelect = document.getElementById('motor-age');
  const zerodepRadio = document.querySelector('input[name="motor-zerodep"]:checked');
  const ncbSelect = document.getElementById('motor-ncb');
  const titleEl = document.getElementById('motor-recommended-title');
  const savingsEl = document.getElementById('motor-ncb-savings');
  const addonsEl = document.getElementById('motor-addons-list');

  if (!ageSelect || !zerodepRadio || !ncbSelect || !titleEl || !savingsEl || !addonsEl) return;

  const age = ageSelect.value;
  const zerodep = zerodepRadio.value;
  const ncb = ncbSelect.value;

  let bundleTitle = 'Standard Comprehensive';
  const addons = [];

  if (age === 'new') {
    bundleTitle = 'Titanium Protection Bundle';
    addons.push('<strong>Zero Depreciation:</strong> Mandatory. Get 100% replacement cost for fiber, plastic, glass, and metal parts.');
    addons.push('<strong>Return to Invoice (RTI):</strong> Highly recommended. Covers the difference between IDV and actual invoice price, including registration & road tax in case of total loss.');
    addons.push('<strong>Engine Protection:</strong> Safeguards engine components against water ingression (hydrostatic lock) during monsoons.');
    addons.push('<strong>Consumables Cover:</strong> Covers costs of lubricants, oil, screws, and clips during an accident repair.');
  } else if (age === 'mid') {
    if (zerodep === 'yes') {
      bundleTitle = 'Gold Protection Bundle';
      addons.push('<strong>Zero Depreciation:</strong> Crucial. Avoid paying 30% to 50% depreciation on depreciating components out of pocket.');
      addons.push('<strong>Engine Protection:</strong> Extremely useful if your area is prone to heavy seasonal waterlogging.');
      addons.push('<strong>Roadside Assistance (RSA):</strong> Essential roadside towing, flat tire, and key recovery support.');
    } else {
      bundleTitle = 'Value Plus Bundle';
      addons.push('<strong>Comprehensive Own Damage:</strong> Covers accidental body repairs.');
      addons.push('<strong>NCB Protect:</strong> Keeps your current discount active even if you make a claim during the policy year.');
      addons.push('<strong>Roadside Assistance:</strong> Basic towing and emergency assistance.');
    }
  } else {
    bundleTitle = 'Essential Utility Bundle';
    addons.push('<strong>Comprehensive Cover:</strong> Standard accidental coverage. Focus on selecting a correct, realistic IDV.');
    addons.push('<strong>Third-Party Liability:</strong> Legally mandatory cover against third-party bodily injury and property damage.');
    if (zerodep === 'yes') {
      addons.push('<strong>Zero Depreciation:</strong> Note that zero-dep add-ons are generally not offered by insurers for cars older than 5 years.');
    }
  }

  // Update UI values
  titleEl.textContent = bundleTitle;
  savingsEl.textContent = `NCB Discount: ${ncb}% (Keeps premium down)`;

  // Update recommendations list
  addonsEl.innerHTML = '';
  addons.forEach(addon => {
    const li = document.createElement('li');
    li.innerHTML = addon;
    addonsEl.appendChild(li);
  });
};

const setupMotorCalculator = () => {
  const inputs = [
    document.getElementById('motor-age'),
    ...document.querySelectorAll('input[name="motor-zerodep"]'),
    document.getElementById('motor-ncb')
  ];

  inputs.forEach(input => {
    if (input) {
      input.addEventListener('change', calculateMotor);
    }
  });

  const whatsappButton = document.getElementById('motor-calc-whatsapp');
  if (whatsappButton) {
    whatsappButton.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="motor-zerodep"]:checked');
      const ageText = document.getElementById('motor-age').options[document.getElementById('motor-age').selectedIndex].text;
      const zerodepVal = selectedRadio ? selectedRadio.parentNode.querySelector('.tile-title').textContent : "Yes";
      const ncbText = document.getElementById('motor-ncb').options[document.getElementById('motor-ncb').selectedIndex].text;
      const bundle = document.getElementById('motor-recommended-title').textContent;

      // Log Lead to CRM
      if (window.logLead) {
        window.logLead(
          "Home Page - Motor Insurance Advisor",
          "WhatsApp Click",
          `Vehicle Age: ${ageText} | Zero Dep: ${zerodepVal} | NCB: ${ncbText} | Recommended: ${bundle}`
        );
      }

      const text = [
        "Hi Kalrion Capital,",
        "I configured my motor insurance add-ons on your website.",
        "",
        `*Details:*`,
        `- Vehicle Age: ${ageText}`,
        `- Zero Dep Preference: ${zerodepVal}`,
        `- No Claim Bonus (NCB): ${ncbText}`,
        `- Recommended Package: ${bundle}`,
        "",
        "Please help me check premium quotes for my vehicle renewal."
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    });
  }

  // Initial calculation
  calculateMotor();
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  handleForm("quote-form", "form-note");
  handleForm("contact-form", "contact-note");
  setupHealthCalculator();
  setupMotorCalculator();

  // General Call & WhatsApp link logging
  const logClick = (selector, action, label) => {
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
      el.addEventListener('click', () => {
        if (window.logLead) {
          window.logLead("Home Page", action, label);
        }
      });
    });
  };
  logClick('.sticky-call', 'Call Click', 'Clicked sticky Call now button');
  logClick('.sticky-whatsapp', 'WhatsApp Click', 'Clicked sticky WhatsApp enquiry button');
  logClick('.header-cta', 'Call Click', 'Clicked Call now button in header');
});
