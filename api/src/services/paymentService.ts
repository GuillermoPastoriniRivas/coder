import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51R6WMSJKjJZ1brsJwJWQ7j0G6g1Rxt5l3sinkJ05MD3aHPnAGhPmL5GeIU1ZH9pByYlwo1LTnSLFZYj8tl53tNcY00K0wkUFOj';
const stripe = new Stripe(stripeSecretKey);

export const paymentService = {
  async createPaymentIntent(amount: number, payment_method: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });
    return paymentIntent;
  }
};