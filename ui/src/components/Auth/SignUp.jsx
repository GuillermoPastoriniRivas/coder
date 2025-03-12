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
            navigate('/');
        } catch (error) {
            console.error('SignUp failed:', error);
            setError('Failed to create account. Please try again.');
        }
    };

    return (
        <Container maxWidth="xs" className="section_gap_top">
            <Box className="box-shadow border-radius p-25 text-center mb-50">
                <PersonAddIcon className="icon-large primary-color mb-15" />
                <Typography variant="h4" className="main-title mb-25">
                    Crear Nueva Cuenta
                </Typography>

                {error && (
                    <Typography variant="body1" color="error" className="error-message mb-15">
                        {error}
                    </Typography>
                )}

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
                        label="Nombre de Usuario"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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

                    <Button type="submit" fullWidth className="primary_btn" sx={{marginTop: '1rem', color: 'white'}}>
                        Registrarse
                    </Button>
                </Box>

                <Typography variant="body2" sx={{marginTop: '30px'}}>
                    <Link component={RouterLink} to="/login" className="link-style">
                        Ya tienes una cuenta, inicia sesion aqui
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}