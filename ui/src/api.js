import axios from 'axios';
// Removed useAuth import as it's not a component
// Removed useEffect import
import { showNotification } from './utils/functions';

const API = axios.create({
  // baseURL: 'https://169f-200-55-69-248.ngrok-free.app',\
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
    if (error.response) {
        // --- Handle 401 Unauthorized ---
        if (error.response.status === 401) {
            console.error('API Error: 401 Unauthorized detected. Logging out.');
            // Clear auth state immediately
            setAuthToken(null); // Use the exported function to clear header
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('saldo');

            // Notify user and redirect
            showNotification('Session expired or invalid. Please log in again.', 'error'); // Use error severity

            // Use setTimeout to allow the notification to potentially display before redirect
            setTimeout(() => {
               window.location.href = '/login'; // Force reload and redirect
            }, 500);

            // Return a new rejected promise to stop the original promise chain cleanly
            return Promise.reject(new Error("Unauthorized (401) - Redirecting to login."));
        }
        // --- Handle 500 Internal Server Error ---
        if (error.response.status === 500) {
          console.error('API Error: 500 Internal Server Error.', error.response.data);
          showNotification("An internal server error occurred. Please try again later.", "error"); // Use error severity
        }
    } else if (error.request) {
        console.error('API Error: No response received.', error.request);
        showNotification('Network error or server unreachable. Please check your connection.', 'error');
    } else {
        console.error('API Error: Request setup failed.', error.message);
        showNotification('An error occurred while sending the request.', 'error');
    }

    // For non-401/500 or other errors, just reject the promise
    return Promise.reject(error);
  }
);

// Removed ApiProvider component from here

// --- Refined api object ---
const api = {
  // Conversations
  getConversation: (conversationId) => API.post(`/conversation/`, { conversationId }),
  deleteConversation: (conversationId) => API.delete(`/conversation/${conversationId}`),
  getConversations: (folder) => API.get(`/conversations/${folder}`),
  sendMessage: async (messageData) => {
    return API.post('/call', messageData);
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

export default api; // Export the api object