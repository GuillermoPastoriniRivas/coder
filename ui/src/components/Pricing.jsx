import React, { useState } from 'react';
import { Container, Box, Typography, Button, Grid, Snackbar, Alert, TextField, FormControl, FormLabel, RadioGroup, Radio, FormControlLabel } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51R6WMSJKjJZ1brsJeiejXniqKyTzfo6XXjlfXNmWyrx4RzhyMo2UvJkJMAHEtwTZiml07SYRPZDwQU85t0MOHrHl00pBnExPXy');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#d4d4d4',
      fontSize: '16px',
      fontFamily: '"Consolas", "Courier New", monospace',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#d4d4d4',
      },
      ':focus': {
        color: '#d4d4d4',
      },
    },
    invalid: {
      color: '#ad323b',
      ':focus': {
        color: '#ad323b',
      },
    },
    complete: {
      color: '#5787af',
    }
  },
  hidePostalCode: true,
};

// Main Payment Component
function PaymentForm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('debito');
  const [processing, setProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  const predefinedAmounts = [2, 5, 10, 20, 50, 100, 500];

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    let amount = selectedAmount;
    if (!amount && customAmount) {
      amount = parseFloat(customAmount);
    }
    if (!amount || amount <= 0) {
      setMessage("Por favor, ingresa o selecciona un monto válido.");
      setSeverity("error");
      setOpen(true);
      return;
    }

    if (paymentMethod === 'paypal') {
      setMessage("Redirigiendo a PayPal...");
      setSeverity("info");
      setOpen(true);
      window.location.href = "https://www.paypal.com";
      return;
    }

    if (!stripe || !elements) {
      setMessage("Stripe no está disponible.");
      setSeverity("error");
      setOpen(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount * 100, payment_method: paymentMethod })
      });
      const data = await response.json();
      const clientSecret = data.clientSecret;
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });
      if (result.error) {
        setMessage(result.error.message || "Error en el pago.");
        setSeverity("error");
        setOpen(true);
      } else {
        if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          setMessage("Pago exitoso de $" + amount);
          setSeverity("success");
          setOpen(true);
        }
      }
    } catch (error) {
      setMessage("Error procesando el pago.");
      setSeverity("error");
      setOpen(true);
    }
    setProcessing(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Top Up
        </Typography>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select amount:
        </Typography>
        <Grid container spacing={2}>
          {predefinedAmounts.map((amount) => (
            <Grid item key={amount}>
              <Button
                sx={{padding: '15px'}}
                variant={selectedAmount === amount ? "contained" : "outlined"}
                onClick={() => handleAmountSelect(amount)}
              >
                ${amount}
              </Button>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Custom Amount"
              type="number"
              value={customAmount}
              onChange={handleCustomAmountChange}
            />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Payment Method</FormLabel>
          <RadioGroup row value={paymentMethod} onChange={handlePaymentMethodChange}>
            <FormControlLabel value="debito" control={<Radio />} label="Debit/Credit" />
            <FormControlLabel value="paypal" control={<Radio />} label="PayPal" />
          </RadioGroup>
        </FormControl>
      </Box>
      {paymentMethod !== 'paypal' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Enter your card details:
          </Typography>
          <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </Box>
        </Box>
      )}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePayment}
          disabled={processing}
          sx={{ textTransform: 'none', fontWeight: 600, paddingY: 1.5 }}
        >
          {processing ? "Procesando..." : "Pagar"}
        </Button>
      </Box>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

// Wrapper component that provides Stripe context
export default function Pricing() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}