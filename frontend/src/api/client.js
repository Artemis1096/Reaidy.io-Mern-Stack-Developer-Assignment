import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Setup Axios Instance
const apiClient = axios.create({
    baseURL: API_URL,
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('session_id');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Pass session_id in params for every GET request if not auth?? 
    // Or let components handle it? simpler to attach header or query param.
    // Our backend looks for query.session_id. Let's add it to params.
    if (sessionId && !config.params?.session_id) {
        config.params = { ...config.params, session_id: sessionId };
    }

    return config;
});

// Auth API
export const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
};

export const register = async (name, email, password) => {
    const res = await apiClient.post('/auth/register', { name, email, password });
    if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
};

// Tracking API
export const sendEvent = async (eventType, data = {}) => {
    const sessionId = localStorage.getItem('session_id') || `guest_${Date.now()}`;
    if (!localStorage.getItem('session_id')) localStorage.setItem('session_id', sessionId);

    try {
        await apiClient.post('/tracking', {
            session_id: sessionId,
            eventType,
            ...data
        });
    } catch (err) {
        console.error('Tracking Error:', err);
    }
};

// Recommendation API
export const getHomeRecommendations = async (page = 1) => {
    const res = await apiClient.get('/recommendations/home', { params: { page } });
    return res.data;
};

export const getProductRecommendations = async (productId, page = 1) => {
    const res = await apiClient.get(`/recommendations/product/${productId}`, { params: { page } });
    return res.data;
};

export const getCartRecommendations = async (page = 1) => {
    const res = await apiClient.get('/recommendations/cart', { params: { page } });
    return res.data;
};

// Order API
export const createOrder = async (items) => {
    const res = await apiClient.post('/orders', { items });
    return res.data;
};

export const getUserOrders = async () => {
    const res = await apiClient.get('/orders');
    return res.data;
};

export const getOrderById = async (orderId) => {
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data;
};

export default apiClient;
