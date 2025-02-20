import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, TextField } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/agents');
        } catch (error) {
            console.error('Login failed:', error);
            // Puedes agregar manejo de errores aquí
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3, textAlign: 'center' }}>
                <LockOpenIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 3 }}>
                    Bienvenido de Nuevo
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{ sx: { borderRadius: 2 } }}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Contraseña"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{ sx: { borderRadius: 2 } }}
                    />

                    <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, py: 1.5, borderRadius: 2 }}>
                        Continuar
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}