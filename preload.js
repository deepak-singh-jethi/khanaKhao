const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // 1. Menu Functions
    getMenuItems: () => ipcRenderer.invoke('get-menu-items'),
    addMenuItem: (item) => ipcRenderer.invoke('add-menu-item', item),

    // 2. Order Functions (We will use these later)
    saveOrder: (order) => ipcRenderer.invoke('save-order', order),
    
    // 3. System Test
    testConnection: () => console.log("Bridge is active!"),
    getSalesReport: () => ipcRenderer.invoke('get-sales-report'),
});