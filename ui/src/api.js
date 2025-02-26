import axios from 'axios';

const API = axios.create({
  baseURL: 'https://waba.soon.it',
});

export default {
  // Agents
  getAgentsByEmail: (email) => API.get(`/agents?owner=${email}`),
  createAgent: (agentData) => API.post('/agents', agentData),
  updateAgent: (id, agentData) => API.put(`/agents/${id}`, agentData),    
  getAgent: (id) => API.get(`/agents/${id}`),

  // Conversations
  upsertConversation: (convoData) => API.post('/conversations', convoData),
  getConversation: (agentId, phone) => API.get(`/conversations/${agentId}/${phone}`),

  // Chat
  sendMessage: (messageData) => API.post('/call', messageData),

  // Public
  getPublicAgent: (publicId) => API.get(`/public/${publicId}`),

  // Account
  getAccount: () => API.get('/account'),
  updateAccount: (accountData) => API.put('/account', accountData),       

  // Purchase Tokens
  purchaseTokens: (tokens) => API.post('/purchase-tokens', { tokens }),    

  // Account
  createAccount: (accountData) => API.post('/signup', accountData),
  login: (loginData) => API.post('/login', loginData),

  // Widget
  initializeWidget: (agentId, phone) => API.post('/widget/init', { agentId, phone }),
  sendWidgetMessage: (agentId, phone, message) => API.post('/widget/message', { agentId, phone, message }),
  getWidgetConversation: (agentId, phone) => API.get(`/widget/conversations/${agentId}/${phone}`),
};