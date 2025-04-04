import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { showNotification } from './utils/functions';

const API = axios.create({
  // baseURL: 'https://169f-200-55-69-248.ngrok-free.app',
  baseURL: 'http://localhost:5001',
});

// No automatic sync interceptor anymore

API.defaults.headers.common['ngrok-skip-browser-warning'] = "69420";

// Funci\u00f3n para configurar el token
const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // window.location.reload();
    }
    if (error.response && error.response.status === 500) {
      showNotification("Ocurrio un Error, vuelva a intentarlo");
    }
    return Promise.reject(error);
  }
);

// Componente que envuelve las llamadas a la API
export const ApiProvider = ({ children }) => {
  const { token } = useAuth();

  // Configura el token cada vez que cambie
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setAuthToken(storedToken);
  }, [token]);

  return children;
};

const api = {
  // Conversations
  getConversation: (conversationId) => API.post(`/conversation/`, { conversationId }),
  deleteConversation: (conversationId) => API.delete(`/conversation/${conversationId}`),
  getConversations: (folder) => API.get(`/conversations/${folder}`),
  sendMessage: async (messageData) => {
    await api.syncDirectory({}); // Refresh before sending message
    return API.post('/call', messageData);
  },

  // Account
  getAccount: () => API.get('/account'),
  updateAccount: (accountData) => API.put('/account', accountData),

  // Payment
  createPaymentIntent: (amount, payment_method) => API.post('/create-payment-intent', { amount, payment_method }),

  // Purchase Tokens - Now purchasing credits with USD amount
  purchaseTokens: (amount) => API.post('/purchase-tokens', { amount: amount }),

  // Account
  createAccount: (accountData) => API.post('/signup', accountData),
  login: (loginData) => API.post('/login', loginData),

  // Sync Directory and update vectors
  syncDirectory: (data) => API.post('/sync', data),

  getSaldo: () => API.get('/saldo'), 

  updateConversationTitle: (conversationId, data) => API.put(`/conversation/${conversationId}/title`, data),
};

export default api;