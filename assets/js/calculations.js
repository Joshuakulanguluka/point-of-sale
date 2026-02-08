// ==================== CALCULATIONS ====================
// Auto-calculation utilities for the POS system

function calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateProfit(items) {
    return items.reduce((sum, item) => {
        const profit = (item.price - item.buyingPrice) * item.quantity;
        return sum + profit;
    }, 0);
}

function calculateTax(amount, taxRate = 0) {
    return amount * (taxRate / 100);
}

function calculateDiscount(amount, discountRate = 0) {
    return amount * (discountRate / 100);
}

function calculateNetAmount(subtotal, tax = 0, discount = 0) {
    return subtotal + tax - discount;
}

// Inventory calculations
function calculateInventoryValue(inventory) {
    return inventory.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
}

function calculatePotentialProfit(inventory) {
    return inventory.reduce((sum, item) => {
        const profit = (item.sellingPrice - item.buyingPrice) * item.quantity;
        return sum + profit;
    }, 0);
}

// Sales analytics
function calculateAverageOrderValue(sales) {
    if (sales.length === 0) return 0;
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    return total / sales.length;
}

function calculateDailySales(sales, date = new Date()) {
    const targetDate = date.toDateString();
    return sales.filter(sale => new Date(sale.date).toDateString() === targetDate);
}

function calculateMonthlySales(sales, month = new Date().getMonth(), year = new Date().getFullYear()) {
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });
}

// Expense analytics
function calculateDailyExpenses(expenses, date = new Date()) {
    const targetDate = date.toDateString();
    return expenses
        .filter(expense => new Date(expense.date).toDateString() === targetDate)
        .reduce((sum, expense) => sum + expense.amount, 0);
}

function calculateMonthlyExpenses(expenses, month = new Date().getMonth(), year = new Date().getFullYear()) {
    return expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
}

// Profit calculations
function calculateNetProfit(sales, expenses) {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCost = sales.reduce((sum, sale) => sum + (sale.total - sale.profit), 0);
    return totalRevenue - totalCost - totalExpenses;
}

function calculateGrossProfit(sales) {
    return sales.reduce((sum, sale) => sum + sale.profit, 0);
}

// Stock alerts
function getLowStockItems(inventory, threshold) {
    return inventory.filter(item => item.quantity <= threshold);
}

function getOutOfStockItems(inventory) {
    return inventory.filter(item => item.quantity === 0);
}

// Performance metrics
function calculateSalesGrowth(currentPeriodSales, previousPeriodSales) {
    if (previousPeriodSales === 0) return 0;
    return ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100;
}

function calculateProfitMargin(profit, revenue) {
    if (revenue === 0) return 0;
    return (profit / revenue) * 100;
}

// Validation helpers
function validatePrice(price) {
    return !isNaN(price) && parseFloat(price) >= 0;
}

function validateQuantity(quantity) {
    return !isNaN(quantity) && parseInt(quantity) > 0;
}

function validateStock(requestedQuantity, availableStock) {
    return parseInt(requestedQuantity) <= parseInt(availableStock);
}
