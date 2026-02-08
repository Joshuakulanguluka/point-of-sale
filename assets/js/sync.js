// ==================== AUTO SYNC SYSTEM ====================
// Automatically syncs localStorage data to database when online
// Queues changes when offline and syncs when connection is restored

const SyncManager = {
    syncQueue: [],
    isSyncing: false,
    isOnline: navigator.onLine,
    syncInterval: null,
    lastSyncTime: null,
    
    // Configuration
    config: {
        syncIntervalMs: 30000, // Sync every 30 seconds when online
        apiEndpoint: '/api/sync', // Your API endpoint (configure this)
        retryAttempts: 3,
        retryDelayMs: 5000
    },
    
    // Initialize sync manager
    init() {
        console.log('🔄 Sync Manager initialized');
        
        // Load sync queue from localStorage
        this.loadSyncQueue();
        
        // Load last sync time
        this.lastSyncTime = localStorage.getItem('lastSyncTime');
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Listen for data changes
        this.setupDataChangeListeners();
        
        // Start periodic sync if online
        if (this.isOnline) {
            this.startPeriodicSync();
        }
        
        // Sync on page load if online
        if (this.isOnline && this.syncQueue.length > 0) {
            this.syncToDatabase();
        }
    },
    
    // Handle online event
    handleOnline() {
        console.log('✅ Connection restored - syncing data...');
        this.isOnline = true;
        this.showSyncNotification('Internet connected - syncing data...', 'info');
        
        // Sync queued changes immediately
        if (this.syncQueue.length > 0) {
            setTimeout(() => {
                this.syncToDatabase();
            }, 500); // Small delay to ensure connection is stable
        }
        
        // Start periodic sync
        this.startPeriodicSync();
    },
    
    // Handle offline event
    handleOffline() {
        console.log('⚠️ Connection lost - queuing changes...');
        this.isOnline = false;
        this.showSyncNotification('No internet - data will be stored locally', 'warning');
        
        // Stop periodic sync
        this.stopPeriodicSync();
    },
    
    // Start periodic sync
    startPeriodicSync() {
        if (this.syncInterval) return;
        
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.isSyncing) {
                this.syncToDatabase();
            }
        }, this.config.syncIntervalMs);
    },
    
    // Stop periodic sync
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },
    
    // Queue a change for sync
    queueChange(changeType, data) {
        const change = {
            id: this.generateChangeId(),
            type: changeType,
            data: data,
            timestamp: new Date().toISOString(),
            synced: false,
            attempts: 0
        };
        
        this.syncQueue.push(change);
        this.saveSyncQueue();
        
        console.log(`📝 Queued change: ${changeType}`, change);
        
        // Try to sync immediately if online
        if (this.isOnline && !this.isSyncing) {
            this.syncToDatabase();
        }
    },
    
    // Sync to database
    async syncToDatabase() {
        if (this.isSyncing || this.syncQueue.length === 0) return;
        
        this.isSyncing = true;
        console.log(`🔄 Syncing ${this.syncQueue.length} changes...`);
        
        try {
            // Get unsynced changes
            const unsyncedChanges = this.syncQueue.filter(c => !c.synced);
            
            if (unsyncedChanges.length === 0) {
                this.isSyncing = false;
                return;
            }
            
            // Prepare sync payload
            const payload = {
                changes: unsyncedChanges,
                userId: AppData.user?.id,
                lastSyncTime: this.lastSyncTime,
                timestamp: new Date().toISOString()
            };
            
            // Send to API (configure your endpoint)
            const response = await this.sendToAPI(payload);
            
            if (response.success) {
                // Mark changes as synced
                unsyncedChanges.forEach(change => {
                    const index = this.syncQueue.findIndex(c => c.id === change.id);
                    if (index !== -1) {
                        this.syncQueue[index].synced = true;
                    }
                });
                
                // Remove synced changes older than 24 hours
                this.cleanupSyncQueue();
                
                // Update last sync time
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastSyncTime', this.lastSyncTime);
                
                // Save queue
                this.saveSyncQueue();
                
                console.log('✅ Sync completed successfully');
                
                // Only show success toast if synced to real database (not mock)
                if (!response.isMock) {
                    this.showSyncNotification('✓ Data synced successfully to server', 'success');
                }
            } else {
                throw new Error(response.error || 'Sync failed');
            }
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            
            // Increment retry attempts
            this.syncQueue.forEach(change => {
                if (!change.synced) {
                    change.attempts = (change.attempts || 0) + 1;
                }
            });
            
            this.saveSyncQueue();
            
            // Retry if not exceeded max attempts
            const maxAttempts = this.config.retryAttempts;
            const shouldRetry = this.syncQueue.some(c => !c.synced && c.attempts < maxAttempts);
            
            if (shouldRetry) {
                console.log(`🔄 Retrying sync in ${this.config.retryDelayMs / 1000} seconds...`);
                setTimeout(() => {
                    this.isSyncing = false;
                    this.syncToDatabase();
                }, this.config.retryDelayMs);
            } else {
                this.showSyncNotification('Sync failed - will retry later', 'error');
            }
        } finally {
            this.isSyncing = false;
        }
    },
    
    // Send data to API
    async sendToAPI(payload) {
        // IMPORTANT: Configure your actual API endpoint here
        // For now, this is a mock implementation
        
        // Uncomment and configure when you have a backend API:
        /*
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        */
        
        // Mock implementation (remove when you have real API)
        // NOTE: Mock mode does NOT show success toast - only real API does
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('📤 Mock API call - Data saved locally only (no server sync)');
                console.log('💡 Configure real API endpoint to enable server sync');
                resolve({ success: true, message: 'Mock sync successful', isMock: true });
            }, 1000);
        });
    },
    
    // Setup listeners for data changes
    setupDataChangeListeners() {
        // Wait for saveData to be available
        const setupOverride = () => {
            if (typeof window.saveData === 'function') {
                // Override saveData function to queue changes
                const originalSaveData = window.saveData;
                
                window.saveData = () => {
                    // Call original save
                    originalSaveData();
                    
                    // Queue for sync (only if AppData exists)
                    if (typeof AppData !== 'undefined') {
                        this.queueChange('full_sync', {
                            inventory: AppData.inventory,
                            sales: AppData.sales,
                            expenses: AppData.expenses,
                            wallet: AppData.wallet,
                            transactions: AppData.transactions,
                            notifications: AppData.notifications,
                            settings: AppData.settings,
                            user: AppData.user
                        });
                    }
                };
                console.log('✅ Data change listeners setup complete');
            } else {
                // Retry after a short delay
                setTimeout(setupOverride, 100);
            }
        };
        
        setupOverride();
    },
    
    // Generate unique change ID
    generateChangeId() {
        return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Save sync queue to localStorage
    saveSyncQueue() {
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    },
    
    // Load sync queue from localStorage
    loadSyncQueue() {
        const saved = localStorage.getItem('syncQueue');
        if (saved) {
            try {
                this.syncQueue = JSON.parse(saved);
                console.log(`📥 Loaded ${this.syncQueue.length} queued changes`);
            } catch (error) {
                console.error('Failed to load sync queue:', error);
                this.syncQueue = [];
            }
        }
    },
    
    // Cleanup old synced changes
    cleanupSyncQueue() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        this.syncQueue = this.syncQueue.filter(change => {
            if (change.synced) {
                const changeTime = new Date(change.timestamp).getTime();
                return changeTime > oneDayAgo;
            }
            return true;
        });
    },
    
    // Show sync notification
    showSyncNotification(message, type) {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },
    
    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            queuedChanges: this.syncQueue.filter(c => !c.synced).length,
            lastSyncTime: this.lastSyncTime,
            totalChanges: this.syncQueue.length
        };
    },
    
    // Force sync now
    forceSyncNow() {
        if (!this.isOnline) {
            this.showSyncNotification('Cannot sync - no internet connection', 'error');
            return;
        }
        
        this.showSyncNotification('Starting manual sync...', 'info');
        this.syncToDatabase();
    },
    
    // Clear sync queue (use with caution)
    clearSyncQueue() {
        this.syncQueue = [];
        this.saveSyncQueue();
        console.log('🗑️ Sync queue cleared');
    }
};

// Initialize sync manager when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SyncManager.init());
} else {
    SyncManager.init();
}

// Make SyncManager globally available
window.SyncManager = SyncManager;
