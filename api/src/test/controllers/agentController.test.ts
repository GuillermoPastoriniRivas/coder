import { Request, Response } from 'express';
import { agentController } from '../../controllers/agentController';
import { agentService } from '../../services/agentService';

jest.mock('../../services/agentService');

describe('AgentController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        res = {
            json: jsonMock,
            status: statusMock,
        };
        req = {
            body: {},
            params: {},
            query: {},
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createAgent', () => {
        it('should create a new agent and return it', async () => {
            req.body = { name: 'Agent Smith' };
            const mockAgent = { id: 'agent1', name: 'Agent Smith' };
            (agentService.createAgent as jest.Mock).mockResolvedValue(mockAgent);

            await agentController.createAgent(req as Request, res as Response);

            expect(agentService.createAgent).toHaveBeenCalledWith({ name: 'Agent Smith' });
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockAgent);
        });

        it('should return 500 when an error occurs', async () => {
            req.body = { name: 'Agent Smith' };
            (agentService.createAgent as jest.Mock).mockRejectedValue(new Error('Service error'));

            await agentController.createAgent(req as Request, res as Response);

            expect(agentService.createAgent).toHaveBeenCalledWith({ name: 'Agent Smith' });
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error creating agent' });
        });
    });

    describe('updateAgent', () => {
        it('should update an existing agent and return it', async () => {
            req.params = { id: 'agent1' };
            req.body = { name: 'Agent Neo' };
            const mockAgent = { id: 'agent1', name: 'Agent Neo' };
            (agentService.updateAgent as jest.Mock).mockResolvedValue(mockAgent);

            await agentController.updateAgent(req as Request, res as Response);

            expect(agentService.updateAgent).toHaveBeenCalledWith('agent1', { name: 'Agent Neo' });
            expect(jsonMock).toHaveBeenCalledWith(mockAgent);
        });

        it('should return 500 when an error occurs', async () => {
            req.params = { id: 'agent1' };
            req.body = { name: 'Agent Neo' };
            (agentService.updateAgent as jest.Mock).mockRejectedValue(new Error('Service error'));

            await agentController.updateAgent(req as Request, res as Response);

            expect(agentService.updateAgent).toHaveBeenCalledWith('agent1', { name: 'Agent Neo' });
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error updating agent' });
        });
    });

    describe('getAgent', () => {
        it('should retrieve an agent configuration and return it', async () => {
            req.params = { id: 'agent1' };
            const mockAgent = { id: 'agent1', name: 'Agent Smith' };
            (agentService.getAgentConfiguration as jest.Mock).mockResolvedValue(mockAgent);

            await agentController.getAgent(req as Request, res as Response);

            expect(agentService.getAgentConfiguration).toHaveBeenCalledWith('agent1');
            expect(jsonMock).toHaveBeenCalledWith(mockAgent);
        });

        it('should return 404 when agent is not found', async () => {
            req.params = { id: 'nonexistent' };
            (agentService.getAgentConfiguration as jest.Mock).mockRejectedValue(new Error('Agent not found'));

            await agentController.getAgent(req as Request, res as Response);

            expect(agentService.getAgentConfiguration).toHaveBeenCalledWith('nonexistent');
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Agent not found' });
        });
    });

    describe('getAgents', () => {
        it('should retrieve agents by owner and return them', async () => {
            req.query = { owner: 'owner1' };
            const mockAgents = [{ id: 'agent1' }, { id: 'agent2' }];
            (agentService.getAgents as jest.Mock).mockResolvedValue(mockAgents);

            await agentController.getAgents(req as Request, res as Response);

            expect(agentService.getAgents).toHaveBeenCalledWith('owner1');
            expect(jsonMock).toHaveBeenCalledWith(mockAgents);
        });

        it('should return 401 when owner query is missing', async () => {
            req.query = {};

            await agentController.getAgents(req as Request, res as Response);

            expect(agentService.getAgents).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Bad Request' });
        });

        it('should return 404 when agents are not found', async () => {
            req.query = { owner: 'owner1' };
            (agentService.getAgents as jest.Mock).mockResolvedValue([]);

            await agentController.getAgents(req as Request, res as Response);

            expect(agentService.getAgents).toHaveBeenCalledWith('owner1');
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Agent not found' });
        });
    });

    describe('getAccount', () => {
        it('should retrieve account information and return it', async () => {
            // @ts-ignore
            req.user = { email: 'user@example.com' };
            const mockAccount = { email: 'user@example.com', name: 'User' };
            (agentService.getAccount as jest.Mock).mockResolvedValue(mockAccount);

            await agentController.getAccount(req as Request, res as Response);

            expect(agentService.getAccount).toHaveBeenCalledWith('user@example.com');
            expect(jsonMock).toHaveBeenCalledWith(mockAccount);
        });

        it('should return 500 when an error occurs', async () => {
            // @ts-ignore
            req.user = { email: 'user@example.com' };
            (agentService.getAccount as jest.Mock).mockRejectedValue(new Error('Service error'));

            await agentController.getAccount(req as Request, res as Response);

            expect(agentService.getAccount).toHaveBeenCalledWith('user@example.com');
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error fetching account data' });
        });
    });

    describe('updateAccount', () => {
        it('should update account information and return it', async () => {
            // @ts-ignore
            req.user = { email: 'user@example.com' };
            req.body = { name: 'New Name' };
            const mockUpdatedAccount = { email: 'user@example.com', name: 'New Name' };
            (agentService.updateAccount as jest.Mock).mockResolvedValue(mockUpdatedAccount);

            await agentController.updateAccount(req as Request, res as Response);

            expect(agentService.updateAccount).toHaveBeenCalledWith('user@example.com', { name: 'New Name' });
            expect(jsonMock).toHaveBeenCalledWith(mockUpdatedAccount);
        });

        it('should return 500 when an error occurs', async () => {
            // @ts-ignore
            req.user = { email: 'user@example.com' };
            req.body = { name: 'New Name' };
            (agentService.updateAccount as jest.Mock).mockRejectedValue(new Error('Service error'));

            await agentController.updateAccount(req as Request, res as Response);

            expect(agentService.updateAccount).toHaveBeenCalledWith('user@example.com', { name: 'New Name' });
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error updating account data' });
        });
    });
});