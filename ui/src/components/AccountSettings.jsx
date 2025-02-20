import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Snackbar, Alert } from '@mui/material';
import api from '../api';

export default function AccountSettings() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');

    useEffect(() => {
        // Fetch current account settings
        const fetchAccountSettings = async () => {
            try {
                const response = await api.get('/account');
                setEmail(response.data.email);
                setUsername(response.data.username);
            } catch (error) {
                console.error('Error fetching account settings:', error);
            }
        };
        fetchAccountSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/account', { email, username, password });
            setMessage('Configuración de cuenta actualizada exitosamente.');
            setSeverity('success');
            setOpen(true);
            setPassword('');
        } catch (error) {
            console.error('Error updating account settings:', error);
            setMessage('Error al actualizar la configuración de la cuenta.');
            setSeverity('error');
            setOpen(true);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
                    Configuración de Cuenta
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Nombre de Usuario"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 2 }}
                        helperText="Deja este campo vacío si no deseas cambiar la contraseña."
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth>
                        Guardar Cambios
                    </Button>
                </Box>
            </Box>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </Container>
    );
}