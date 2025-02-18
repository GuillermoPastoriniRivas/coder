import { Agent } from '../models/agent';

export const agentRepository = {
    async createAgent(agentData: any) {
        return await Agent.create(agentData);
    },

    async updateAgent(agentId: string, updateData: any) {
        return await Agent.findByIdAndUpdate(agentId, updateData, { new: true });
    },

    async getAgentById(agentId: string) {
        return await Agent.findById(agentId)
            .populate('tools')
            .lean();
    },

    async getAgentByPublicId(publicId: string) {
        return await Agent.findOne({ publicId })
            .populate('tools')
            .lean();
    },

    async listAgents(owner: string) {
        return await Agent.find({ owner }).lean();
    }
};