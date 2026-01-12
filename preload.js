const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getMenuItems: () => ipcRenderer.invoke('get-menu-items'),
    addMenuItem: (item) => ipcRenderer.invoke('add-menu-item', item),
    updateMenuItem: (item) => ipcRenderer.invoke('update-menu-item', item),
    deleteMenuItem: (id) => ipcRenderer.invoke('delete-menu-item', id), // <--- NEW

    saveOrder: (order) => ipcRenderer.invoke('save-order', order),
    getSalesReport: () => ipcRenderer.invoke('get-sales-report'),
});