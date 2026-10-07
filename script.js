/* ==========================================================
   Campus Cafeteria POS - script.js  (main order page)
   Handles: cart, quantities, totals, payment validation,
   transaction numbers, and sending the receipt to receipt.html
   ========================================================== */

// ---------- 1. DATA ----------

// The product list (names and prices exactly as required).
// PRODUCT IMAGES: put your pictures inside an "images" folder next to
// index.html, then change the "image" path of each product below.
// If a file is missing, a gray "No image" box is shown instead.
const PRODUCTS = [
  { id: 1, name: "Rice (Plain)",         price: 15.00, image: "images/rice.jpg" },
  { id: 2, name: "Fried Chicken (1 pc)", price: 65.00, image: "images/chicken.jpg" },
  { id: 3, name: "Pork Adobo",           price: 60.00, image: "images/adoba.jpg" },
  { id: 4, name: "Vegetable Side Dish",  price: 35.00, image: "images/vegetables.jpg" },
  { id: 5, name: "Iced Tea (cup)",       price: 20.00, image: "images/iced tea.jpg" },
  { id: 6, name: "Bottled Water",        price: 20.00, image: "images/water.jpg" }
];

// The cart: a list of { id, name, price, quantity }
let cart = [];

// Storage keys. The counter must survive page changes (index -> receipt -> index),
// so the transaction count is kept in localStorage.
// The receipt is handed to receipt.html through sessionStorage.
const COUNTER_KEY = "cafeteriaTxnCount";
const RECEIPT_KEY = "cafeteriaReceipt";
const SALES_KEY   = "cafeteriaTransactions";   // list of all paid transactions (used by the Dashboard)
let fallbackCount = 0;   // used only if the browser blocks storage

// ---------- 2. PAGE ELEMENTS ----------
const productList = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const amountInput = document.getElementById("amount-paid");
const messageEl   = document.getElementById("message");   // error messages
const statusEl    = document.getElementById("status");    // success messages
const payBtn      = document.getElementById("pay-btn");
const newBtn      = document.getElementById("new-btn");

// ---------- 3. HELPER FUNCTIONS ----------

// Format a number as pesos with 2 decimals, e.g. 65 -> "₱65.00"
function formatPeso(amount) {
  return "₱" + amount.toFixed(2);
}

// Add up every item's (price x quantity)
function getTotal() {
  let total = 0;
  for (const item of cart) {
    total += item.price * item.quantity;
  }
  return total;
}

// ERROR feedback: red message under the Amount Paid box.
// The input also turns red and gets the cursor back so the cashier can retype.
function showError(text) {
  messageEl.textContent = "✖ " + text;
  messageEl.className = "message error";
  amountInput.classList.add("invalid");
  amountInput.focus();
  amountInput.select();
}
function clearMessage() {
  messageEl.textContent = "";
  messageEl.className = "message";
  amountInput.classList.remove("invalid");
}

// SUCCESS feedback: green message under the order total
function showStatus(text) {
  statusEl.textContent = "✔ " + text;
  statusEl.className = "status success";
}
function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "status";
}

// ---------- 4. PRODUCTS ----------

// Build one card (image, name, price, button) for each product
function renderProducts() {
  productList.innerHTML = "";
  for (const product of PRODUCTS) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML =
      '<div class="product-image"><img src="' + product.image + '" alt="' + product.name + '"></div>' +
      '<div class="product-name">' + product.name + "</div>" +
      '<div class="product-price">' + formatPeso(product.price) + "</div>" +
      '<button class="btn btn-add" data-id="' + product.id + '">Add to Cart</button>';

    // If the picture file can't be found, show a simple placeholder
    const img = card.querySelector("img");
    img.addEventListener("error", function () {
      img.parentElement.textContent = "No image";
    });

    productList.appendChild(card);
  }
}

// One click listener for all "Add to Cart" buttons
productList.addEventListener("click", function (event) {
  const btn = event.target.closest(".btn-add");
  if (btn) {
    addToCart(Number(btn.dataset.id));
  }
});

// ---------- 5. CART ----------

// Add a product. If it's already in the cart, just increase the quantity.
function addToCart(productId) {
  const existing = cart.find(function (item) { return item.id === productId; });

  if (existing) {
    existing.quantity += 1;
  } else {
    const product = PRODUCTS.find(function (p) { return p.id === productId; });
    cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
  }
  clearMessage();
  const added = cart.find(function (item) { return item.id === productId; });
  showStatus(added.name + " added to cart (quantity: " + added.quantity + ").");
  renderCart();
}

// Change quantity by +1 or -1 (never below 1)
function changeQuantity(productId, change) {
  const item = cart.find(function (i) { return i.id === productId; });
  if (!item) return;
  if (item.quantity + change < 1) return;
  item.quantity += change;
  showStatus(item.name + " quantity changed to " + item.quantity + ".");
  renderCart();
}

// Remove an item completely
function removeItem(productId) {
  const removed = cart.find(function (item) { return item.id === productId; });
  cart = cart.filter(function (item) { return item.id !== productId; });
  if (removed) showStatus(removed.name + " removed from cart.");
  renderCart();
}

// Redraw the Order Summary and the total
// (called after every cart change, so everything updates immediately)
function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
  }

  for (const item of cart) {
    const subtotal = item.price * item.quantity;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML =
      '<div class="cart-item-top"><span>' + item.name + "</span>" +
      "<span>" + formatPeso(subtotal) + "</span></div>" +
      '<div class="cart-item-price">' + formatPeso(item.price) + " each</div>" +
      '<div class="cart-item-controls">' +
        '<button class="qty-btn" data-action="minus" data-id="' + item.id + '"' +
          (item.quantity <= 1 ? " disabled" : "") + ' aria-label="Decrease quantity">−</button>' +
        '<span class="qty-value">' + item.quantity + "</span>" +
        '<button class="qty-btn" data-action="plus" data-id="' + item.id + '" aria-label="Increase quantity">+</button>' +
        '<button class="remove-btn" data-action="remove" data-id="' + item.id + '">Remove</button>' +
      "</div>";
    cartItemsEl.appendChild(row);
  }

  cartTotalEl.textContent = formatPeso(getTotal());
}

// One click listener for all +, − and Remove buttons
cartItemsEl.addEventListener("click", function (event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  if (btn.dataset.action === "plus")   changeQuantity(id, 1);
  if (btn.dataset.action === "minus")  changeQuantity(id, -1);
  if (btn.dataset.action === "remove") removeItem(id);
});

// ---------- 6. TRANSACTION NUMBER ----------

// Increase the saved counter and return a number like "TXN-0001"
function makeTransactionNumber() {
  let count;
  try {
    count = Number(localStorage.getItem(COUNTER_KEY) || 0) + 1;
    localStorage.setItem(COUNTER_KEY, count);
  } catch (error) {
    fallbackCount += 1;
    count = fallbackCount;
  }
  return "TXN-" + String(count).padStart(4, "0");
}

// Add a paid transaction to the saved sales list (the Dashboard reads this list)
function saveTransaction(receipt) {
  try {
    const sales = JSON.parse(localStorage.getItem(SALES_KEY)) || [];
    sales.push(receipt);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch (error) {
    /* If storage is blocked the sale still works, it just won't show on the Dashboard */
  }
}

// ---------- 7. PAYMENT ----------

// Check the Amount Paid input. Returns a number, or null if invalid.
function parsePayment(text) {
  const cleaned = text.trim();
  // Only digits with an optional decimal part (up to 2 places).
  // This rejects blank, letters, symbols and negative signs.
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  return Number(cleaned);
}

function handlePay() {
  clearMessage();
  const total = getTotal();

  // Nothing to pay for
  if (cart.length === 0) {
    showError("Your cart is empty. Add at least one item before paying.");
    return;
  }

  // Blank, non-numeric or negative input
  const paid = parsePayment(amountInput.value);
  if (paid === null) {
    showError("Please enter a valid payment amount.");
    return;
  }

  // Not enough money
  // (round to cents so decimals like 0.1 + 0.2 don't cause false errors)
  if (Math.round(paid * 100) < Math.round(total * 100)) {
    showError("Insufficient payment. Please enter at least " + formatPeso(total) + ".");
    return;
  }

  // ---- Payment is valid: build the receipt and open receipt.html ----
  const change = Math.round((paid - total) * 100) / 100;

  const receipt = {
    transactionNumber: makeTransactionNumber(),
    dateTime: new Date().toLocaleString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }),
    items: cart,
    total: total,
    paid: paid,
    change: change
  };

  try {
    sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
  } catch (error) {
    showError("Could not open the receipt. Please allow browser storage and try again.");
    return;
  }

  saveTransaction(receipt);
  window.location.href = "receipt.html";
}

// ---------- 8. NEW TRANSACTION ----------

// Clear the cart, amount, messages and any saved receipt
// (the transaction counter is kept so numbers keep increasing)
function newTransaction() {
  cart = [];
  amountInput.value = "";
  clearMessage();
  clearStatus();
  try { sessionStorage.removeItem(RECEIPT_KEY); } catch (error) { /* ignore */ }
  renderCart();
}

// ---------- 9. START THE APP ----------
payBtn.addEventListener("click", handlePay);
newBtn.addEventListener("click", newTransaction);

// Typing a new amount clears the old error message
amountInput.addEventListener("input", clearMessage);

// Pressing Enter in the Amount Paid box also pays
amountInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handlePay();
});

// If the browser's Back button shows this page again after a payment,
// start a fresh order instead of the old one.
window.addEventListener("pageshow", function (event) {
  if (event.persisted) newTransaction();
});

renderProducts();
renderCart();
