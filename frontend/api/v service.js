
const API_BASE_URL = "http://127.0.0.1:8000";

const DawazAPI = {
    async request(endpoint, options = {}) {
        const token = sessionStorage.getItem("dawazToken");

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || "Request failed");
        }

        return data;
    },

    async login(username, password) {
        const data = await this.request("/users/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        sessionStorage.setItem("dawazToken", data.access_token);
        sessionStorage.setItem("dawazUser", JSON.stringify(data.user));

        return data.user;
    },

    async getCurrentUser() {
        return this.request("/users/me");
    },

    logout() {
        sessionStorage.removeItem("dawazToken");
        sessionStorage.removeItem("dawazUser");
        window.location.href = "../index.html";
    }
};

window.DawazAPI = DawazAPI;
