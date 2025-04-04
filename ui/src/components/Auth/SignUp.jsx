import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, TextField, Link, Alert, CircularProgress } from '@mui/material'; // Added Alert, CircularProgress
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // State for sign-up errors
    const [loading, setLoading] = useState(false); // State for loading indicator
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true); // Start loading
        try {
            await signUp(email, password, username);
            navigate('/'); // Navigate to main app view on successful sign-up
        } catch (err) {
            console.error('SignUp failed:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create account. Please try again.';
            setError(errorMessage);
            setLoading(false); // Stop loading on error
        }
         // No need to setLoading(false) on success because navigation happens
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
             <Box
                className="auth-container" // Use class from App.css for common auth styling
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    p: 4,
                }}
            >
                <PersonAddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Create New Account
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                     <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                         {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                    </Button>
                </Box>

                <Typography variant="body2" align="center">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" variant="body2">
                        Log In here
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}