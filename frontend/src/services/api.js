import axios from "axios";

const api = axios.create({
  baseURL: "https://meditrack-injz.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("meditrack_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("meditrack_token");
      localStorage.removeItem("meditrack_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// Auth
export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const getMe = () => api.get("/auth/me");

// Hospitals
export const getHospitals = () => api.get("/hospitals");
export const createHospital = (data) => api.post("/hospitals", data);
export const updateHospital = (id, data) => api.put(`/hospitals/${id}`, data);

// Medicines
export const getMedicines = (params) => api.get("/medicines", { params });
export const createMedicine = (data) => api.post("/medicines", data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}`, data);

// Inventory
export const getInventory = (params) => api.get("/inventory", { params });
export const stockIn = (data) => api.post("/inventory/stock-in", data);
export const stockOut = (data) => api.post("/inventory/stock-out", data);

// Suppliers
export const getSuppliers = () => api.get("/suppliers");
export const createSupplier = (data) => api.post("/suppliers", data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);

// Purchases
export const getPurchases = (params) => api.get("/purchases", { params });
export const createPurchase = (data) => api.post("/purchases", data);
export const receivePurchase = (id, data) =>
  api.post(`/purchases/${id}/receive`, data);

// Consumption
export const getConsumptions = (params) => api.get("/consumptions", { params });
export const createConsumption = (data) => api.post("/consumptions", data);

// Transfers
export const getTransfers = (params) => api.get("/transfers", { params });
export const createTransfer = (data) => api.post("/transfers", data);
export const approveTransfer = (id) => api.post(`/transfers/${id}/approve`);
export const completeTransfer = (id) => api.post(`/transfers/${id}/complete`);

// AI
export const getInsights = (params) => api.get("/ai/insights", { params });
export const runAIAnalysis = (hospitalId) =>
  api.post("/ai/analyze", { hospitalId });
export const updateInsightStatus = (id, status) =>
  api.put(`/ai/insights/${id}/status`, { status });
export const createTransferFromAI = (id) =>
  api.post(`/ai/insights/${id}/create-transfer`);
export const getDashboardStats = () => api.get("/ai/dashboard-stats");
