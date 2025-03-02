import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

const API = axios.create({
  baseURL: 'http://localhost:5000',
});

// Función para configurar el token
const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

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

export default {
  // Conversations
  upsertConversation: (convoData) => API.post('/conversations', convoData),
  getConversation: () => API.get(`/conversations`),

  // Chat
  sendMessage: (messageData) => API.post('/call', messageData),

  // Account
  getAccount: () => API.get('/account'),
  updateAccount: (accountData) => API.put('/account', accountData),

  // Purchase Tokens
  purchaseTokens: (tokens) => API.post('/purchase-tokens', { tokens }),

  // Account
  createAccount: (accountData) => API.post('/signup', accountData),
  login: (loginData) => API.post('/login', loginData),
};
