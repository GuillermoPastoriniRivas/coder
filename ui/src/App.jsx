import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress } from '@mui/material'; // Import CssBaseline, CircularProgress
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
// import ChatInterface from './components/Chat/ChatInterface'; // Likely removed if OpenFolder is the main view
import AccountSettings from './components/AccountSettings.jsx';
import Menu from './components/Menu.jsx';
import Pricing from './components/Pricing.jsx';
import Docs from './components/Docs.jsx';
import CallHistory from './components/CallHistory.jsx'; // Import the new component
import LandingPage from './components/LandingPage.jsx'; // Import the new LandingPage component
import Legal from './components/Legal.jsx'; // Import the new Legal component
import { useAuth } from './context/AuthContext';
import React from 'react';
import './styles/App.css'; // Keep custom styles
import OpenFolder from './components/OpenFolder.jsx';
// import { ApiProvider } from './api';
import { DirectoryProvider } from './context/DirectoryContext.jsx';
import { ThemeProvider } from '@mui/material/styles';
import darkTheme from './theme'; // Import the custom dark theme

function App() {
    return (
        // Wrap everything in ApiProvider and DirectoryProvider first
        // <ApiProvider>
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
        // </ApiProvider>
    );
}

function MainApp() {
    const { email, loading } = useAuth(); // Get authentication status and loading state

    // Show loading indicator while checking auth status on initial load
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

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
                            {/* Root path shows the Landing Page */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                             {/* Public Docs route */}
                             <Route path="/docs" element={<Docs />} />
                             {/* Public Legal route */}
                             <Route path="/legal" element={<Legal />} />
                             {/* Add pricing here if public */}\
                             {/* <Route path="/pricing" element={<Pricing />} /> */}
                             {/* Fallback for any other route when logged out, redirect to Landing Page */}
                            <Route path="*" element={<LandingPage />} />
                        </>
                    ) : (
                        <>
                            {/* Logged-in routes */}
                            {/* <Route path="/chat" element={<ChatInterface />} /> // Possibly deprecated */}
                            <Route path="/account" element={<AccountSettings />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/docs" element={<Docs />} />
                            <Route path="/call-history" element={<CallHistory />} /> {/* Added route for Call History */}
                            <Route path="/legal" element={<Legal />} /> {/* Added Legal route */}
                            {/* Root path shows the main OpenFolder component */}
                            <Route path="/" element={<OpenFolder />} />
                            {/* Fallback for any other route when logged in */}
                            <Route path="*" element={<OpenFolder />} />
                        </>
                    )}\
                </Routes>
            </Box>
        </Box>
    );
}

export default App;