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
    }
};