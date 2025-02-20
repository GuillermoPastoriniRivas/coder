import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Menu() {
    const { email, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <AppBar position="static">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6">
                    Langchain UI
                </Typography>
                <Box  sx={{display: 'flex'}}>
                    <Box sx={{mr: '30px'}}>
                        <Button color="inherit" component={Link} to="/">
                        Inicio
                        </Button>
                        <Button color="inherit" component={Link} to="/account">
                        Mi Cuenta
                        </Button>
                    </Box>
                    <Button color="inherit" onClick={handleLogout}>
                        Cerrar Sesión
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}