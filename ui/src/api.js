import axios from 'axios';
import { showNotification } from './utils/functions';

const API = axios.create({
  // baseURL: 'https://a704-200-55-69-248.ngrok-free.app',
   baseURL: 'http://localhost:5001',
});

API.defaults.headers.common['ngrok-skip-browser-warning'] = "69420";

// Funcion para configurar el token - Export this
export const setAuthToken = (token) => {
  console.log("Setting auth token:", token ? 'Token present' : 'Token removed'); // Debug log
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

// --- Interceptor ---
API.interceptors.response.use(
  response => response,
  error => {
    if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return Promise.reject(new Error('Request canceled'));
    }
    if (error.response) {
        if (error.response.status === 401) {
            console.error('API Error: 401 Unauthorized detected. Logging out.');
            setAuthToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('saldo');
            showNotification('Session expired or invalid. Please log in again.', 'error');
            setTimeout(() => {
               window.location.href = '/login';
            }, 500);
            return Promise.reject(new Error("Unauthorized (401) - Redirecting to login."));
        }
        if (error.response.status === 500) {
          console.error('API Error: 500 Internal Server Error.', error.response.data);
          const serverMessage = error.response.data?.message || "An internal server error occurred. Please try again later.";
          showNotification(serverMessage, "error");
        }
    } else if (error.request) {
        console.error('API Error: No response received.', error.request);
        showNotification('Network error or server unreachable. Please check your connection.', 'error');
    } else {
        console.error('API Error: Request setup failed.', error.message);
        showNotification('An error occurred while sending the request.', 'error');
    }
    return Promise.reject(error);
  }
);

const api = {
  // Conversations
  getConversation: (conversationId) => API.post(`/conversation/`, { conversationId }),
  deleteConversation: (conversationId) => API.delete(`/conversation/${conversationId}`),
  getConversations: (folder) => API.get(`/conversations/${folder}`),
  // Updated sendMessage to accept imageFile
  sendMessage: async (messageData, options = {}) => {
    const { signal, imageFile } = options;

    if (imageFile) {
      const formData = new FormData();
      // Append all existing messageData fields
      for (const key in messageData) {
        formData.append(key, messageData[key]);
      }
      // Append the image file
      formData.append('attachment', imageFile);

      return API.post('/call', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      });
    } else {
      return API.post('/call', messageData, { signal });
    }
  },

  // Account
  getAccount: () => API.get('/account'),
  updateAccount: (accountData) => API.put('/account', accountData),

  // Payment
  createPaymentIntent: (amount, payment_method) => API.post('/create-payment-intent', { amount, payment_method }),

  // Purchase Tokens (Credits)
  purchaseTokens: (amount, paymentIntentId = null) => API.post('/purchase-tokens', { amount: amount, paymentIntentId: paymentIntentId }),

  // Auth
  createAccount: (accountData) => API.post('/signup', accountData),
  login: (loginData) => API.post('/login', loginData),

  // Sync Directory
  syncDirectory: (data) => API.post('/sync', data),

  // Saldo
  getSaldo: () => API.get('/saldo'),

  // Conversation Title
  updateConversationTitle: (conversationId, data) => API.put(`/conversation/${conversationId}/title`, data),

  // Purchase History
  getPurchaseHistory: () => API.get('/purchase-history'),

  // Call History
  getCallHistory: () => API.get('/call-history'),
};

export default api;