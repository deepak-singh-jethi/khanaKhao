const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db/database'); 

function createWindow() {
    // 1. Create the browser window.
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // 2. Load the index.html file (UPDATED LINE)
    // This forces the computer to find the absolute path to the file
    win.loadFile(path.join(__dirname, 'src', 'index.html'));

    // 3. Open Developer Tools (TEMPORARY: Helps us see errors)
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- DATABASE LISTENERS ---

// 1. Get all menu items
ipcMain.handle('get-menu-items', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM menu_items", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

// 2. Add a new menu item
ipcMain.handle('add-menu-item', async (event, item) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)";
        db.run(sql, [item.name, item.price, item.category], function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, ...item });
        });
    });
});
// 3. Save a new Order
ipcMain.handle('save-order', async (event, orderData) => {
    return new Promise((resolve, reject) => {
        // orderData comes from the screen: { total: 200.00, items: [...] }
        
        db.serialize(() => { // This ensures we run these one by one
            
            // A. Create the Order Entry (The Bill Header)
            db.run("INSERT INTO orders (total_amount, payment_mode) VALUES (?, ?)", 
                [orderData.total, 'CASH'], // We default to CASH for now
                function(err) {
                    if (err) return reject(err);

                    const orderId = this.lastID; // We need this ID to link the items!

                    // B. Save the details (The List of Items)
                    const stmt = db.prepare("INSERT INTO order_items (order_id, item_name, price, quantity) VALUES (?, ?, ?, ?)");
                    
                    orderData.items.forEach(item => {
                        // 1 means quantity is 1 for now
                        stmt.run(orderId, item.name, item.price, 1); 
                    });

                    stmt.finalize();
                    resolve({ success: true, orderId: orderId });
                }
            );
        });
    });
});
// 4. Get Sales Report
ipcMain.handle('get-sales-report', async () => {
    return new Promise((resolve, reject) => {
        // Get all orders, newest first
        db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});