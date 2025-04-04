import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Snackbar, Alert, CircularProgress, Paper } from '@mui/material';
import api from '../api'; // Assuming API setup handles auth token

export default function AccountSettings() {
    const [initialEmail, setInitialEmail] = useState(''); // Store initial email
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(''); // For changing password
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirm new password

    // UI State
    const [loading, setLoading] = useState(true); // Loading initial data
    const [saving, setSaving] = useState(false); // Saving changes
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch current account settings on component mount
    useEffect(() => {
        const fetchAccountSettings = async () => {
            setLoading(true);
            try {
                // Assuming your API returns { email, username }
                const response = await api.getAccount(); // Use the correct API endpoint
                setEmail(response.data.email);
                setInitialEmail(response.data.email); // Store the initial email
                setUsername(response.data.username);
            } catch (error) {
                console.error('Error fetching account settings:', error);
                handleSnackbarOpen('Failed to load account settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchAccountSettings();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Snackbar handler
    const handleSnackbarOpen = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (password && password !== confirmPassword) {
            handleSnackbarOpen('Passwords do not match.', 'error');
            return;
        }
        if (password && password.length < 6) { // Example minimum password length
             handleSnackbarOpen('Password must be at least 6 characters long.', 'error');
             return;
        }

        setSaving(true);
        try {
             const updateData = { email, username };
             // Only include password if it's being changed
             if (password) {
                 updateData.password = password;
             }

            await api.updateAccount(updateData); // Use the correct API endpoint and data structure
            handleSnackbarOpen('Account settings updated successfully.', 'success');
            setPassword(''); // Clear password fields after successful update
            setConfirmPassword('');
            setInitialEmail(email); // Update initial email if changed successfully

             // Optional: Force reload or update context if email/username change affects other parts of UI immediately
             // window.location.reload(); or update AuthContext

        } catch (error) {
            console.error('Error updating account settings:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update account settings.';
            handleSnackbarOpen(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Determine if changes have been made
    const hasChanges = email !== initialEmail || Boolean(password); // Simplified check

    return (
        <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 } }}> {/* Add some top margin */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}> {/* Use Paper for background and border */}
                <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
                    Account Settings
                </Typography>

                {loading ? (
                     <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                         <CircularProgress />
                     </Box>
                 ) : (
                     <Box component="form" onSubmit={handleSubmit}>
                         <TextField
                            margin="normal"
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={saving}
                         />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={saving}
                        />
                        <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Change Password</Typography>
                        <TextField
                            margin="normal"
                            fullWidth
                            name="password"
                            label="New Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={saving}
                            helperText="Leave blank to keep current password."
                        />
                         <TextField
                            margin="normal"
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={saving || !password} // Disable if no new password entered
                            required={Boolean(password)} // Required only if new password is set
                            error={Boolean(password && password !== confirmPassword)} // Show error if passwords don't match
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={saving || !hasChanges} // Disable if saving or no changes detected
                            sx={{ mt: 4, py: 1.5 }}
                        >
                             {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </Box>
                 )}
            </Paper>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}