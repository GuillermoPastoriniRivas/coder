import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Menu() {
    const { logout, saldo, updateSaldo } = useAuth();
    const navigate = useNavigate();

    // If you have the optional /user/saldo route
    const fetchSaldo = async () => {
        try {
            const response = await api.getSaldo();
            updateSaldo(response.data.saldo);
        } catch (error) {
            console.error('Error fetching saldo:', error);
            updateSaldo(0);
        }
    };

    useEffect(() => {
        // fetchSaldo();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Button color="inherit" component={Link} to="/">
                    <Typography variant="h6" sx={{ color: 'white' }}>
                        Gecode
                    </Typography>
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box className="saldo-container">
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/pricing">
                            {saldo.toFixed(2)} Credits remaining {' '}
                            <span style={{color: "#5787af", marginLeft: '10px'}}>{saldo < 6 ? ' Buy more here' : ''}</span>
                        </Button>
                    </Box>
                    <Box sx={{ mr: '30px' }}>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/">
                            Home
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/account">
                            Account
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/docs">
                            Docs
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
}