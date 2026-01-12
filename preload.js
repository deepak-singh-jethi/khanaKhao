const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // 1. Menu Functions
    getMenuItems: () => ipcRenderer.invoke('get-menu-items'),
    addMenuItem: (item) => ipcRenderer.invoke('add-menu-item', item),
    updateMenuItem: (item) => ipcRenderer.invoke('update-menu-item', item),

    // 2. Order Functions
    saveOrder: (order) => ipcRenderer.invoke('save-order', order),
    
    // 3. System Test
    testConnection: () => console.log("Bridge is active!"),
    getSalesReport: () => ipcRenderer.invoke('get-sales-report'),
});