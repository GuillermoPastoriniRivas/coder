import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API, { setAuthToken } from '../api'; // Import setAuthToken from api.js

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
    const [saldo, setSaldo] = useState(localStorage.getItem('saldo') ? parseFloat(localStorage.getItem('saldo')) : 0); // Use parseFloat
    const [totalProjectTokens, setTotalProjectTokens] = useState(0); // Added state for total project tokens
    const [loading, setLoading] = useState(true); // Add loading state, default true

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                console.log("AuthContext: Token found in storage."); // Debug
                setAuthToken(token);
                // Validate the token by fetching user data.
                // The loading state will be set to false within fetchUserSaldo.
                await fetchUserSaldo();
            } else {
                console.log("AuthContext: No token found. Setting loading false."); // Debug
                setLoading(false); // No token, so not loading
                logout(); // Ensure clean state if no token
            }
        };
        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const fetchUserSaldo = async () => {
        // Don't set loading true here, it's set initially
        try {
            console.log("AuthContext: Attempting to fetch saldo/verify token."); // Debug
            const response = await API.getSaldo();
            setSaldo(response.data.saldo);
            localStorage.setItem('saldo', response.data.saldo);
            // If saldo fetch succeeds, we assume the token is valid and email from storage is okay for now
            // Or update email from response if available: setEmail(response.data.user.email);
            console.log("AuthContext: Saldo fetch successful. Setting loading false."); // Debug
            setLoading(false); // Successfully verified token/fetched data
        } catch (error) {
            console.error('AuthContext: Error fetching saldo:', error);
            // Don't reset saldo to 0 here, could be a temporary issue
            // If the error is 401, the interceptor in api.js should handle logout
            // If it's another error, we still stop loading
            if (error.response?.status !== 401) {
                 console.log("AuthContext: Saldo fetch failed (non-401). Setting loading false."); // Debug
                 setLoading(false);
            }
            // If it IS 401, the interceptor handles logout AND redirect.
            // The loading state might remain true until redirect, or the component unmounts.
            // It might be cleaner for the interceptor to also set loading = false, but let's see.
            // For now, just handle the non-401 case here.
        }
        // Removed finally block as loading is handled in try/catch specifically
    };

    const logout = () => {
        console.log("AuthContext: Logging out."); // Debug
        localStorage.removeItem('userEmail');
        localStorage.removeItem('token');
        localStorage.removeItem('saldo');
        setEmail('');
        setUser(null);
        setSaldo(0);
        setTotalProjectTokens(0); // Reset total project tokens on logout
        setAuthToken(null);
        setLoading(false); // Ensure loading is false on logout
    };

    const signUp = async (email, password, username) => {
        setLoading(true); // Indicate loading during signup
        try {
            const response = await API.createAccount({ email, password, username });
            setUser(response.data.account);
            if (response.data.account?.saldo !== undefined) {
                 setSaldo(response.data.account.saldo);
                 localStorage.setItem('saldo', response.data.account.saldo);
            }
            // Signup might not log the user in automatically, so don't set email/token here
            // If signup DOES log in, call login logic or set state here.
            // For now, assume it doesn't auto-login.
            // Redirect to login or show success message.
             console.log("AuthContext: Signup successful."); // Debug
             return response.data; // Return data for component handling
        } catch (error) {
             console.error("AuthContext: Signup failed", error);
             throw error; // Re-throw error for component handling
        } finally {
             setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true); // Indicate loading during login
        try {
            const response = await API.login({ email, password });
            console.log("AuthContext: Login response:", response); // Log for debugging
            const { token, saldo, user } = response.data;

            if (token) {
                 setAuthToken(token); // Set header FIRST
                 setUser(user);
                 setSaldo(saldo);
                 setEmail(email); // Set email state based on successful login
                 localStorage.setItem('userEmail', email);
                 localStorage.setItem('token', token);
                 localStorage.setItem('saldo', saldo);
                 console.log("AuthContext: Token and user state set after login.");
                 setLoading(false); // Login successful, stop loading
                 return response.data;
            } else {
                 console.error("AuthContext: Login response did not contain a token.");
                 logout(); // Ensure clean state on failed login attempt
                 throw new Error("Login failed: No token received.");
            }
        } catch (error) {
            console.error("AuthContext: Login failed", error);
            logout(); // Ensure clean state on error
            throw error; // Re-throw error for component handling
        }
        // No finally block for setLoading(false) here, it's handled in try/catch/logout
    };

    const updateSaldo = (newSaldo) => {
        setSaldo(newSaldo);
        localStorage.setItem('saldo', newSaldo);
    };

    const value = {
        user,
        email,
        saldo,
        totalProjectTokens, // Expose totalProjectTokens
        setTotalProjectTokens, // Expose setter
        loading, // Provide loading state
        signUp,
        login,
        logout,
        updateSaldo,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};