import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material'; // Import CssBaseline
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
// import ChatInterface from './components/Chat/ChatInterface'; // Likely removed if OpenFolder is the main view
import AccountSettings from './components/AccountSettings.jsx';
import Menu from './components/Menu.jsx';
import Pricing from './components/Pricing.jsx';
import Docs from './components/Docs.jsx';
import { useAuth } from './context/AuthContext';
import React from 'react';
import './styles/App.css'; // Keep custom styles
import OpenFolder from './components/OpenFolder.jsx';
import { ApiProvider } from './api';
import { DirectoryProvider } from './context/DirectoryContext.jsx';
import { ThemeProvider } from '@mui/material/styles';
import darkTheme from './theme'; // Import the custom dark theme

function App() {
    return (
        // Wrap everything in ApiProvider and DirectoryProvider first
        <ApiProvider>
            <DirectoryProvider>
                {/* Apply the custom theme globally */}
                <ThemeProvider theme={darkTheme}>
                    {/* CssBaseline applies baseline styles & dark mode background */}
                    <CssBaseline />
                    <Router>
                        <MainApp />
                    </Router>
                </ThemeProvider>
            </DirectoryProvider>
        </ApiProvider>
    );
}

function MainApp() {
    const { email } = useAuth(); // Get authentication status

    return (
        // Use a Box as the main container, allowing theme styles to apply easily
        <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Render Menu only if logged in */}
            {email && <Menu />}
            {/* Main content area */}
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Routes>
                    {/* Conditional routing based on auth status */}
                    {!email ? (
                        <>
                            {/* Redirect root and /login to Login component */}
                            <Route path="/" element={<Login />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                            {/* Fallback for any other route when logged out */}
                            <Route path="*" element={<Login />} />
                        </>
                    ) : (
                        <>
                            {/* Logged-in routes */}
                            {/* <Route path="/chat" element={<ChatInterface />} /> // Possibly deprecated */}
                            <Route path="/account" element={<AccountSettings />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/docs" element={<Docs />} />
                            {/* Root path shows the main OpenFolder component */}
                            <Route path="/" element={<OpenFolder />} />
                            {/* Fallback for any other route when logged in */}
                            <Route path="*" element={<OpenFolder />} />
                        </>
                    )}
                </Routes>
            </Box>
        </Box>
    );
}

export default App;