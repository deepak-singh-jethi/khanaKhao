const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else {
        console.log('Connected to SQLite at:', dbPath);
        initTables();
    }
});

function initTables() {
    db.serialize(() => {
        // 1. Basic Tables (Removed 'portions')
        db.run(`CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT,
            enabled INTEGER DEFAULT 1,
            type TEXT DEFAULT 'veg', 
            price_half REAL DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_amount REAL NOT NULL,
            payment_mode TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            item_name TEXT,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )`);

        // 2. MIGRATION: Removed 'portions' from list
        const columnsToAdd = [
            { name: 'enabled', type: 'INTEGER DEFAULT 1' },
            { name: 'type', type: "TEXT DEFAULT 'veg'" },
            { name: 'price_half', type: 'REAL DEFAULT 0' }
        ];

        db.all("PRAGMA table_info(menu_items);", [], (err, existingCols) => {
            if (err) return;
            const existingNames = existingCols.map(c => c.name);
            
            columnsToAdd.forEach(col => {
                if (!existingNames.includes(col.name)) {
                    db.run(`ALTER TABLE menu_items ADD COLUMN ${col.name} ${col.type}`, (err) => {
                        if (!err) console.log(`Migrated: Added ${col.name}`);
                    });
                }
            });
        });

        console.log('Database tables ready.');
    });
}

module.exports = db;