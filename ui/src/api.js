import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

const API = axios.create({
  // baseURL: 'https://169f-200-55-69-248.ngrok-free.app',
  baseURL: 'http://localhost:5000',
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

// Funci\u00f3n para mostrar notificaci\u00f3n de error
function showNotification(message) {
  const notification = document.createElement('div');
  notification.innerText = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '00px';
  notification.style.left = '00px';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  notification.style.color = '#fff';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '9999';
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('token');
      localStorage.removeItem('saldo');
      delete API.defaults.headers.common['Authorization'];
      window.location.href = '/login';
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
  deleteConversation: (conversationId) => API.delete(`/conversation/${conversationId}`), // Agregado m\u00e9todo para eliminar conversaci\u00f3n
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
  //updateVectors: (data) => API.post('/update-vectors', data), // Deprecated endpoint

  getSaldo: () => API.get('/saldo'), // New method to get saldo

  updateConversationTitle: (conversationId, data) => API.put(`/conversation/${conversationId}/title`, data),
};

export default api;