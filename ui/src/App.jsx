import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import ChatInterface from './components/Chat/ChatInterface';
import AccountSettings from './components/AccountSettings.jsx';
import Menu from './components/Menu.jsx';
import Pricing from './components/Pricing.jsx';
import Docs from './components/Docs.jsx';
import { useAuth } from './context/AuthContext';
import React from 'react';
import './styles/App.css';
import OpenFolder from './components/OpenFolder.jsx';
import { ApiProvider } from './api';
import { DirectoryProvider } from './context/DirectoryContext.jsx';

function App() {
    return (
        <ApiProvider>
            <DirectoryProvider>
                <Router>
                    <MainApp />
                </Router>
            </DirectoryProvider>
        </ApiProvider>
    );
}

function MainApp() {
    const { email } = useAuth();

    return (
        <div className="App">
            {email && <Menu />}
            <Box>
                <Routes>
                    {!email ? (
                        <>
                            <Route path="/" element={<Login />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                        </>
                    ) : (
                        <>
                            <Route path="/account" element={<AccountSettings />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/docs" element={<Docs />} />
                        </>
                    )}
                    <Route path="*" element={email ? <OpenFolder /> : <Login />} />
                </Routes>
            </Box>
        </div>
    );
}

export default App;
