/**
 * ==========================================================
 * authApi.js
 * Authentication API Service
 * ==========================================================
 */

const AuthAPI = {

    /**
     * Register User
     */
    async register(userData) {
        const res = await API.post("/auth/register", userData);
        if (res.success && res.accessToken) {
            localStorage.setItem("ht_token", res.accessToken);
        }
        return res;
    },

    /**
     * Login User
     */
    async login(email, password) {
        const res = await API.post("/auth/login", {
            email,
            password
        });
        if (res.success && res.accessToken) {
            localStorage.setItem("ht_token", res.accessToken);
        }
        return res;
    },

    /**
     * Logout User
     */
    async logout() {
        const res = await API.post("/auth/logout");
        localStorage.removeItem("ht_token");
        return res;
    },

    /**
     * Get Logged-in User
     */
    async getMe() {
        return await API.get("/auth/me");
    },

    /**
     * Refresh Access Token
     */
    async refreshToken() {
        return await API.post("/auth/refresh");
    },

    /**
     * Forgot Password
     */
    async forgotPassword(email) {
        return await API.post("/auth/forgot-password", {
            email
        });
    },

    /**
     * Reset Password
     */
    async resetPassword(token, password) {
        return await API.post("/auth/reset-password", {
            token,
            password
        });
    },

    /**
     * Change Password
     */
    async changePassword(currentPassword, newPassword) {
        return await API.put("/auth/change-password", {
            currentPassword,
            newPassword
        });
    }

};

window.AuthAPI = AuthAPI;