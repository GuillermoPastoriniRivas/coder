import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Grid, Snackbar, Alert, TextField, FormControl, FormLabel, RadioGroup, Radio, FormControlLabel, Paper, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Divider } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// Initialize Stripe with your publishable key (ensure this is loaded securely, e.g., from env vars)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R6WMSJKjJZ1brsJeiejXniqKyTzfo6XXjlfXNmWyrx4RzhyMo2UvJkJMAHEtwTZiml07SYRPZDwQU85t0MOHrHl00pBnExPXy'); // Fallback for local dev

// Style options for the CardElement
const CARD_ELEMENT_OPTIONS = (themeMode) => ({
  style: {
    base: {
      color: themeMode === 'dark' ? '#d4d4d4' : '#32325d',
      fontFamily: '"Consolas", "Courier New", monospace', // Monospace font for card details
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: themeMode === 'dark' ? '#858585' : '#aab7c4',
      },
       iconColor: themeMode === 'dark' ? '#d4d4d4' : '#32325d', // Match icon color to text
    },
    invalid: {
      color: '#fa755a', // Error color
      iconColor: '#fa755a',
    },
    complete: {
      color: themeMode === 'dark' ? '#4caf50' : '#4caf50', // Use success color for completion
      iconColor: themeMode === 'dark' ? '#4caf50' : '#4caf50',
    }
  },
  hidePostalCode: true, // Optional: Hide postal code field if not needed
});

function PaymentForm() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedAmount, setSelectedAmount] = useState(10); // Default selected amount
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // Default to card
  const [processing, setProcessing] = useState(false);
  const { updateSaldo, saldo } = useAuth(); // Get saldo update function and current saldo

  // Purchase History State
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const stripe = useStripe();
  const elements = useElements();

  // Use theme mode to adjust card element style (assuming theme context or similar is available if needed)
  // For now, let's assume a dark theme context is implicitly applied via ThemeProvider
  const themeMode = 'dark'; // Replace with dynamic theme detection if necessary

  const predefinedAmounts = [5, 10, 20, 50, 100]; // Common top-up amounts

   // Fetch purchase history on mount
   useEffect(() => {
       fetchPurchaseHistory();
   }, []);

  // Snackbar handler
  const handleSnackbarOpen = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount(''); // Clear custom amount when predefined is selected
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers (optional: allow decimal for custom amounts)
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null); // Clear predefined selection
    }
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

   // Function to fetch purchase history
   const fetchPurchaseHistory = async () => {
       setLoadingHistory(true);
       setHistoryError(null);
       try {
           const response = await api.getPurchaseHistory();
           setPurchaseHistory(response.data || []); // Assuming API returns an array of history items
       } catch (error) {
           console.error('Error fetching purchase history:', error);
           setHistoryError(error.response?.data?.message || 'Failed to load purchase history.');
           // Optional: Show snackbar error
           handleSnackbarOpen('Failed to load purchase history.', 'error');
       } finally {
           setLoadingHistory(false);
       }
   };


  const handlePayment = async (e) => {
    e.preventDefault();

    let amountToCharge = selectedAmount;
    if (!amountToCharge && customAmount) {
      amountToCharge = parseFloat(customAmount);
    }

    if (!amountToCharge || amountToCharge <= 0) {
      handleSnackbarOpen("Please select or enter a valid amount.", "error");
      return;
    }
    if (amountToCharge < 1) { // Example minimum charge amount
        handleSnackbarOpen("Minimum top-up amount is $1.", "error");
        return;
    }


    if (paymentMethod === 'paypal') {
      // PayPal integration logic would go here
      handleSnackbarOpen("PayPal is not yet integrated.", "info");
      return;
    }

    // Card payment logic
    if (!stripe || !elements) {
      handleSnackbarOpen("Payment system is not ready. Please try again later.", "error");
      console.error("Stripe.js has not loaded yet.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        handleSnackbarOpen("Card details are missing or invalid.", "error");
        console.error("CardElement not found.");
        return;
    }

    setProcessing(true);
    try {
      // 1. Create Payment Intent on the backend
      // Amount should be in cents
      const { data } = await api.createPaymentIntent(Math.round(amountToCharge * 100), paymentMethod);
      const clientSecret = data.clientSecret;

      // 2. Confirm the card payment with Stripe.js
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          // billing_details: { name: 'Customer Name' }, // Optional: Add billing details if needed
        }
      });

      if (result.error) {
        // Show error to your customer (e.g., insufficient funds, card declined)
        console.error("Stripe payment confirmation error:", result.error);
        handleSnackbarOpen(result.error.message || "Payment failed. Please try again.", "error");
      } else {
        // Payment succeeded
        if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          console.log("PaymentIntent succeeded:", result.paymentIntent);
          // 3. Call backend to update user's credits/saldo based on the successful payment
          try {
            // Pass the amount in dollars (or the intended credit value)
            // IMPORTANT: The backend '/purchase-tokens' should now also record the purchase history.
            await api.purchaseTokens(amountToCharge);
            const newSaldo = saldo + amountToCharge; // Calculate expected new saldo locally for immediate feedback
            updateSaldo(newSaldo); // Update context immediately
            handleSnackbarOpen(`Payment of $${amountToCharge.toFixed(2)} successful! Credits added. New balance: $${newSaldo.toFixed(2)}`, "success");
            // Clear form elements after success
            cardElement.clear();
            setSelectedAmount(10); // Reset to default amount
            setCustomAmount('');
            // Refresh purchase history after successful payment
            fetchPurchaseHistory();
          } catch (purchaseError) {
            console.error("Error updating credits after successful payment:", purchaseError);
            handleSnackbarOpen("Payment successful, but failed to update credits or history. Please contact support.", "warning");
             // Fetch saldo again to ensure consistency despite error
            fetchSaldo();
            // Try fetching history again too
            fetchPurchaseHistory();
          }
        } else {
            // Handle unexpected payment intent status
             console.warn("Unexpected PaymentIntent status:", result.paymentIntent?.status);
             handleSnackbarOpen("Payment status uncertain. Please check your balance or contact support.", "warning");
             fetchSaldo(); // Fetch saldo to get latest status
             fetchPurchaseHistory(); // Fetch history as well
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error.response?.data?.message || "An unexpected error occurred during payment.";
      handleSnackbarOpen(errorMessage, "error");
    } finally {
      setProcessing(false);
    }
  };

   // Function to fetch saldo (useful after operations)
   const fetchSaldo = async () => {
     try {
         const response = await api.getSaldo();
         updateSaldo(response.data.saldo);
     } catch (error) {
         console.error('Error fetching saldo:', error);
         // Handle error silently or show a message
     }
   };


  return (
    <Box> {/* Main container for payment form and history */}
      {/* Use a Paper component for better visual structure in dark mode */}
      <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
          Add Credits
        </Typography>

        {/* Amount Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            Select Amount ($USD):
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {predefinedAmounts.map((amount) => (
              <Grid item key={amount}>
                <Button
                  variant={selectedAmount === amount ? "contained" : "outlined"}
                  onClick={() => handleAmountSelect(amount)}
                  disabled={processing}
                  sx={{ py: 1.5, px: 2.5 }} // Adjust padding for better button size
                >
                  ${amount}
                </Button>
              </Grid>
            ))}
            <Grid>
            <TextField
            fullWidth
            label="Or Enter Custom Amount ($)"
            type="text" // Use text to allow decimal input with validation
            inputMode='decimal' // Hint for mobile keyboards
            value={customAmount}
            sx={{
              marginLeft: '1rem',
              marginTop: '10px',
              maxWidth: '187px'
            }}
            onChange={handleCustomAmountChange}
            disabled={processing}
            placeholder=" 12.25"
            InputProps={{
              startAdornment: <Typography sx={{ ml: 0.5 }}>$</Typography>, // Show $ sign
            }}
          />
            </Grid>
          </Grid>

        </Box>

        {/* Payment Method Selection */}
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset" disabled={processing}>
            <FormLabel component="legend">Payment Method</FormLabel>
            <RadioGroup row value={paymentMethod} onChange={handlePaymentMethodChange}>
              <FormControlLabel value="card" control={<Radio />} label="Debit/Credit Card" />
              <FormControlLabel value="paypal" control={<Radio />} label="PayPal" disabled /> {/* Keep PayPal disabled for now */}
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Card Details Form */}
        {paymentMethod === 'card' && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Enter Card Details:
            </Typography>
             {/* Container for Stripe CardElement with background and border */}
             <Box className="StripeElement" sx={{ p: 0, borderRadius: 1 }}> {/* Use class for styling */}
               <CardElement options={CARD_ELEMENT_OPTIONS(themeMode)} />
             </Box>
          </Box>
        )}

        {/* Pay Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePayment}
            disabled={processing || !stripe || !elements || (paymentMethod === 'card' && !elements.getElement(CardElement))} // More robust disable check
            size="large"
            sx={{ fontWeight: 600, px: 5, py: 1.5 }} // Make button prominent
          >
            {processing ? <CircularProgress size={24} color="inherit" /> : `Add $${(selectedAmount || parseFloat(customAmount || 0)).toFixed(2)} Credits`}
          </Button>
        </Box>

         {/* Snackbar for feedback */}
         <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                {snackbar.message}
            </Alert>
         </Snackbar>
      </Paper>

       {/* Purchase History Section */}
       <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Purchase History
          </Typography>
          {loadingHistory && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
              </Box>
          )}
          {historyError && !loadingHistory && (
               <Alert severity="error" sx={{ mb: 2 }}>
                   {historyError}
               </Alert>
          )}
          {!loadingHistory && !historyError && purchaseHistory.length === 0 && (
               <Typography variant="body2" color="text.secondary">
                   No purchase history found.
               </Typography>
          )}
          {!loadingHistory && !historyError && purchaseHistory.length > 0 && (
              <TableContainer>
                  <Table size="small">
                      <TableHead>
                          <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell align="right">Amount ($)</TableCell>
                              <TableCell>Status</TableCell>
                              {/* Add more columns if available, e.g., Payment ID */}
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {purchaseHistory.map((purchase) => (
                              <TableRow key={purchase._id || purchase.id}> {/* Use a unique key */}
                                  <TableCell component="th" scope="row">
                                      {new Date(purchase.timestamp).toLocaleDateString()} {new Date(purchase.timestamp).toLocaleTimeString()}
                                  </TableCell>
                                  <TableCell align="right">{purchase.amount.toFixed(2)}</TableCell>
                                  <TableCell>{purchase.status || 'Completed'}</TableCell> {/* Assuming status field exists */}
                                  {/* Render more cells */}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </TableContainer>
          )}
        </Paper>
    </Box>
  );
}

export default function Pricing() {
  return (
     // Center the payment form on the page
     <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
        <Elements stripe={stripePromise}>
          <PaymentForm />
        </Elements>
     </Container>
  );
}