import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, TextField, Link, Alert, CircularProgress } from '@mui/material'; // Added Alert, CircularProgress
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // State for login errors
    const [loading, setLoading] = useState(false); // State for loading indicator
    const navigate = useNavigate();
    const { email: authEmail, login } = useAuth();

    // Redirect if already logged in (e.g., navigated back to /login)
    useEffect(() => {
        if (authEmail) {
            navigate('/'); // Redirect to the main app view (OpenFolder)
        }
    }, [authEmail, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true); // Start loading indicator
        try {
            await login(email, password);
            navigate('/'); // Navigate to main app view on successful login
        } catch (err) {
            console.error('Login failed:', err);
            // Provide more specific error messages if possible
            const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            setLoading(false); // Stop loading on error
        }
        // No need to setLoading(false) on success because navigation happens
    };

    return (
        // Use Container to center content with max width
        <Container component="main" maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
             {/* Box provides the styled form container */}
            <Box
                className="auth-container" // Use class from App.css for common auth styling
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%', // Ensure box takes full width of container
                    p: 4, // Add padding inside the box
                }}
            >
                <LockOpenIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Welcome Back
                </Typography>

                {/* Display error messages */}
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading} // Disable fields while loading
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading} // Disable fields while loading
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loading} // Disable button while loading
                        sx={{ mt: 3, mb: 2, py: 1.5 }} // Add vertical padding
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
                    </Button>
                </Box>

                {/* Link to Sign Up page */}
                <Typography variant="body2" align="center">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/signup" variant="body2">
                        Sign Up here
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}