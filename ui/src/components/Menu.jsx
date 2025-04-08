import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Tooltip, IconButton, Menu as MuiMenu, MenuItem, Avatar } from '@mui/material'; // Added Tooltip, IconButton, MuiMenu, MenuItem, Avatar
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Default avatar icon
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Icon for credits
import HistoryIcon from '@mui/icons-material/History'; // Icon for history
import HomeIcon from '@mui/icons-material/Home'; // Icon for Home
import DescriptionIcon from '@mui/icons-material/Description'; // Icon for Docs
import SettingsIcon from '@mui/icons-material/Settings'; // Icon for Account Settings
import LogoutIcon from '@mui/icons-material/Logout'; // Icon for Log Out
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Menu() {
    const { email, logout, saldo, updateSaldo } = useAuth(); // Get user email and saldo
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null); // Anchor element for user menu

    const open = Boolean(anchorEl); // User menu open state

    // Fetch saldo periodically or on specific events if needed
    useEffect(() => {
        const fetchSaldo = async () => {
            try {
                const response = await api.getSaldo();
                updateSaldo(response.data.saldo);
            } catch (error) {
                console.error('Error fetching saldo in menu:', error);
                // Optionally handle error, e.g., show a disconnected status
            }
        };

         // Fetch immediately on mount
         fetchSaldo();

         // Optional: Fetch periodically (e.g., every 5 minutes)
         // const intervalId = setInterval(fetchSaldo, 5 * 60 * 1000);
         // return () => clearInterval(intervalId); // Cleanup interval on unmount

    }, [updateSaldo]); // Rerun if updateSaldo function changes (should be stable)

    // User Menu Handlers
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose(); // Close menu first
        logout();
        navigate('/login'); // Redirect to login after logout
    };

    const handleAccountClick = () => {
         handleMenuClose();
         navigate('/account');
    };

    const handleCallHistoryClick = () => {
        handleMenuClose();
        navigate('/call-history');
    };


    // Get initials for Avatar fallback
    const getInitials = (userEmail) => {
        return userEmail ? userEmail.charAt(0).toUpperCase() : '?';
    };


    return (
        // Use position="sticky" or "fixed" if you want the menu to stay at the top while scrolling
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 49 } }}>
                {/* Logo/Brand Name */}
                 <Button color="inherit" component={RouterLink} to="/" sx={{ padding: 0 }}> {/* Link to home */}
                     <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        CoderM8
                    </Typography>
                 </Button>

                {/* Right side items */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}> {/* Use gap for spacing */}
                     {/* Credits Display */}
                    <Tooltip title={`Remaining Credits: $${saldo?.toFixed(2)}`}>
                        <Button
                            color="inherit"
                            component={RouterLink}
                            to="/pricing"
                            size="small"
                            startIcon={<MonetizationOnIcon fontSize="small" sx={{ color: saldo < 5 ? 'warning.main' : 'success.main' }} />} // Conditional icon color
                            sx={{
                                color: 'text.secondary', // Use secondary text color
                                borderRadius: '20px', // Pill shape
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'action.hover' }, // Subtle hover
                                display: { xs: 'none', sm: 'flex' } // Hide on extra small screens, show on small and up
                            }}
                        >
                             {saldo?.toFixed(2)} Credits
                        </Button>
                    </Tooltip>

                    {/* Navigation Buttons (Optional - can be in user menu) */}
                     {/*
                     <Button color="inherit" component={RouterLink} to="/docs" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Docs</Button>
                     */}

                    {/* User Menu */}
                     <Tooltip title="Account Menu">
                         <IconButton
                             onClick={handleMenuOpen}
                             size="small"
                             sx={{ ml: 1 }} // Margin left
                             aria-controls={open ? 'account-menu' : undefined}
                             aria-haspopup="true"
                             aria-expanded={open ? 'true' : undefined}
                         >
                             <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                 {getInitials(email)}
                             </Avatar>
                         </IconButton>
                     </Tooltip>
                     <MuiMenu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={open}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose} // Close menu on item click
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                '& .MuiAvatar-root': { // Style avatar inside menu if needed
                                    width: 32,
                                    height: 32,
                                    ml: -0.5,
                                    mr: 1,
                                },
                                '&:before': { // Arrow pointing up
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor: 'background.paper',
                                    transform: 'translateY(-50%) rotate(45deg)',
                                    zIndex: 0,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled sx={{ opacity: '1 !important' }}> {/* Display email (disabled item) */}
                            <Typography variant="body2" color="text.secondary">{email}</Typography>
                        </MenuItem>
                         <MenuItem onClick={() => navigate('/')}> {/* Home/Dashboard Link */}
                             <HomeIcon fontSize="small" sx={{ mr: 1 }} /> Home
                         </MenuItem>
                         {/* Credits link for smaller screens */}
                         <MenuItem component={RouterLink} to="/pricing" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                            <MonetizationOnIcon fontSize="small" sx={{ mr: 1, color: saldo < 5 ? 'warning.main' : 'success.main' }} /> Add Credits (${saldo?.toFixed(2)})
                         </MenuItem>
                   
                         <MenuItem onClick={handleCallHistoryClick}>
                             <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> History
                         </MenuItem>
                         <MenuItem onClick={() => navigate('/docs')}>
                            <DescriptionIcon fontSize="small" sx={{ mr: 1 }} /> Docs
                         </MenuItem>
                        <MenuItem onClick={handleAccountClick}>
                            <SettingsIcon fontSize="small" sx={{ mr: 1 }} /> Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout} sx={{paddingBottom: '10px'}}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Log Out
                        </MenuItem>
                    </MuiMenu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}