// Kalrion Capital E-commerce Book Shop Logic
const whatsappNumber = "918447842244";
const CART_STORAGE_KEY = 'kalrion_shop_cart';

// Handpicked Product Catalog
const booksCatalog = [
  {
    id: 'book_intelligent_investor',
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    price: 499,
    category: 'Investing',
    desc: 'The definitive handbook on Value Investing. Teaches the key concepts of "Margin of Safety" and market cycles.',
    coverColor: 'cover-green',
    badge: 'Classic'
  },
  {
    id: 'book_psychology_money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    price: 349,
    category: 'Psychology',
    desc: 'Explore how behavior, emotions, and ego drive financial decisions rather than raw mathematical formulas.',
    coverColor: 'cover-blue',
    badge: 'Best Seller'
  },
  {
    id: 'book_reminiscences',
    title: 'Reminiscences of a Stock Operator',
    author: 'Edwin Lefèvre',
    price: 299,
    category: 'Trading',
    desc: 'A fictionalized biography of Jesse Livermore, exploring trading strategies, tape reading, and market psychology.',
    coverColor: 'cover-purple',
    badge: 'Legendary'
  },
  {
    id: 'book_common_stocks',
    title: 'Common Stocks and Uncommon Profits',
    author: 'Philip A. Fisher',
    price: 449,
    category: 'Investing',
    desc: 'The blueprint for investment growth, detailing the famous scuttlebutt method of qualitative company research.',
    coverColor: 'cover-amber',
    badge: 'Growth'
  },
  {
    id: 'book_technical_analysis',
    title: 'Technical Analysis of Financial Markets',
    author: 'John J. Murphy',
    price: 899,
    category: 'Trading',
    desc: 'The gold standard guide on chart patterns, candlestick indicators, oscillators, and technical trading systems.',
    coverColor: 'cover-red',
    badge: 'Technicals'
  },
  {
    id: 'book_rich_dad_poor_dad',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    price: 299,
    category: 'Psychology',
    desc: 'Explores financial education, passive cashflow building, and shifting your mindset toward wealth assets.',
    coverColor: 'cover-amber',
    badge: 'Mindset'
  }
];

let cart = [];

// Helper to format currency in Indian style
const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

// Render Products Grid
const renderBooks = (categoryFilter = 'all', sortBy = 'default') => {
  const grid = document.getElementById('book-grid');
  if (!grid) return;
  
  grid.innerHTML = '';

  // Filter books
  let filtered = booksCatalog.filter(book => {
    return categoryFilter === 'all' || book.category === categoryFilter;
  });

  // Sort books
  if (sortBy === 'low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'high-low') {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 40px;">No books found matching this filter.</div>`;
    return;
  }

  filtered.forEach(book => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
      <div class="book-cover-wrapper">
        <div class="book-cover ${book.coverColor}">
          <span class="book-badge">${book.badge}</span>
          <p class="book-title">${book.title}</p>
          <div style="display:flex; flex-direction:column; align-items:center;">
            <span class="book-author">${book.author}</span>
            <span class="book-footer-spine">● KALRION ●</span>
          </div>
        </div>
      </div>
      <div class="product-info">
        <span class="product-category">${book.category}</span>
        <h3 class="product-title">${book.title}</h3>
        <p class="product-author">by ${book.author}</p>
        <p class="product-description">${book.desc}</p>
        <div class="product-footer">
          <span class="product-price">${formatINR(book.price)}</span>
          <button class="button primary" onclick="addToCart('${book.id}')">Add to Cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
};

// Cart Actions & State Persistence
const initCart = () => {
  try {
    const saved = sessionStorage.getItem(CART_STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Kalrion Shop: Error reading cart", e);
    cart = [];
  }
  updateCartUI();
};

const saveCart = () => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Kalrion Shop: Error saving cart", e);
  }
  updateCartUI();
};

const addToCart = (bookId) => {
  const book = booksCatalog.find(b => b.id === bookId);
  if (!book) return;

  const existing = cart.find(item => item.bookId === bookId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ bookId, qty: 1 });
  }

  saveCart();
  showToast(`📚 Added "${book.title}" to cart!`);
  
  // Custom micro-animation on cart trigger
  const trigger = document.getElementById('cart-trigger');
  if (trigger) {
    trigger.style.transform = 'scale(1.2)';
    setTimeout(() => {
      trigger.style.transform = '';
    }, 200);
  }
};

const updateQty = (bookId, delta) => {
  const item = cart.find(item => item.bookId === bookId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(item => item.bookId !== bookId);
  }
  saveCart();
};

const removeFromCart = (bookId) => {
  cart = cart.filter(item => item.bookId !== bookId);
  saveCart();
};

// Render Cart items list and sub-totals
const updateCartUI = () => {
  const badgeCount = document.getElementById('cart-badge-count');
  const emptyMsg = document.getElementById('cart-empty-msg');
  const itemsContainer = document.getElementById('cart-items-container');
  const itemsList = document.getElementById('cart-items-list');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badgeCount) badgeCount.textContent = totalQty;

  if (totalQty === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (itemsContainer) itemsContainer.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (itemsContainer) itemsContainer.style.display = 'flex';
  if (!itemsList) return;

  itemsList.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const book = booksCatalog.find(b => b.id === item.bookId);
    if (!book) return;

    const itemCost = book.price * item.qty;
    subtotal += itemCost;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-cover ${book.coverColor}" style="display: flex; flex-direction:column; justify-content:center; padding: 4px; box-sizing: border-box; text-align:center;">
        <span style="font-size:0.35rem; color:#fff; font-weight:800; overflow:hidden; display:block; white-space:nowrap; text-overflow:ellipsis;">${book.title}</span>
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${book.title}</h4>
        <p class="cart-item-author">${book.author}</p>
        <div class="cart-qty-control">
          <button class="qty-btn" onclick="updateQty('${book.id}', -1)" aria-label="Decrease quantity">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${book.id}', 1)" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">${formatINR(itemCost)}</span>
        <button class="cart-item-remove" onclick="removeFromCart('${book.id}')">Remove</button>
      </div>
    `;
    itemsList.appendChild(row);
  });

  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  document.getElementById('bill-subtotal').textContent = formatINR(subtotal);
  document.getElementById('bill-tax').textContent = formatINR(tax);
  document.getElementById('bill-total').textContent = formatINR(total);
};

// Toast popup alerts
const showToast = (message) => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = message;
  container.appendChild(toast);

  // Auto-clean after transition finishes
  setTimeout(() => {
    toast.remove();
  }, 2500);
};

// Toggle Cart Drawer Drawer
const toggleCartDrawer = () => {
  const overlay = document.getElementById('cart-overlay');
  const drawer = document.getElementById('cart-drawer');
  if (overlay && drawer) {
    overlay.classList.toggle('open');
    drawer.classList.toggle('open');
  }
};

// Handle Checkout Form Submission
const handleCheckout = (e) => {
  e.preventDefault();
  
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const address = document.getElementById('cust-address').value.trim();

  if (cart.length === 0) {
    alert("Your shopping cart is empty!");
    return;
  }

  // Compile items order summary
  let orderDetailsList = [];
  let subtotal = 0;

  cart.forEach(item => {
    const book = booksCatalog.find(b => b.id === item.bookId);
    if (book) {
      orderDetailsList.push(`${book.title} (Qty: ${item.qty} x ${formatINR(book.price)})`);
      subtotal += book.price * item.qty;
    }
  });

  const tax = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + tax;

  const itemsString = orderDetailsList.join(", ");
  const crmDetails = `Buyer: ${name} | Mob: ${phone} | Email: ${email} | Address: ${address} | Order: ${itemsString} | Total: ${formatINR(totalAmount)}`;

  // Log Lead to CRM
  if (window.logLead) {
    window.logLead("Book Shop", "Order Placed", crmDetails);
  }

  // Format WhatsApp Text Invoice
  const whatsAppText = [
    "Hi Kalrion Capital,",
    "I want to place an order for stock market and investing books from your online Knowledge Hub.",
    "",
    `*Order Invoice:*`,
    ...orderDetailsList.map(item => `- ${item}`),
    `- GST (18%): ${formatINR(tax)}`,
    `- Delivery Charges: FREE`,
    `*Total Bill: ${formatINR(totalAmount)}*`,
    "",
    `*Shipping Information:*`,
    `- Name: ${name}`,
    `- Contact Mobile: ${phone}`,
    `- Email Address: ${email}`,
    `- Shipping Address: ${address}`,
    "",
    "Please share details for completing payment (UPI/QR) to confirm my order."
  ].join("\n");

  // Reset Cart State
  cart = [];
  saveCart();
  toggleCartDrawer();
  document.getElementById('checkout-form').reset();
  
  // Open WhatsApp Link
  window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppText)}`;
};

// Event Binding setup
const setupShopEvents = () => {
  const trigger = document.getElementById('cart-trigger');
  const closeBtn = document.getElementById('cart-close-btn');
  const overlay = document.getElementById('cart-overlay');
  const priceSort = document.getElementById('price-sort');
  const checkForm = document.getElementById('checkout-form');

  if (trigger) trigger.addEventListener('click', toggleCartDrawer);
  if (closeBtn) closeBtn.addEventListener('click', toggleCartDrawer);
  if (overlay) overlay.addEventListener('click', toggleCartDrawer);

  // Sorting Handler
  if (priceSort) {
    priceSort.addEventListener('change', () => {
      const activeFilter = document.querySelector('.filter-btn.active');
      const category = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
      renderBooks(category, priceSort.value);
    });
  }

  // Categories Filtering Tags
  const filterContainer = document.getElementById('category-filters');
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        // Toggle active button style
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const category = e.target.getAttribute('data-category');
        const sortVal = priceSort ? priceSort.value : 'default';
        renderBooks(category, sortVal);
      }
    });
  }

  // Checkout Form
  if (checkForm) {
    checkForm.addEventListener('submit', handleCheckout);
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderBooks();
  initCart();
  setupShopEvents();

  // Expose methods to global window for HTML inline buttons
  window.addToCart = addToCart;
  window.updateQty = updateQty;
  window.removeFromCart = removeFromCart;
});
