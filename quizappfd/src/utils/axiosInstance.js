// quizappfd/utils/axiosInstance.js

import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:5000/api",
});

axiosInstance.interceptors.request.use((config) => {
    // Check if the request is for an admin route
    // Assuming all admin routes start with '/admin' (e.g., /api/admin/login-admin, /api/admin/students)
    if (config.url.startsWith('/admin')) {
        const adminToken = localStorage.getItem("adminToken");
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
            console.log("Frontend Axios: Applying admin token for admin route.");
        } else {
            console.log("Frontend Axios: Admin route, but no admin token found in localStorage.");
        }
    } else {
        // For non-admin routes, use the regular user JWT token
        const userToken = localStorage.getItem("jwtToken");
        if (userToken) {
            config.headers.Authorization = `Bearer ${userToken}`;
            console.log("Frontend Axios: Applying user token for non-admin route.");
        } else {
            console.log("Frontend Axios: Non-admin route, but no user token found in localStorage.");
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosInstance;
