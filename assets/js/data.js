// ==================== DATA STORAGE ====================
// All application data is stored here

const AppData = {
    // User Account
    user: null,
    
    // Session Management
    session: {
        lastActivity: null,
        timeout: 30 * 60 * 1000 // 30 minutes
    },
    
    // Inventory Items
    inventory: [],
    
    // Sales Records
    sales: [],
    
    // Daily Sales (resets every 24 hours)
    dailySales: {
        date: new Date().toDateString(),
        total: 0,
        count: 0,
        profit: 0
    },
    
    // Expenses
    expenses: [],
    
    // Wallet
    wallet: {
        balance: 0,
        transactions: []
    },
    
    // Transaction History
    transactions: [],
    
    // Notifications
    notifications: [],
    
    // Settings
    settings: {
        theme: 'dark',
        currency: 'ZMW',
        businessName: 'My POS System',
        lowStockThreshold: 10,
        logo: null
    }
};

// ==================== HELPER FUNCTIONS ====================

// Save data to localStorage
function saveData() {
    localStorage.setItem('posSystemData', JSON.stringify(AppData));
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('posSystemData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        Object.assign(AppData, parsed);
        
        // Check if daily sales need to be reset
        checkAndResetDailySales();
    }
}

// Check and reset daily sales if it's a new day
function checkAndResetDailySales() {
    const today = new Date().toDateString();
    if (AppData.dailySales.date !== today) {
        AppData.dailySales = {
            date: today,
            total: 0,
            count: 0,
            profit: 0
        };
        saveData();
        
        // Add notification about new day
        addNotification({
            type: 'info',
            title: 'New Day Started',
            message: 'Daily sales have been reset for the new day'
        });
    }
}

// Initialize data on page load
loadData();

// Check if user account exists
function hasUserAccount() {
    return AppData.user !== null;
}

// Create user account
function createUserAccount(userData) {
    if (hasUserAccount()) {
        return { success: false, message: 'Account already exists' };
    }
    
    AppData.user = {
        id: generateId(),
        name: userData.name,
        email: userData.email,
        dateOfBirth: userData.dateOfBirth || null,
        password: userData.password,
        securityQuestion: userData.securityQuestion,
        securityAnswer: userData.securityAnswer.toLowerCase(),
        profilePicture: null,
        createdAt: new Date().toISOString(),
        sessions: []
    };
    
    saveData();
    return { success: true, message: 'Account created successfully' };
}

// Login user
function loginUser(email, password) {
    if (!AppData.user) {
        return { success: false, message: 'No account found' };
    }
    
    if (AppData.user.email === email && AppData.user.password === password) {
        // Create session
        const sessionId = generateId();
        const session = {
            id: sessionId,
            device: navigator.userAgent,
            location: 'Local Device',
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        if (!AppData.user.sessions) AppData.user.sessions = [];
        AppData.user.sessions.push(session);
        
        AppData.session.lastActivity = Date.now();
        localStorage.setItem('currentSession', sessionId);
        saveData();
        
        return { success: true, message: 'Login successful', user: AppData.user };
    }
    
    return { success: false, message: 'Invalid email or password' };
}

// Logout user
function logoutUser() {
    const sessionId = localStorage.getItem('currentSession');
    if (sessionId && AppData.user && AppData.user.sessions) {
        AppData.user.sessions = AppData.user.sessions.filter(s => s.id !== sessionId);
        saveData();
    }
    localStorage.removeItem('currentSession');
    AppData.session.lastActivity = null;
}

// Check if user is logged in (has valid session)
function isLoggedIn() {
    const sessionId = localStorage.getItem('currentSession');
    if (!sessionId || !AppData.user) {
        return false;
    }
    
    // Check if session exists in user's sessions
    if (AppData.user.sessions) {
        return AppData.user.sessions.some(s => s.id === sessionId);
    }
    
    return false;
}

// Check session timeout
function checkSessionTimeout() {
    if (!AppData.session.lastActivity) return false;
    
    const now = Date.now();
    const elapsed = now - AppData.session.lastActivity;
    
    if (elapsed > AppData.session.timeout) {
        logoutUser();
        return true;
    }
    
    return false;
}

// Update session activity
function updateSessionActivity() {
    AppData.session.lastActivity = Date.now();
    
    const sessionId = localStorage.getItem('currentSession');
    if (sessionId && AppData.user && AppData.user.sessions) {
        const session = AppData.user.sessions.find(s => s.id === sessionId);
        if (session) {
            session.lastActivity = new Date().toISOString();
            saveData();
        }
    }
}

// Delete account
function deleteAccount() {
    AppData.user = null;
    AppData.inventory = [];
    AppData.sales = [];
    AppData.expenses = [];
    AppData.wallet = { balance: 0, transactions: [] };
    AppData.transactions = [];
    AppData.notifications = [];
    localStorage.removeItem('currentSession');
    localStorage.removeItem('posSystemData');
    return { success: true, message: 'Account deleted successfully' };
}

// Erase all data
function eraseAllData() {
    AppData.inventory = [];
    AppData.sales = [];
    AppData.expenses = [];
    AppData.wallet = { balance: 0, transactions: [] };
    AppData.transactions = [];
    AppData.notifications = [];
    AppData.dailySales = {
        date: new Date().toDateString(),
        total: 0,
        count: 0,
        profit: 0
    };
    // Reset settings to defaults (but keep theme)
    const currentTheme = AppData.settings.theme;
    AppData.settings = {
        theme: currentTheme,
        currency: 'ZMW',
        businessName: 'My POS System',
        lowStockThreshold: 10,
        logo: null
    };
    saveData();
    return { success: true, message: 'All data erased successfully' };
}

// Reset password
function resetPassword(email, securityAnswer, newPassword) {
    if (!AppData.user || AppData.user.email !== email) {
        return { success: false, message: 'Account not found' };
    }
    
    if (AppData.user.securityAnswer !== securityAnswer.toLowerCase()) {
        return { success: false, message: 'Incorrect security answer' };
    }
    
    AppData.user.password = newPassword;
    saveData();
    return { success: true, message: 'Password reset successfully' };
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Format currency
function formatCurrency(amount) {
    const value = parseFloat(amount) || 0;
    return `ZMW ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Add inventory item
function addInventoryItem(item) {
    const buyingPricePerItem = parseFloat(item.buyingPrice);
    const sellingPricePerItem = parseFloat(item.sellingPrice);
    const quantity = parseInt(item.quantity);
    const profitPerItem = sellingPricePerItem - buyingPricePerItem;
    
    const newItem = {
        id: generateId(),
        name: item.name,
        quantity: quantity,
        buyingPrice: buyingPricePerItem,
        sellingPrice: sellingPricePerItem,
        profitPerItem: profitPerItem,
        netProfit: profitPerItem * quantity,
        addedAt: new Date().toISOString()
    };
    
    AppData.inventory.push(newItem);
    saveData();
    
    // Add notification for low stock if applicable
    if (newItem.quantity <= AppData.settings.lowStockThreshold) {
        addNotification({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${newItem.name} is low on stock (${newItem.quantity} remaining)`
        });
    }
    
    return { success: true, message: 'Item added successfully', item: newItem };
}

// Update inventory item
function updateInventoryItem(id, updates) {
    const index = AppData.inventory.findIndex(item => item.id === id);
    if (index === -1) {
        return { success: false, message: 'Item not found' };
    }
    
    Object.assign(AppData.inventory[index], updates);
    
    const buyingPrice = parseFloat(AppData.inventory[index].buyingPrice);
    const sellingPrice = parseFloat(AppData.inventory[index].sellingPrice);
    const quantity = parseInt(AppData.inventory[index].quantity);
    
    AppData.inventory[index].profitPerItem = sellingPrice - buyingPrice;
    AppData.inventory[index].netProfit = (sellingPrice - buyingPrice) * quantity;
    
    saveData();
    return { success: true, message: 'Item updated successfully' };
}

// Delete inventory item
function deleteInventoryItem(id) {
    const index = AppData.inventory.findIndex(item => item.id === id);
    if (index === -1) {
        return { success: false, message: 'Item not found' };
    }
    
    AppData.inventory.splice(index, 1);
    saveData();
    return { success: true, message: 'Item deleted successfully' };
}

// Record sale
function recordSale(saleItems) {
    const sale = {
        id: generateId(),
        items: saleItems,
        total: saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        profit: 0,
        date: new Date().toISOString()
    };
    
    // Update inventory and calculate profit
    saleItems.forEach(saleItem => {
        const inventoryItem = AppData.inventory.find(item => item.id === saleItem.id);
        if (inventoryItem) {
            inventoryItem.quantity -= saleItem.quantity;
            const itemProfit = (saleItem.price - inventoryItem.buyingPrice) * saleItem.quantity;
            sale.profit += itemProfit;
            
            // Recalculate netProfit after quantity change
            inventoryItem.netProfit = inventoryItem.profitPerItem * inventoryItem.quantity;
            
            // Remove item if quantity is 0
            if (inventoryItem.quantity <= 0) {
                deleteInventoryItem(inventoryItem.id);
            } else if (inventoryItem.quantity <= AppData.settings.lowStockThreshold) {
                addNotification({
                    type: 'warning',
                    title: 'Low Stock Alert',
                    message: `${inventoryItem.name} is low on stock (${inventoryItem.quantity} remaining)`
                });
            }
        }
    });
    
    AppData.sales.push(sale);
    
    // Update daily sales
    AppData.dailySales.total += sale.total;
    AppData.dailySales.count += 1;
    AppData.dailySales.profit += sale.profit;
    
    // Update wallet
    AppData.wallet.balance += sale.total;
    AppData.wallet.transactions.push({
        id: generateId(),
        type: 'sale',
        amount: sale.total,
        description: 'Sale transaction',
        date: new Date().toISOString()
    });
    
    // Add to transaction history
    AppData.transactions.push({
        id: sale.id,
        type: 'sale',
        amount: sale.total,
        profit: sale.profit,
        items: saleItems,
        date: sale.date
    });
    
    saveData();
    return { success: true, message: 'Sale recorded successfully', sale };
}

// Delete sale (returns stock)
function deleteSale(saleId) {
    const saleIndex = AppData.sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) {
        return { success: false, message: 'Sale not found' };
    }
    
    const sale = AppData.sales[saleIndex];
    
    // Return items to inventory
    sale.items.forEach(saleItem => {
        const inventoryItem = AppData.inventory.find(item => item.id === saleItem.id);
        if (inventoryItem) {
            inventoryItem.quantity += saleItem.quantity;
            // Recalculate netProfit after quantity change
            inventoryItem.netProfit = inventoryItem.profitPerItem * inventoryItem.quantity;
        } else {
            // Re-add item to inventory if it was deleted
            const buyingPrice = saleItem.buyingPrice || 0;
            const sellingPrice = saleItem.price;
            const profitPerItem = sellingPrice - buyingPrice;
            AppData.inventory.push({
                id: saleItem.id,
                name: saleItem.name,
                quantity: saleItem.quantity,
                buyingPrice: buyingPrice,
                sellingPrice: sellingPrice,
                profitPerItem: profitPerItem,
                netProfit: profitPerItem * saleItem.quantity,
                addedAt: new Date().toISOString()
            });
        }
    });
    
    // Update wallet
    AppData.wallet.balance -= sale.total;
    AppData.wallet.transactions.push({
        id: generateId(),
        type: 'refund',
        amount: -sale.total,
        description: 'Sale deletion refund',
        date: new Date().toISOString()
    });
    
    // Remove from sales and transactions
    AppData.sales.splice(saleIndex, 1);
    const transIndex = AppData.transactions.findIndex(t => t.id === saleId);
    if (transIndex !== -1) {
        AppData.transactions.splice(transIndex, 1);
    }
    
    saveData();
    return { success: true, message: 'Sale deleted and stock returned' };
}

// Add expense
function addExpense(expense) {
    const expenseAmount = parseFloat(expense.amount);
    
    // Check if wallet has sufficient balance
    if (AppData.wallet.balance < expenseAmount) {
        return { 
            success: false, 
            message: `Insufficient balance. Available: ${formatCurrency(AppData.wallet.balance)}` 
        };
    }
    
    const newExpense = {
        id: generateId(),
        item: expense.item,
        amount: expenseAmount,
        date: new Date().toISOString()
    };
    
    AppData.expenses.push(newExpense);
    
    // Update wallet
    AppData.wallet.balance -= newExpense.amount;
    AppData.wallet.transactions.push({
        id: generateId(),
        type: 'expense',
        amount: -newExpense.amount,
        description: expense.item,
        date: new Date().toISOString()
    });
    
    saveData();
    return { success: true, message: 'Expense added successfully', expense: newExpense };
}

// Delete expense
function deleteExpense(expenseId) {
    const expenseIndex = AppData.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) {
        return { success: false, message: 'Expense not found' };
    }
    
    const expense = AppData.expenses[expenseIndex];
    
    // Return amount to wallet
    AppData.wallet.balance += expense.amount;
    AppData.wallet.transactions.push({
        id: generateId(),
        type: 'refund',
        amount: expense.amount,
        description: `Expense deletion refund: ${expense.item}`,
        date: new Date().toISOString()
    });
    
    // Remove expense
    AppData.expenses.splice(expenseIndex, 1);
    
    saveData();
    return { success: true, message: 'Expense deleted and amount refunded' };
}

// Wallet operations
function topUpWallet(amount) {
    AppData.wallet.balance += parseFloat(amount);
    AppData.wallet.transactions.push({
        id: generateId(),
        type: 'topup',
        amount: parseFloat(amount),
        description: 'Wallet top-up',
        date: new Date().toISOString()
    });
    saveData();
    return { success: true, message: 'Wallet topped up successfully' };
}

function withdrawFromWallet(amount) {
    const withdrawAmount = parseFloat(amount);
    if (AppData.wallet.balance < withdrawAmount) {
        return { success: false, message: 'Insufficient balance' };
    }
    
    AppData.wallet.balance -= withdrawAmount;
    AppData.wallet.transactions.push({
        id: generateId(),
        type: 'withdrawal',
        amount: -withdrawAmount,
        description: 'Wallet withdrawal',
        date: new Date().toISOString()
    });
    saveData();
    return { success: true, message: 'Withdrawal successful' };
}

// Add notification
function addNotification(notification) {
    const newNotification = {
        id: generateId(),
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        read: false,
        date: new Date().toISOString()
    };
    
    AppData.notifications.unshift(newNotification);
    saveData();
}

// Mark notification as read
function markNotificationRead(id) {
    const notification = AppData.notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        saveData();
    }
}

// Get low stock items
function getLowStockItems() {
    return AppData.inventory.filter(item => item.quantity <= AppData.settings.lowStockThreshold);
}

// Get dashboard stats
function getDashboardStats() {
    const totalInventoryValue = AppData.inventory.reduce((sum, item) => 
        sum + (item.sellingPrice * item.quantity), 0);
    
    const totalProfit = AppData.sales.reduce((sum, sale) => sum + sale.profit, 0);
    
    const totalExpenses = AppData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
        totalInventoryValue,
        totalSales: AppData.sales.length,
        totalProfit,
        totalExpenses,
        walletBalance: AppData.wallet.balance,
        lowStockCount: AppData.inventory.filter(item => item.quantity <= AppData.settings.lowStockThreshold).length,
        dailySales: AppData.dailySales
    };
}
