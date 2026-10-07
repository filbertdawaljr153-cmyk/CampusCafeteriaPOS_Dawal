/* ==========================================================
   Campus Cafeteria POS - receipt.js  (receipt page)
   Reads the receipt saved by script.js and displays it.
   ========================================================== */

const RECEIPT_KEY = "cafeteriaReceipt";   // must match script.js

const confirmEl = document.getElementById("confirmation");
const receiptEl = document.getElementById("receipt");
const newBtn    = document.getElementById("new-btn");

// Format a number as pesos with 2 decimals
function formatPeso(amount) {
  return "₱" + amount.toFixed(2);
}

// Load the saved receipt (or null if there is none)
function loadReceipt() {
  try {
    return JSON.parse(sessionStorage.getItem(RECEIPT_KEY));
  } catch (error) {
    return null;
  }
}

// Show the "Payment successful!" box and the receipt
function showReceipt(r) {
  document.getElementById("conf-total").textContent  = formatPeso(r.total);
  document.getElementById("conf-paid").textContent   = formatPeso(r.paid);
  document.getElementById("conf-change").textContent = formatPeso(r.change);
  confirmEl.classList.remove("hidden");

  // Item table: Item | Qty | Price | Subtotal (columns line up on every row)
  let itemLines =
    '<div class="receipt-item receipt-head">' +
      "<span>Item</span><span>Qty</span><span>Price</span><span>Subtotal</span>" +
    "</div>";
  for (const item of r.items) {
    itemLines +=
      '<div class="receipt-item">' +
        "<span>" + item.name + "</span>" +
        "<span>x" + item.quantity + "</span>" +
        "<span>" + formatPeso(item.price) + "</span>" +
        "<span>" + formatPeso(item.price * item.quantity) + "</span>" +
      "</div>";
  }

  receiptEl.innerHTML =
    '<div class="center"><strong>CAMPUS CAFETERIA</strong><br>DIGITAL RECEIPT</div>' +
    "<hr>" +
    "<div>Transaction #: " + r.transactionNumber + "</div>" +
    "<div>Date: " + r.dateTime + "</div>" +
    "<hr>" +
    itemLines +
    "<hr>" +
    '<div class="receipt-row receipt-total"><span>Total:</span><span>' + formatPeso(r.total) + "</span></div>" +
    '<div class="receipt-row"><span>Amount Paid:</span><span>' + formatPeso(r.paid) + "</span></div>" +
    '<div class="receipt-row"><span>Change:</span><span>' + formatPeso(r.change) + "</span></div>" +
    "<hr>" +
    '<div class="center"><strong>Payment Successful!</strong></div>';
}

// "New Transaction": delete the receipt and go back to a fresh order page
newBtn.addEventListener("click", function () {
  try { sessionStorage.removeItem(RECEIPT_KEY); } catch (error) { /* ignore */ }
  window.location.href = "index.html";
});

// ---------- Start ----------
const receipt = loadReceipt();
if (receipt) {
  showReceipt(receipt);
} else {
  // Opened directly without paying first
  receiptEl.className = "no-receipt";
  receiptEl.innerHTML = 'No receipt to show. <a href="index.html">Go to the order page</a>';
  newBtn.classList.add("hidden");
}
