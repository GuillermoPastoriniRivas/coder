import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'; 
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import AgentList from './components/Agent/AgentList';
import AgentForm from './components/Agent/AgentForm';
import ChatInterface from './components/Chat/ChatInterface';
import PublicChatInterface from './components/Chat/PublicChatInterface';
import Widget from './components/Chat/Widget'; 
import AccountSettings from './components/AccountSettings.jsx';
import Menu from './components/Menu.jsx';
import Pricing from './components/Pricing.jsx';
import Docs from './components/Docs.jsx';
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
        <Menu />
      )}
      <Box>
        <Routes>
          {!email ? (
            <>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/widget/:agentId" element={<Widget />} />
            </>
          ) : (
            <>
              <Route path="/agents" element={<AgentList />} />
              <Route path="/agents/new" element={<AgentForm />} />        
              <Route path="/agents/:id" element={<AgentForm />} />        
              <Route path="/chat/:agentId" element={<ChatInterface />} /> 
              <Route path="/public/:publicId" element={<PublicChatInterface />} />
              <Route path="/account" element={<AccountSettings />} />     
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/docs" element={<Docs />} />
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