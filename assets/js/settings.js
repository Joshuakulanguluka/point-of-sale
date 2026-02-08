// ==================== SETTINGS MANAGEMENT ====================
// Additional settings and configuration utilities

// Update business settings
function updateBusinessSettings(settings) {
    Object.assign(AppData.settings, settings);
    saveData();
    return { success: true, message: 'Settings updated successfully' };
}

// Get current settings
function getSettings() {
    return { ...AppData.settings };
}

// Reset settings to default
function resetSettings() {
    AppData.settings = {
        theme: 'dark',
        currency: 'ZMW',
        businessName: 'My POS System',
        lowStockThreshold: 10,
        logo: null
    };
    saveData();
    return { success: true, message: 'Settings reset to default' };
}

// Update theme
function updateTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
        return { success: false, message: 'Invalid theme' };
    }
    
    AppData.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    saveData();
    
    return { success: true, message: 'Theme updated successfully' };
}

// Update low stock threshold
function updateLowStockThreshold(threshold) {
    const value = parseInt(threshold);
    if (isNaN(value) || value < 1) {
        return { success: false, message: 'Invalid threshold value' };
    }
    
    AppData.settings.lowStockThreshold = value;
    saveData();
    
    // Check for new low stock items
    const lowStockItems = getLowStockItems(AppData.inventory, value);
    if (lowStockItems.length > 0) {
        lowStockItems.forEach(item => {
            addNotification({
                type: 'warning',
                title: 'Low Stock Alert',
                message: `${item.name} is low on stock (${item.quantity} remaining)`
            });
        });
    }
    
    return { success: true, message: 'Threshold updated successfully' };
}

// Update business name
function updateBusinessName(name) {
    if (!name || name.trim() === '') {
        return { success: false, message: 'Business name cannot be empty' };
    }
    
    AppData.settings.businessName = name.trim();
    saveData();
    
    return { success: true, message: 'Business name updated successfully' };
}

// Export data (for backup)
function exportData() {
    const dataStr = JSON.stringify(AppData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    return { success: true, message: 'Data exported successfully' };
}

// Import data (restore from backup)
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // Validate data structure
        if (!data.user || !data.inventory || !data.sales || !data.expenses || !data.wallet) {
            return { success: false, message: 'Invalid backup file format' };
        }
        
        // Restore data
        Object.assign(AppData, data);
        saveData();
        
        return { success: true, message: 'Data imported successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to import data: ' + error.message };
    }
}

// Clear all data (factory reset)
function clearAllData() {
    if (!confirm('This will delete ALL data including your account. This cannot be undone. Continue?')) {
        return { success: false, message: 'Operation cancelled' };
    }
    
    localStorage.removeItem('posSystemData');
    
    // Reset AppData
    AppData.user = null;
    AppData.inventory = [];
    AppData.sales = [];
    AppData.dailySales = {
        date: new Date().toDateString(),
        total: 0,
        count: 0,
        profit: 0
    };
    AppData.expenses = [];
    AppData.wallet = {
        balance: 0,
        transactions: []
    };
    AppData.transactions = [];
    AppData.notifications = [];
    AppData.settings = {
        theme: 'dark',
        currency: 'ZMW',
        businessName: 'My POS System',
        lowStockThreshold: 10,
        logo: null
    };
    
    return { success: true, message: 'All data cleared successfully' };
}

// Get system statistics
function getSystemStats() {
    return {
        totalUsers: AppData.user ? 1 : 0,
        totalProducts: AppData.inventory.length,
        totalSales: AppData.sales.length,
        totalExpenses: AppData.expenses.length,
        totalTransactions: AppData.transactions.length,
        totalNotifications: AppData.notifications.length,
        unreadNotifications: AppData.notifications.filter(n => !n.read).length,
        lowStockItems: getLowStockItems(AppData.inventory, AppData.settings.lowStockThreshold).length,
        outOfStockItems: getOutOfStockItems(AppData.inventory).length,
        walletBalance: AppData.wallet.balance,
        dataSize: new Blob([JSON.stringify(AppData)]).size
    };
}

// Check system health
function checkSystemHealth() {
    const issues = [];
    
    // Check for low stock items
    const lowStock = getLowStockItems(AppData.inventory, AppData.settings.lowStockThreshold);
    if (lowStock.length > 0) {
        issues.push({
            type: 'warning',
            message: `${lowStock.length} item(s) are low on stock`
        });
    }
    
    // Check for out of stock items
    const outOfStock = getOutOfStockItems(AppData.inventory);
    if (outOfStock.length > 0) {
        issues.push({
            type: 'error',
            message: `${outOfStock.length} item(s) are out of stock`
        });
    }
    
    // Check wallet balance
    if (AppData.wallet.balance < 0) {
        issues.push({
            type: 'error',
            message: 'Wallet balance is negative'
        });
    }
    
    // Check for unread notifications
    const unread = AppData.notifications.filter(n => !n.read).length;
    if (unread > 10) {
        issues.push({
            type: 'info',
            message: `You have ${unread} unread notifications`
        });
    }
    
    return {
        healthy: issues.filter(i => i.type === 'error').length === 0,
        issues: issues
    };
}
