import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';        
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PricingIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';

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
                <Typography variant="h6">Langchain UI</Typography>        
                <Box sx={{ display: 'flex' }}>
                    <Box sx={{ mr: '30px' }}>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
                            Inicio
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/account" startIcon={<AccountCircleIcon />}>
                            Mi Cuenta
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/pricing" startIcon={<PricingIcon />}>
                            Precios
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" component={Link} to="/docs" startIcon={<DescriptionIcon />}>
                            Docs
                        </Button>
                        <Button sx={{ mr: 2 }} color="inherit" onClick={handleLogout} startIcon={<ExitToAppIcon />}>
                            Cerrar Sesión
                        </Button>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
}