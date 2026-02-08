// ==================== PWA SUPPORT ====================
// Progressive Web App functionality - FULL OFFLINE SUPPORT

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Use relative path for GitHub Pages compatibility
        const swPath = './service-worker.js';
        navigator.serviceWorker.register(swPath)
            .then(registration => {
                console.log('✅ Service Worker registered - App works OFFLINE!');
                console.log('📍 Scope:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            console.log('🔄 New version available!');
                            if (typeof showToast === 'function') {
                                showToast('New version available! Refresh to update.', 'info');
                            }
                        }
                    });
                });
                
                // Update service worker on page load
                registration.update();
            })
            .catch(error => {
                console.error('❌ Service Worker registration failed:', error);
                console.log('⚠️ App will still work but without offline support');
            });
    });
} else {
    console.warn('⚠️ Service Workers not supported in this browser');
    console.log('💡 App will work but without offline support');
}

// Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e;
    
    // Show install button/notification
    showInstallPrompt();
});

function showInstallPrompt() {
    // Show a custom install prompt
    if (typeof showToast === 'function') {
        showToast('Install POS System as an app for better experience!', 'info');
    }
    
    // You can create a custom install button here
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', installApp);
    }
}

async function installApp() {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        if (typeof showToast === 'function') {
            showToast('App installed successfully!', 'success');
        }
    } else {
        console.log('❌ User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    deferredPrompt = null;
    
    // Hide install button
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
}

// Check if app is installed
window.addEventListener('appinstalled', () => {
    console.log('✅ POS System installed successfully');
    if (typeof showToast === 'function') {
        showToast('POS System installed! You can now use it offline.', 'success');
    }
    deferredPrompt = null;
});

// Handle online/offline status with better feedback
window.addEventListener('online', () => {
    console.log('✅ Internet connection restored - ONLINE');
    document.body.classList.remove('offline');
    
    if (typeof showToast === 'function') {
        showToast('✓ Back online - syncing data...', 'success');
    }
    
    // Trigger sync if SyncManager is available
    if (typeof SyncManager !== 'undefined' && SyncManager.syncQueue.length > 0) {
        console.log('🔄 Syncing queued data...');
        setTimeout(() => {
            SyncManager.syncToDatabase();
        }, 1000);
    }
});

window.addEventListener('offline', () => {
    console.log('⚠️ Internet connection lost - OFFLINE MODE');
    console.log('💾 All data will be saved locally');
    document.body.classList.add('offline');
    
    if (typeof showToast === 'function') {
        showToast('⚠️ Offline mode - data saved locally', 'warning');
    }
});

// Listen for messages from service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'SYNC_REQUESTED') {
            console.log('Service Worker requested sync');
            if (typeof SyncManager !== 'undefined') {
                SyncManager.syncToDatabase();
            }
        }
    });
}

// Background sync registration (if supported)
if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
        // Register for background sync
        return registration.sync.register('sync-data');
    }).then(() => {
        console.log('✅ Background sync registered');
    }).catch(error => {
        console.log('❌ Background sync registration failed:', error);
    });
}

// Check if running as installed app
function isInstalledApp() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

if (isInstalledApp()) {
    console.log('✅ Running as installed app');
    document.body.classList.add('installed-app');
}

// Export functions
window.installApp = installApp;
window.isInstalledApp = isInstalledApp;
