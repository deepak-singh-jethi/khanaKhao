const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// 1. Decide where to save the database file
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

        // --- MIGRATION: ensure 'enabled' column exists ---
        db.all("PRAGMA table_info(menu_items);", [], (err, cols) => {
            if (err) {
                console.error("Failed reading menu_items schema:", err);
                return;
            }
            const names = cols.map(c => c.name);
            if (!names.includes('enabled')) {
                // Add enabled column with default 1 (true)
                db.run("ALTER TABLE menu_items ADD COLUMN enabled INTEGER DEFAULT 1", (err) => {
                    if (err) console.error("Failed adding enabled column:", err);
                    else console.log("Added enabled column to menu_items.");
                });
            }
        });

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

module.exports = db;