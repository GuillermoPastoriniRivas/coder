import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Grid, Snackbar, Alert, Card, CardContent } from '@mui/material';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import api from '../api';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function Pricing() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');
    const { saldo, updateSaldo } = useAuth(); // Destructure saldo and updateSaldo

    const pricingPlans = [
        {
            id: 1,
            tokens: 20,
            price: '$ 5.00'
        },
        {
            id: 2,
            tokens: 40,
            price: '$ 8.00'
        },
        {
            id: 3,
            tokens: 100,
            price: '$ 15.00'
        }
    ];

    useEffect(() => {
        // Optionally fetch saldo on component mount
    }, []);

    const handlePurchase = async (plan) => {
        try {
            const response = await api.purchaseTokens(plan.tokens);
            // Assuming the backend returns the updated saldo
            const newSaldo = response.data.saldo;
            updateSaldo(newSaldo); // Update saldo in context
            setMessage(`Successfully purchased ${plan.tokens} tokens.`);
            setSeverity('success');
            setOpen(true);
        } catch (error) {
            console.error('Error purchasing tokens:', error);
            setMessage('Error processing the purchase. Please try again.');
            setSeverity('error');
            setOpen(true);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Choose the plan that best suits your needs.
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 6 }}>
                <AccountBalanceWalletIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Current Balance: <strong>{saldo} Credits</strong>
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {pricingPlans.map((plan) => (
                    <Grid item xs={12} sm={6} md={4} key={plan.id}>
                        <Card
                            sx={{
                                border: '2px solid',
                                borderColor: 'primary.main',
                                borderRadius: '12px',
                                boxShadow: 3,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 6,
                                },
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {plan.tokens} Credits
                                </Typography>
                                
                                <Typography variant="h6" color="text.secondary">
                                {plan.price} USD
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    onClick={() => handlePurchase(plan)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        paddingY: 1.5,
                                        borderRadius: 2,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: 'none',
                                            backgroundColor: 'primary.dark',
                                        },
                                    }}
                                >
                                    But Now
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </Container>
    );
}