import { Request, Response } from 'express';
import { authController } from '../../controllers/authController';
import { authService } from '../../services/authService';

jest.mock('../../services/authService');

describe('AuthController', () => {
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
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should return token when credentials are valid', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };
            (authService.authenticateUser as jest.Mock).mockResolvedValue('mockedToken');

            await authController.login(req as Request, res as Response);

            expect(authService.authenticateUser).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(jsonMock).toHaveBeenCalledWith({ token: 'mockedToken' });
        });

        it('should return 401 when credentials are invalid', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpassword' };
            (authService.authenticateUser as jest.Mock).mockResolvedValue(null);

            await authController.login(req as Request, res as Response);

            expect(authService.authenticateUser).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        });

        it('should return 500 when an error occurs', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };
            (authService.authenticateUser as jest.Mock).mockRejectedValue(new Error('Database error'));

            await authController.login(req as Request, res as Response);

            expect(authService.authenticateUser).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});