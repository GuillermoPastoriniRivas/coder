import { conversationRepository } from '../repositories/conversationRepository';
import { callAgent } from '../utils/langchain';
import { agentService } from './agentService';

export const widgetService = {
  async initializeConversation(agentId: string, phone: string) {
    // Verify that the agent exists
    const agent = await agentService.getAgentConfiguration(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Initialize conversation if it doesn't exist
    const existingConversation = await conversationRepository.getConversation(agentId, phone);
    if (existingConversation) {
      return existingConversation;
    }

    const newConversation = {
      phone,
      agentId,
      messages: []
    };

    await conversationRepository.upsertConversation(newConversation);
    return newConversation;
  },

  async handleMessage(agentId: string, phone: string, message: string) {
    // Save the user's message
    await conversationRepository.upsertConversation({
      phone,
      agentId,
      messages: [{ role: 'user', content: message, timestamp: new Date() }]
    });

    // Call the agent to get a response
    const response = await callAgent(message, phone, agentId);

    // Save the assistant's response
    await conversationRepository.upsertConversation({
      phone,
      agentId,
      messages: [{ role: 'assistant', content: response, timestamp: new Date() }]
    });

    return response;
  },

  async getConversation(agentId: string, phone: string) {
    const conversation = await conversationRepository.getConversation(agentId, phone);
    return conversation;
  }
};