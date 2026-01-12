let cart = [];
let total = 0;

// 1. When App Starts: Load Menu from Database
document.addEventListener('DOMContentLoaded', async () => {
    loadMenuFromDB();
});

// 2. Fetch Menu from Real Database
async function loadMenuFromDB() {
    const menuContainer = document.getElementById('menu-grid');
    menuContainer.innerHTML = 'Loading...'; // Show loading text

    // ASK THE DATABASE FOR ITEMS
    const products = await window.api.getMenuItems();

    menuContainer.innerHTML = ''; // Clear loading text

    if (products.length === 0) {
        menuContainer.innerHTML = '<p>No items found. Add some above!</p>';
        return;
    }

    // Create buttons for each real item
    products.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-price">₹ ${item.price.toFixed(2)}</div>
        `;
        div.onclick = () => addToCart(item);
        menuContainer.appendChild(div);
    });
}

// 3. Manager: Add New Item to Database
async function addNewItem() {
    const nameInput = document.getElementById('new-item-name');
    const priceInput = document.getElementById('new-item-price');

    const name = nameInput.value;
    const price = parseFloat(priceInput.value);

    if (!name || !price) {
        alert("Please enter both Name and Price");
        return;
    }

    // SEND TO DATABASE
    await window.api.addMenuItem({
        name: name,
        price: price,
        category: "General"
    });

    // Clear inputs and reload the menu
    nameInput.value = '';
    priceInput.value = '';
    loadMenuFromDB(); // Refresh the screen!
}

// 4. Billing Logic (Same as before)
function addToCart(item) {
    cart.push(item);
    updateBillUI();
}

function updateBillUI() {
    const billItemsDiv = document.getElementById('bill-items');
    const totalSpan = document.getElementById('total-amount');

    billItemsDiv.innerHTML = '';
    total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const row = document.createElement('div');
        row.className = 'bill-row';
        row.innerHTML = `
            <span>${item.name}</span>
            <span>₹ ${item.price.toFixed(2)}</span>
            <span style="color:red; cursor:pointer; margin-left:10px;" 
                  onclick="removeFromCart(${index})">✖</span>
        `;
        billItemsDiv.appendChild(row);
    });

    totalSpan.innerText = total.toFixed(2);
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateBillUI();
};
// 5. PRINT & SAVE BUTTON LOGIC (FINAL)
const printBtn = document.getElementById('print-btn');

printBtn.addEventListener('click', async () => {
    
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    // A. LOCK BUTTON
    printBtn.disabled = true;
    printBtn.innerText = "Printing...";
    printBtn.style.background = "#9ca3af";

    const orderData = {
        total: total,
        items: cart
    };

    try {
        // 1. Save to Database
        const result = await window.api.saveOrder(orderData);
        
        if (result.success) {
            
            // 2. FILL RECEIPT DATA (The visual ticket)
            document.getElementById('receipt-bill-no').innerText = result.orderId;
            document.getElementById('receipt-date').innerText = new Date().toLocaleString();
            document.getElementById('receipt-total').innerText = total.toFixed(2);
            
            const receiptBody = document.getElementById('receipt-items');
            receiptBody.innerHTML = '';
            
            cart.forEach(item => {
                receiptBody.innerHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td style="text-align:right">1</td>
                        <td style="text-align:right">${item.price.toFixed(2)}</td>
                    </tr>
                `;
            });

            // 3. TRIGGER PRINTER
            // This opens the system print dialog. 
            // The CSS we added ensures ONLY the receipt is shown.
            window.print();

            // 4. AFTER PRINTING IS DONE (Or Cancelled)
            cart = [];
            updateBillUI();
            document.getElementById('bill-no').innerText = result.orderId + 1;
        }
    } catch (error) {
        console.error("Failed to save:", error);
        alert("Error saving order");
    } finally {
        // B. UNLOCK BUTTON
        printBtn.disabled = false;
        printBtn.innerText = "PRINT BILL & SAVE";
        printBtn.style.background = "#2563eb";
    }
});

// --- REPORT FUNCTIONS ---

// 1. Show the Report Screen
window.showReports = async () => {
    const modal = document.getElementById('report-modal');
    modal.style.display = 'block';
    
    // Load Data
    const salesData = await window.api.getSalesReport();
    renderReport(salesData);
};

// 2. Hide the Report Screen
window.closeReports = () => {
    document.getElementById('report-modal').style.display = 'none';
};

// 3. Render the Data
function renderReport(data) {
    const tableBody = document.getElementById('report-table-body');
    const totalSpan = document.getElementById('report-total');
    const countSpan = document.getElementById('report-count');

    tableBody.innerHTML = '';
    let grandTotal = 0;

    data.forEach(order => {
        grandTotal += order.total_amount;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:10px; border-bottom:1px solid #eee;">#${order.id}</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${new Date(order.created_at).toLocaleString()}</td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">₹ ${order.total_amount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });

    totalSpan.innerText = grandTotal.toFixed(2);
    countSpan.innerText = data.length;
}