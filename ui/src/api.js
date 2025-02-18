import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
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
  getPublicAgent: (publicId) => API.get(`/public/${publicId}`)
};