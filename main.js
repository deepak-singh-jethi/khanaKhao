const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db/database'); 

function createWindow() {
    const win = new BrowserWindow({
        width: 1280, height: 800,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true }
    });
    win.loadFile(path.join(__dirname, 'src', 'index.html'));
    win.webContents.openDevTools(); 
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// --- DATABASE LISTENERS ---

// 1. Get Items
ipcMain.handle('get-menu-items', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM menu_items ORDER BY id DESC", [], (err, rows) => { 
            if (err) reject(err); else resolve(rows);
        });
    });
});

// 2. Add Item (Removed Portions)
ipcMain.handle('add-menu-item', async (event, item) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO menu_items (name, price, category, type, enabled) VALUES (?, ?, ?, ?, 1)";
        db.run(sql, [item.name, item.price, item.category, item.type], function(err) {
            if (err) reject(err); else resolve({ id: this.lastID, ...item });
        });
    });
});

// 3. Update Item (Removed Portions)
ipcMain.handle('update-menu-item', async (event, item) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE menu_items SET name = ?, price = ?, category = ?, type = ?, enabled = ? WHERE id = ?";
    db.run(sql, [item.name, item.price, item.category, item.type, item.enabled, item.id], function(err) {
      if (err) reject(err); else resolve({ success: true });
    });
  });
});

// 4. Delete Item
ipcMain.handle('delete-menu-item', async (event, id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM menu_items WHERE id = ?", [id], function(err) {
            if (err) reject(err); else resolve({ success: true });
        });
    });
});

// 5. Get Sales Report
ipcMain.handle('get-sales-report', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
});