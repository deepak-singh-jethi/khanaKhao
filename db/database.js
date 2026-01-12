const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// 1. Decide where to save the database file
// We save it in the User Data folder so it persists even if you move the app
const dbPath = path.join(app.getPath('userData'), 'pos.db');

// 2. Open the connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        initTables();
    }
});

// 3. Function to create tables
function initTables() {
    db.serialize(() => {
        // Table 1: Menu Items
        db.run(`CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT
        )`);

        // Table 2: Orders (The Bill Head)
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_amount REAL NOT NULL,
            payment_mode TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Table 3: Order Items (The Bill Details)
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            item_name TEXT,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )`);
        
        console.log('All database tables are ready.');
    });
}

// 4. Export the db connection so other files can use it
module.exports = db;