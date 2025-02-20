import { agentRepository } from '../repositories/agentRepository';

export const agentService = {
    async createAgent(agentData: any) {
        return await agentRepository.createAgent(agentData);
    },

    async updateAgent(agentId: string, updateData: any) {
        return await agentRepository.updateAgent(agentId, updateData);
    },

    async getAgents(owner: any) {
        const agents = await agentRepository.listAgents(owner);
        if (!agents?.length) return [];
        
        return agents;
    },

    async getAgentConfiguration(agentId: string) {
        const agent = await agentRepository.getAgentById(agentId);
        if (!agent) throw new Error('Agent not found');
        
        return {
            ...agent,
            tools: agent.tools.filter(t => t.enabled)
        };
    },

    async getAgentPublicConfiguration(publicId: string) {
        const agent = await agentRepository.getAgentByPublicId(publicId);
        if (!agent) throw new Error('Agent not found');
        
        return {
            ...agent,
            tools: agent.tools.filter(t => t.enabled)
        };
    },

    // Account
    async getAccount(email: string) {
        const account = await agentRepository.getAccountByEmail(email);
        if (!account) throw new Error('Account not found');
        return account;
    },

    async updateAccount(email: string, updateData: any) {
        const updatedAccount = await agentRepository.updateAccountByEmail(email, updateData);
        if (!updatedAccount) throw new Error('Failed to update account');
        return updatedAccount;
    }
};