import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';

export const paymentController = {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, payment_method } = req.body;
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }
      const paymentIntent = await paymentService.createPaymentIntent(amount, payment_method);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};