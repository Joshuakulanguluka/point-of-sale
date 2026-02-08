// ==================== COMPONENT LOADER ====================
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

// Load sidebar and topbar
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('sidebarContainer')) {
        await loadComponent('sidebarContainer', '../assets/componets/sidebar.html');
        initSidebar();
    }
    
    if (document.getElementById('topbarContainer')) {
        await loadComponent('topbarContainer', '../assets/componets/topbar.html');
        // Wait a bit for DOM to update
        setTimeout(() => {
            initTopbar();
        }, 50);
    }
});

// ==================== SIDEBAR FUNCTIONALITY ====================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }
    
    // Function to update main content width
    function updateMainContentWidth() {
        if (!mainContent) return;
        
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '80px';
            mainContent.style.width = 'calc(100% - 80px)';
        } else {
            mainContent.style.marginLeft = '280px';
            mainContent.style.width = 'calc(100% - 280px)';
        }
    }
    
    // Toggle sidebar collapse
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            updateMainContentWidth();
        });
    }
    
    // Restore sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Update width on load
    updateMainContentWidth();
    
    // Set active nav item
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '').toLowerCase();
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === currentPage) {
            item.classList.add('active');
        }
    });
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
    }
    
    // Initialize mobile sidebar toggle after topbar is loaded
    setTimeout(() => {
        initMobileSidebar();
    }, 100);
}

// ==================== MOBILE SIDEBAR FUNCTIONALITY ====================
function initMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    
    if (!sidebar || !mobileSidebarToggle) {
        return;
    }
    
    // Mobile sidebar toggle
    mobileSidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
    });
    
    // Close mobile sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !mobileSidebarToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
    
    // Close sidebar when clicking on a nav item on mobile
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });
}

// ==================== TOPBAR FUNCTIONALITY ====================
function initTopbar() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const closeNotifications = document.getElementById('closeNotifications');
    const topbarLogout = document.getElementById('topbarLogout');
    const themeToggle = document.getElementById('themeToggle');
    
    // Update page title based on current page
    updatePageTitle();
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Update profile info
    if (AppData.user) {
        const profileNameEl = document.getElementById('profileName');
        const profileImageEl = document.getElementById('profileImage');
        const profilePlaceholderEl = document.getElementById('profilePlaceholder');
        
        if (profileNameEl) {
            profileNameEl.textContent = AppData.user.name;
        }
        
        if (AppData.user.profilePicture && profileImageEl && profilePlaceholderEl) {
            profileImageEl.src = AppData.user.profilePicture;
            profileImageEl.style.display = 'block';
            profilePlaceholderEl.style.display = 'none';
        }
    }
    
    // Profile dropdown toggle
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
            if (notificationsPanel) {
                notificationsPanel.classList.remove('active');
            }
        });
    }
    
    // Notifications panel toggle
    if (notificationsBtn && notificationsPanel) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsPanel.classList.toggle('active');
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }
            loadNotifications();
        });
    }
    
    // Close notifications
    if (closeNotifications && notificationsPanel) {
        closeNotifications.addEventListener('click', () => {
            notificationsPanel.classList.remove('active');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        if (profileDropdown) {
            profileDropdown.classList.remove('active');
        }
        if (notificationsPanel) {
            notificationsPanel.classList.remove('active');
        }
    });
    
    // Update notification badge
    updateNotificationBadge();
    
    // Logout from topbar
    if (topbarLogout) {
        topbarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
    }
}

// ==================== NOTIFICATIONS ====================
function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    
    if (!notificationsList) return;
    
    if (AppData.notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-notifications">
                <i data-lucide="bell-off"></i>
                <p>No notifications</p>
            </div>
        `;
    } else {
        notificationsList.innerHTML = AppData.notifications.map(notification => {
            const iconMap = {
                info: 'info',
                success: 'check-circle',
                warning: 'alert-triangle',
                error: 'alert-circle'
            };
            
            return `
                <div class="notification-item ${notification.type} ${notification.read ? '' : 'unread'}" 
                     onclick="markNotificationAsRead('${notification.id}')">
                    <div class="notification-item-header">
                        <i data-lucide="${iconMap[notification.type]}" class="notification-item-icon"></i>
                        <span class="notification-item-title">${notification.title}</span>
                    </div>
                    <p class="notification-item-message">${notification.message}</p>
                    <span class="notification-item-date">${formatDate(notification.date)}</span>
                </div>
            `;
        }).join('');
    }
    
    lucide.createIcons();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = AppData.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function markNotificationAsRead(id) {
    markNotificationRead(id);
    loadNotifications();
    updateNotificationBadge();
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    toast.innerHTML = `
        <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================
function updatePageTitle() {
    const pageTitleEl = document.getElementById('pageTitle');
    console.log('updatePageTitle called, element found:', !!pageTitleEl);
    
    if (!pageTitleEl) {
        console.error('pageTitle element not found!');
        return;
    }
    
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    console.log('Current page:', currentPage);
    
    const pageTitles = {
        'dashboard': 'Dashboard',
        'sales': 'Sales',
        'Inventory': 'Inventory',
        'inventory': 'Inventory',
        'expenses': 'Expenses',
        'wallet': 'Wallet',
        'reports': 'Reports',
        'profile': 'Profile',
        'settings': 'Settings',
        'notifications': 'Notifications',
        'transaction_history': 'Transaction History'
    };
    
    const title = pageTitles[currentPage] || 'Dashboard';
    console.log('Setting title to:', title);
    pageTitleEl.textContent = title;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function handleLogout() {
    // Logout user and clear session
    logoutUser();
    
    // Redirect to login
    window.location.href = '../index.html';
}

// Session timeout check
setInterval(() => {
    if (checkSessionTimeout()) {
        alert('Your session has expired. Please login again.');
        window.location.href = '../index.html';
    }
}, 60000); // Check every minute

// Daily sales reset check (check every minute for new day)
setInterval(() => {
    if (typeof checkAndResetDailySales === 'function') {
        checkAndResetDailySales();
    }
}, 60000); // Check every minute

// Update activity on user interaction
document.addEventListener('click', updateSessionActivity);
document.addEventListener('keypress', updateSessionActivity);

// ==================== FORM VALIDATION ====================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value.trim() !== '';
}

function validateNumber(value) {
    return !isNaN(value) && parseFloat(value) > 0;
}

// ==================== AUTO CAPITALIZE INPUTS ====================
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Auto-capitalize text inputs (excluding email and password)
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all text and search inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    
    inputs.forEach(input => {
        // Skip email and password fields
        if (input.type === 'email' || input.type === 'password' || 
            input.id.toLowerCase().includes('email') || 
            input.id.toLowerCase().includes('password')) {
            return;
        }
        
        input.addEventListener('blur', function() {
            this.value = capitalizeWords(this.value);
        });
    });
});

// Also add to dynamically created inputs
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'input' || tagName.toLowerCase() === 'textarea') {
        setTimeout(() => {
            const elementId = element.id || '';
            if ((element.type === 'text' || element.type === 'search' || tagName.toLowerCase() === 'textarea') &&
                !elementId.toLowerCase().includes('email') && 
                !elementId.toLowerCase().includes('password')) {
                
                element.addEventListener('blur', function() {
                    this.value = capitalizeWords(this.value);
                });
            }
        }, 0);
    }
    
    return element;
};
