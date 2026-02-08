-- ==================== POS SYSTEM DATABASE SCHEMA ====================
-- This SQL schema represents the data structure used in the POS system
-- Currently, the system uses localStorage, but this schema can be used
-- for future database migration or as documentation

-- Database: pos_system
-- Currency: ZMW (Zambian Kwacha)
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE,
    password VARCHAR(255) NOT NULL,
    security_question VARCHAR(50) NOT NULL,
    security_answer VARCHAR(255) NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== USER SESSIONS TABLE ====================
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    device TEXT,
    location VARCHAR(255),
    login_time TIMESTAMP NOT NULL,
    last_activity TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INVENTORY TABLE ====================
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    buying_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    profit_per_item DECIMAL(10, 2) GENERATED ALWAYS AS (selling_price - buying_price) STORED,
    net_profit DECIMAL(10, 2) GENERATED ALWAYS AS ((selling_price - buying_price) * quantity) STORED,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_quantity (quantity),
    CHECK (quantity >= 0),
    CHECK (buying_price >= 0),
    CHECK (selling_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SALES TABLE ====================
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    total DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SALE ITEMS TABLE ====================
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    buying_price DECIMAL(10, 2) NOT NULL,
    item_total DECIMAL(10, 2) GENERATED ALWAYS AS (price * quantity) STORED,
    item_profit DECIMAL(10, 2) GENERATED ALWAYS AS ((price - buying_price) * quantity) STORED,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    INDEX idx_sale_id (sale_id),
    INDEX idx_product_id (product_id),
    CHECK (quantity > 0),
    CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== DAILY SALES TABLE ====================
CREATE TABLE IF NOT EXISTS daily_sales (
    date DATE PRIMARY KEY,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    count INT NOT NULL DEFAULT 0,
    profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== EXPENSES TABLE ====================
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_item (item),
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== WALLET TABLE ====================
CREATE TABLE IF NOT EXISTS wallet (
    id INT PRIMARY KEY DEFAULT 1,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default wallet record
INSERT INTO wallet (id, balance) VALUES (1, 0) ON DUPLICATE KEY UPDATE balance = balance;

-- ==================== WALLET TRANSACTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('sale', 'expense', 'topup', 'withdrawal', 'refund') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TRANSACTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('sale') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_date (date),
    CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TRANSACTION ITEMS TABLE ====================
CREATE TABLE IF NOT EXISTS transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    buying_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    theme ENUM('light', 'dark') NOT NULL DEFAULT 'dark',
    currency VARCHAR(10) NOT NULL DEFAULT 'ZMW',
    business_name VARCHAR(255) NOT NULL DEFAULT 'My POS System',
    low_stock_threshold INT NOT NULL DEFAULT 10,
    logo TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (id = 1),
    CHECK (low_stock_threshold > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (id, theme, currency, business_name, low_stock_threshold) 
VALUES (1, 'dark', 'ZMW', 'My POS System', 10) 
ON DUPLICATE KEY UPDATE theme = theme;

-- ==================== VIEWS ====================

-- View: Current Inventory with Stock Status
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT 
    i.id,
    i.name,
    i.quantity,
    i.buying_price,
    i.selling_price,
    i.profit_per_item,
    i.net_profit,
    i.added_at,
    CASE 
        WHEN i.quantity = 0 THEN 'Out of Stock'
        WHEN i.quantity <= s.low_stock_threshold THEN 'Low Stock'
        ELSE 'In Stock'
    END AS stock_status
FROM inventory i
CROSS JOIN settings s
WHERE s.id = 1;

-- View: Sales Summary
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT 
    DATE(s.date) AS sale_date,
    COUNT(s.id) AS total_transactions,
    SUM(s.total) AS total_revenue,
    SUM(s.profit) AS total_profit,
    AVG(s.total) AS average_order_value
FROM sales s
GROUP BY DATE(s.date)
ORDER BY sale_date DESC;

-- View: Top Selling Products
CREATE OR REPLACE VIEW v_top_products AS
SELECT 
    si.product_name,
    SUM(si.quantity) AS total_sold,
    SUM(si.item_total) AS total_revenue,
    SUM(si.item_profit) AS total_profit,
    COUNT(DISTINCT si.sale_id) AS number_of_sales
FROM sale_items si
GROUP BY si.product_name
ORDER BY total_sold DESC;

-- View: Monthly Performance
CREATE OR REPLACE VIEW v_monthly_performance AS
SELECT 
    DATE_FORMAT(s.date, '%Y-%m') AS month,
    COUNT(s.id) AS total_sales,
    SUM(s.total) AS total_revenue,
    SUM(s.profit) AS total_profit,
    (SELECT SUM(e.amount) 
     FROM expenses e 
     WHERE DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(s.date, '%Y-%m')) AS total_expenses,
    SUM(s.profit) - COALESCE((SELECT SUM(e.amount) 
                              FROM expenses e 
                              WHERE DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(s.date, '%Y-%m')), 0) AS net_profit
FROM sales s
GROUP BY DATE_FORMAT(s.date, '%Y-%m')
ORDER BY month DESC;

-- ==================== STORED PROCEDURES ====================

-- Procedure: Record a Sale
DELIMITER //
CREATE PROCEDURE sp_record_sale(
    IN p_sale_id VARCHAR(50),
    IN p_items JSON,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_total DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_profit DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_item_count INT;
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_product_id VARCHAR(50);
    DECLARE v_product_name VARCHAR(255);
    DECLARE v_quantity INT;
    DECLARE v_price DECIMAL(10, 2);
    DECLARE v_buying_price DECIMAL(10, 2);
    DECLARE v_available_qty INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Error recording sale';
    END;
    
    START TRANSACTION;
    
    -- Get item count
    SET v_item_count = JSON_LENGTH(p_items);
    
    -- Process each item
    WHILE v_index < v_item_count DO
        SET v_product_id = JSON_UNQUOTE(JSON_EXTRACT(p_items, CONCAT('$[', v_index, '].id')));
        SET v_product_name = JSON_UNQUOTE(JSON_EXTRACT(p_items, CONCAT('$[', v_index, '].name')));
        SET v_quantity = JSON_EXTRACT(p_items, CONCAT('$[', v_index, '].quantity'));
        SET v_price = JSON_EXTRACT(p_items, CONCAT('$[', v_index, '].price'));
        SET v_buying_price = JSON_EXTRACT(p_items, CONCAT('$[', v_index, '].buyingPrice'));
        
        -- Check stock availability
        SELECT quantity INTO v_available_qty FROM inventory WHERE id = v_product_id;
        
        IF v_available_qty < v_quantity THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('Insufficient stock for ', v_product_name);
            ROLLBACK;
            LEAVE;
        END IF;
        
        -- Update inventory
        UPDATE inventory 
        SET quantity = quantity - v_quantity 
        WHERE id = v_product_id;
        
        -- Insert sale item
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, buying_price)
        VALUES (p_sale_id, v_product_id, v_product_name, v_quantity, v_price, v_buying_price);
        
        -- Calculate totals
        SET v_total = v_total + (v_price * v_quantity);
        SET v_profit = v_profit + ((v_price - v_buying_price) * v_quantity);
        
        SET v_index = v_index + 1;
    END WHILE;
    
    -- Insert sale record
    INSERT INTO sales (id, total, profit, date)
    VALUES (p_sale_id, v_total, v_profit, NOW());
    
    -- Update wallet
    UPDATE wallet SET balance = balance + v_total WHERE id = 1;
    
    -- Insert wallet transaction
    INSERT INTO wallet_transactions (id, type, amount, description, date)
    VALUES (UUID(), 'sale', v_total, 'Sale transaction', NOW());
    
    -- Update daily sales
    INSERT INTO daily_sales (date, total, count, profit)
    VALUES (CURDATE(), v_total, 1, v_profit)
    ON DUPLICATE KEY UPDATE 
        total = total + v_total,
        count = count + 1,
        profit = profit + v_profit;
    
    COMMIT;
    SET p_success = TRUE;
    SET p_message = 'Sale recorded successfully';
END //
DELIMITER ;

-- ==================== TRIGGERS ====================

-- Trigger: Update inventory net_profit after quantity change
DELIMITER //
CREATE TRIGGER trg_inventory_after_update
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
    -- Check for low stock
    IF NEW.quantity <= (SELECT low_stock_threshold FROM settings WHERE id = 1) 
       AND NEW.quantity > 0 THEN
        INSERT INTO notifications (id, type, title, message, date)
        VALUES (UUID(), 'warning', 'Low Stock Alert', 
                CONCAT(NEW.name, ' is low on stock (', NEW.quantity, ' remaining)'), NOW());
    END IF;
    
    -- Check for out of stock
    IF NEW.quantity = 0 THEN
        INSERT INTO notifications (id, type, title, message, date)
        VALUES (UUID(), 'error', 'Out of Stock', 
                CONCAT(NEW.name, ' is out of stock'), NOW());
    END IF;
END //
DELIMITER ;

-- Trigger: Delete inventory item if quantity is 0 after sale
DELIMITER //
CREATE TRIGGER trg_inventory_delete_zero_stock
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        DELETE FROM inventory WHERE id = NEW.id;
    END IF;
END //
DELIMITER ;

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX idx_sales_date ON sales(date DESC);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_sale_items_product ON sale_items(product_name);
CREATE INDEX idx_notifications_unread ON notifications(is_read, date DESC);

-- ==================== NOTES ====================
-- 1. This schema uses DECIMAL(10,2) for all monetary values to ensure precision
-- 2. Generated columns are used for calculated fields (profit_per_item, net_profit)
-- 3. Foreign keys ensure referential integrity
-- 4. Indexes are added for frequently queried columns
-- 5. Views provide convenient access to common queries
-- 6. Stored procedures encapsulate complex business logic
-- 7. Triggers automate notifications and inventory management
-- 8. All timestamps use TIMESTAMP for consistency
-- 9. Character set utf8mb4 supports all Unicode characters including emojis
-- 10. Currency is set to ZMW (Zambian Kwacha) as per requirements

-- ==================== MIGRATION NOTES ====================
-- To migrate from localStorage to this database:
-- 1. Export data from localStorage using the exportData() function
-- 2. Parse the JSON data
-- 3. Insert records into respective tables using INSERT statements
-- 4. Ensure all foreign key relationships are maintained
-- 5. Update the application to use database queries instead of localStorage
-- 6. Implement proper authentication and session management
-- 7. Add database connection pooling for performance
-- 8. Implement proper error handling and transaction management
