import { Agent } from '../models/agent';
import { Account } from '../models/account';

export const agentRepository = {
    async createAgent(agentData: any) {
        const agent = new Agent(agentData);
        return await agent.save();
    },

    async updateAgent(agentId: string, updateData: any) {
        return await Agent.findByIdAndUpdate(agentId, updateData, { new: true });
    },

    async listAgents(owner: string) {
        return await Agent.find({ owner });
    },

    async getAgentById(agentId: string) {
        return await Agent.findById(agentId);
    },

    async getAgentByPublicId(publicId: string) {
        return await Agent.findOne({ publicId });
    },

    // Account
    async getAccountByEmail(email: string) {
        return await Account.findOne({ email });
    },

    async updateAccountByEmail(email: string, updateData: any) {
        return await Account.findOneAndUpdate({ email }, updateData, { new: true });
    }
};