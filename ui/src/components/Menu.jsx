import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Menu() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const response = await api.getAccount();
            setBalance(response.data.balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
            setBalance(0);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <AppBar position="static">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Button color="inherit" component={Link} to="/">
                    <Typography variant="h6" sx={{ color: 'white' }}>
                        Coder UI
                    </Typography>
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box className="saldo-container">
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/pricing">
                            Saldo: ${balance}
                        </Button>
                    </Box>
                    <Box sx={{ mr: '30px' }}>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/">
                            Inicio
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/chat">
                            Chat
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/account">
                            Account
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/docs">
                            Docs
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" onClick={handleLogout}>
                            Cerrar Sesión
                        </Button>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
