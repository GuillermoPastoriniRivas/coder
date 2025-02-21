import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, TextField, Link } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signUp(email, password, username);
            navigate('/agents');
        } catch (error) {
            console.error('SignUp failed:', error);
            setError('Failed to create account. Please try again.');
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3, textAlign: 'center' }}>
                <PersonAddIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 3 }}>
                    Crear Nueva Cuenta
                </Typography>

                {error && (
                    <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

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
                        label="Nombre de Usuario"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                        Registrarse
                    </Button>
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    <Link component={RouterLink} to="/login">
                        Ya tienes una cuenta, inicia sesion aqui
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}