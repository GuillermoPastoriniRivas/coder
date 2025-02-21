import { Request, Response } from 'express';
import { publicController } from '../../controllers/publicController';
import { Agent } from '../../models/agent';

jest.mock('../../models/agent');

describe('PublicController', () => {
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
            params: {},
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPublicAgent', () => {
        it('should return public agent data when agent is found', async () => {
            req.params = { publicId: 'agent123' };
            const mockAgent = {
                publicId: 'agent123',
                tools: [
                    { name: 'Tool1', enabled: true },
                    { name: 'Tool2', enabled: false },
                    { name: 'Tool3', enabled: true },
                ],
                owner: 'ownerId',
                modelConfig: { apiKey: 'secret' },
                __v: 0,
            };
            (Agent.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockAgent),
                }),
            });

            await publicController.getPublicAgent(req as Request, res as Response);

            expect(Agent.findOne).toHaveBeenCalledWith({ publicId: 'agent123' });
            expect(jsonMock).toHaveBeenCalledWith({
                publicId: 'agent123',
                tools: ['Tool1', 'Tool3'],
            });
        });

        it('should return 404 when agent is not found', async () => {
            req.params = { publicId: 'nonexistent' };
            (Agent.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            await publicController.getPublicAgent(req as Request, res as Response);

            expect(Agent.findOne).toHaveBeenCalledWith({ publicId: 'nonexistent' });
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Agent not found' });
        });

        it('should return 500 when an error occurs', async () => {
            req.params = { publicId: 'agent123' };
            (Agent.findOne as jest.Mock).mockImplementation(() => {
                throw new Error('Database error');
            });

            await publicController.getPublicAgent(req as Request, res as Response);

            expect(Agent.findOne).toHaveBeenCalledWith({ publicId: 'agent123' });
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});