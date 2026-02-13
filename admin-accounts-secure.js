// Deprecated client-side admin account stub.
// Authentication must be performed against the backend API instead of in-browser logic.

console.warn('admin-accounts-secure.js is deprecated. Use server-side authentication.');

class SecureAdminAccountManager {
    static authenticate() {
        throw new Error('Client-side admin authentication is disabled. Use the API service.');
    }

    static hasPermission() {
        return false;
    }

    static getUserInfo() {
        return null;
    }

    static changePassword() {
        throw new Error('Client-side password changes are disabled. Use the API service.');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureAdminAccountManager;
}
