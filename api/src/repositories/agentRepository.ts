import { Agent } from '../models/agent';
import { Account } from '../models/account';

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
    },

    // Account
    async getAccountByEmail(email: string) {
        return await Account.findOne({ email });
    },

    async updateAccountByEmail(email: string, updateData: any) {
        return await Account.findOneAndUpdate({ email }, updateData, { new: true });
    }
};