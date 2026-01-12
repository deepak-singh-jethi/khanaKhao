// --- GLOBAL STATE ---
let editingItemId = null;
let allMenuItems = []; 

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    navigateTo('manager-screen'); 
    switchManagerTab('menu');
    await loadMenuFromDB();
});

// --- NAVIGATION ---
function navigateTo(screenId) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const navId = 'nav-' + screenId.replace('-screen', '');
    const btn = document.getElementById(navId);
    if(btn) btn.classList.add('active');

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

window.showManager = () => navigateTo('manager-screen');
window.showBilling = () => navigateTo('billing-screen');

window.switchManagerTab = (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-tab-${tabName}`);
    if(activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeContent = document.getElementById(`manager-tab-${tabName}`);
    if(activeContent) activeContent.classList.add('active');
};

// --- FORM HANDLING ---
window.submitAddOrUpdate = async () => {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const category = document.getElementById('new-item-category').value.trim();
    const typeVal = document.querySelector('input[name="item-type"]:checked').value;

    if (!name || isNaN(price) || price < 0) {
        alert("Name and Base Price are required.");
        return;
    }

    const btn = document.getElementById('add-item-btn');
    btn.disabled = true; btn.innerText = "Saving...";

    try {
        const itemData = {
            name, price, category, type: typeVal
        };

        if (editingItemId) {
            await window.api.updateMenuItem({ id: editingItemId, ...itemData, enabled: 1 });
        } else {
            await window.api.addMenuItem(itemData);
        }
        
        window.cancelEdit(); 
        await loadMenuFromDB();
        
    } catch (err) {
        alert("Error saving: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Item";
    }
};

window.startEdit = (id) => {
    const item = allMenuItems.find(p => p.id === id);
    if (!item) return;

    editingItemId = item.id;
    document.getElementById('new-item-name').value = item.name;
    document.getElementById('new-item-price').value = item.price;
    document.getElementById('new-item-category').value = item.category || '';
    
    const typeRadio = document.querySelector(`input[name="item-type"][value="${item.type}"]`);
    if(typeRadio) typeRadio.checked = true;

    document.getElementById('add-item-btn').innerText = 'Update Item';
    document.getElementById('new-item-name').focus();
    
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEdit = () => {
    editingItemId = null;
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-category').value = '';
    document.querySelector('input[name="item-type"][value="veg"]').checked = true;
    
    document.getElementById('add-item-btn').innerText = 'Save Item';
};

// --- GRID ---
async function loadMenuFromDB() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    try {
        allMenuItems = await window.api.getMenuItems();
        
        grid.innerHTML = '';
        if (allMenuItems.length === 0) {
            grid.innerHTML = '<div class="empty-state">Menu is empty. Add items!</div>';
            return;
        }

        allMenuItems.forEach(item => renderItemCard(item, grid));
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<div class="empty-state" style="color:red">Failed to load data.</div>';
    }
}

function renderItemCard(item, container) {
    const isEnabled = item.enabled !== 0;
    let typeIcon = item.type === 'non-veg' ? '🔴' : (item.type === 'egg' ? '🟡' : '🟢');
    
    const priceHtml = `<div class="price-line base">Price: ₹${item.price.toFixed(2)}</div>`;
    
    const card = document.createElement('div');
    card.className = `menu-item-card ${isEnabled ? '' : 'disabled'}`;
    card.innerHTML = `
        <div class="card-content">
            <div class="item-header">
                <div class="item-title">${item.name}</div>
                <div title="${item.type}">${typeIcon}</div>
            </div>
            <div class="item-cat">${item.category || 'General'}</div>
            <div class="item-pricing">${priceHtml}</div>
        </div>
        <div class="card-actions">
            <button class="action-btn" onclick="toggleItemEnable(${item.id}, ${!isEnabled})">
                <span>${isEnabled ? 'Disable' : 'Enable'}</span>
            </button>
            <button class="action-btn" onclick="startEdit(${item.id})">
                 <span>✏️ Edit</span>
            </button>
            <button class="action-btn delete" onclick="deleteItem(${item.id})">
                 <span>🗑️ Delete</span>
            </button>
        </div>
    `;
    container.appendChild(card);
}

window.deleteItem = async (id) => {
    if (confirm("Delete this item permanently?")) {
        await window.api.deleteMenuItem(id);
        await loadMenuFromDB();
    }
};

window.toggleItemEnable = async (id, newStatus) => {
    const item = allMenuItems.find(p => p.id === id);
    if(item) {
        await window.api.updateMenuItem({ ...item, enabled: newStatus ? 1 : 0 });
        await loadMenuFromDB();
    }
};