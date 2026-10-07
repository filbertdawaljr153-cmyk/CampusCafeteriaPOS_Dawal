/* ==========================================================
   Campus Cafeteria POS - dashboard.js
   Reads the saved transactions and shows a sales summary.
   ========================================================== */

// These keys must match script.js and receipt.js
const SALES_KEY   = "cafeteriaTransactions";
const RECEIPT_KEY = "cafeteriaReceipt";
const COUNTER_KEY = "cafeteriaTxnCount";

const statsEl = document.getElementById("stats");
const tableEl = document.getElementById("tx-table");
const resetBtn = document.getElementById("reset-btn");

// Format a number as pesos with 2 decimals
function formatPeso(amount) {
  return "₱" + amount.toFixed(2);
}

// Load the saved transactions (empty list if none)
function loadSales() {
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY)) || [];
  } catch (error) {
    return [];
  }
}

// Work out the numbers shown on the summary cards
function calculateStats(sales) {
  let totalSales = 0;
  let itemsSold = 0;
  const countByItem = {};   // e.g. { "Rice (Plain)": 5 }

  for (const sale of sales) {
    totalSales += sale.total;
    for (const item of sale.items) {
      itemsSold += item.quantity;
      countByItem[item.name] = (countByItem[item.name] || 0) + item.quantity;
    }
  }

  // Best seller = item with the highest quantity sold
  let bestSeller = "—";
  let bestCount = 0;
  for (const name in countByItem) {
    if (countByItem[name] > bestCount) {
      bestCount = countByItem[name];
      bestSeller = name + " (" + bestCount + ")";
    }
  }

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    transactions: sales.length,
    itemsSold: itemsSold,
    bestSeller: bestSeller
  };
}

// Draw the four summary cards
function renderStats(stats) {
  const cards = [
    { label: "Total Sales",  value: formatPeso(stats.totalSales) },
    { label: "Transactions", value: stats.transactions },
    { label: "Items Sold",   value: stats.itemsSold },
    { label: "Best Seller",  value: stats.bestSeller }
  ];
  statsEl.innerHTML = "";
  for (const card of cards) {
    const div = document.createElement("div");
    div.className = "stat-card";
    div.innerHTML = '<div class="stat-label">' + card.label + "</div>" +
                    '<div class="stat-value">' + card.value + "</div>";
    statsEl.appendChild(div);
  }
}

// Draw the table of the 10 most recent transactions (newest first)
function renderTable(sales) {
  if (sales.length === 0) {
    tableEl.innerHTML = '<p class="empty-cart">No transactions yet. ' +
                        '<a href="index.html">Start a new order</a>.</p>';
    return;
  }

  let rows = "";
  for (let i = sales.length - 1; i >= 0 && i >= sales.length - 10; i--) {
    const sale = sales[i];
    let qty = 0;
    for (const item of sale.items) qty += item.quantity;

    rows +=
      "<tr>" +
        "<td>" + sale.transactionNumber + "</td>" +
        "<td>" + sale.dateTime + "</td>" +
        '<td class="num">' + qty + "</td>" +
        '<td class="num">' + formatPeso(sale.total) + "</td>" +
        '<td class="num">' + formatPeso(sale.paid) + "</td>" +
        '<td class="num">' + formatPeso(sale.change) + "</td>" +
        '<td><button class="link-btn" data-index="' + i + '">View receipt</button></td>' +
      "</tr>";
  }

  tableEl.innerHTML =
    '<div class="table-wrap"><table class="tx-table">' +
      "<thead><tr><th>Transaction #</th><th>Date &amp; Time</th>" +
      '<th class="num">Items</th><th class="num">Total</th>' +
      '<th class="num">Paid</th><th class="num">Change</th><th></th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table></div>" +
    (sales.length > 10 ? '<p class="table-note">Showing the latest 10 of ' + sales.length + " transactions.</p>" : "");
}

// "View receipt": send that transaction to the receipt page
tableEl.addEventListener("click", function (event) {
  const btn = event.target.closest("button[data-index]");
  if (!btn) return;
  const sale = loadSales()[Number(btn.dataset.index)];
  if (!sale) return;
  try {
    sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(sale));
    window.location.href = "receipt.html";
  } catch (error) {
    alert("Could not open the receipt. Please allow browser storage and try again.");
  }
});

// "Reset Sales Data": delete all saved sales and restart numbering at TXN-0001
resetBtn.addEventListener("click", function () {
  if (!confirm("Delete all sales records and restart transaction numbers at TXN-0001?")) return;
  try {
    localStorage.removeItem(SALES_KEY);
    localStorage.removeItem(COUNTER_KEY);
  } catch (error) { /* ignore */ }
  showDashboard();
});

function showDashboard() {
  const sales = loadSales();
  renderStats(calculateStats(sales));
  renderTable(sales);
}

showDashboard();
