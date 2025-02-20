import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Login from './components/Auth/Login';
import AgentList from './components/Agent/AgentList';
import AgentForm from './components/Agent/AgentForm';
import ChatInterface from './components/Chat/ChatInterface';
import PublicChatInterface from './components/Chat/PublicChatInterface';
// import AccountSettings from './components/AccountSettings/AccountSettings'; // Asegúrate de crear este componente cuando esté listo
import { useAuth } from './context/AuthContext';
import React from 'react';
import './App.css';

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      {email && (
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ marginRight: 2 }}>
              Mi Aplicación
            </Typography>
            <Box  sx={{display: 'flex'}}>
              <Box sx={{mr: '30px'}}>
                <Button color="inherit" component={Link} to="/">
                  Inicio
                </Button>
                <Button color="inherit" component={Link} to="/account-settings">
                  Mi Cuenta
                </Button>
              </Box>
              <Button color="inherit" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Box>
        <Routes>
          {!email ? (
            <>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
            </>
          ) : (
            <>
              <Route path="/agents" element={<AgentList />} />
              <Route path="/agents/new" element={<AgentForm />} />
              <Route path="/agents/:id" element={<AgentForm />} />
              <Route path="/chat/:agentId" element={<ChatInterface />} />
              <Route path="/public/:publicId" element={<PublicChatInterface />} />
              {/* <Route path="/account-settings" element={<AccountSettings />} /> */}
              {/* Agregar ruta para Precios si es necesario */}
              {/* <Route path="/precios" element={<Precios />} /> */}
            </>
          )}
          {/* Ruta por defecto */}
          <Route path="*" element={email ? <AgentList /> : <Login />} />
        </Routes>
      </Box>
    </div>
  );
}

export default App;