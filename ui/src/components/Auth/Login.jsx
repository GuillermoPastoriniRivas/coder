import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, TextField, Link } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { email: authEmail, login } = useAuth();

    useEffect(() => {
        if (authEmail) {
            navigate('/signup');
        }
    }, [authEmail, navigate]);

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
        <Container maxWidth="xs" className="section_gap_top">
            <Box className="box-shadow border-radius p-25 text-center mb-50">
                <LockOpenIcon className="icon-large primary-color mb-15" />
                <Typography variant="h4" className="main-title mb-25">
                    Bienvenido de Nuevo
                </Typography>

                <Box component="form" onSubmit={handleSubmit} className="form-container">
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="single-input mb-15"
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Contraseña"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="single-input mb-25"
                    />

                    <Button type="submit" fullWidth className="primary_btn"  sx={{marginTop: '1rem', color: 'white'}}>
                        Continuar
                    </Button>
                </Box>

                <Typography variant="body2" sx={{marginTop: '30px'}}>
                    <Link component={RouterLink} to="/signup" className="link-style">
                        No tienes una cuenta, crea una aqui
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}