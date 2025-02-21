import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Grid, Snackbar, Alert, Card, CardContent } from '@mui/material';
import api from '../api';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function Pricing() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');
    const [saldo, setSaldo] = useState(0);

    const pricingPlans = [
        {
            id: 1,
            name: 'Básico',
            tokens: 100,
            price: '$9.99'
        },
        {
            id: 2,
            name: 'Estándar',
            tokens: 500,
            price: '$39.99'
        },
        {
            id: 3,
            name: 'Premium',
            tokens: 1200,
            price: '$89.99'
        }
    ];

    useEffect(() => {
        const fetchSaldo = async () => {
            try {
                const response = await api.getAccount();
                setSaldo(response.data.saldo);
            } catch (error) {
                console.error('Error fetching saldo:', error);
                setMessage('Error al obtener el saldo. Inténtalo de nuevo.');
                setSeverity('error');
                setOpen(true);
            }
        };
        fetchSaldo();
    }, []);

    const handlePurchase = async (plan) => {
        try {
            await api.post('/purchase-tokens', { tokens: plan.tokens });
            setMessage(`Has recargado $${plan.price} y añadido ${plan.tokens} tokens a tu saldo.`);
            setSeverity('success');
            setOpen(true);
            // Actualizar el saldo después de la compra
            const response = await api.getAccount();
            setSaldo(response.data.tokens);
        } catch (error) {
            console.error('Error al comprar tokens:', error);
            setMessage('Error al procesar la recarga. Inténtalo de nuevo.');
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
                    Elige el plan que mejor se adapte a tus necesidades.
                </Typography>
              
            </Box>

            {/* Sección de Saldo */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 6 }}>
                <AccountBalanceWalletIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Saldo Actual: <strong>{saldo} Tokens</strong>
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
                                    {plan.name}
                                </Typography>
                                <Typography variant="h3" color="primary" gutterBottom>
                                    {plan.price}
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    {plan.tokens} Tokens
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
                                    Recargar Saldo
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