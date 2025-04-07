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
    const [saldo, setSaldo] = useState(localStorage.getItem('saldo') ? parseInt(localStorage.getItem('saldo')) : 0); // New state for saldo

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Set header on initial load if token exists
            setAuthToken(token);
            // Optionally fetch user data including saldo
            fetchUserSaldo();
        }
    }, []);

    const fetchUserSaldo = async () => {
        try {
            const response = await API.getSaldo(); // Assuming getSaldo is defined
            setSaldo(response.data.saldo);
            localStorage.setItem('saldo', response.data.saldo);
        } catch (error) {
            console.error('Error fetching saldo:', error);
            // Don't reset saldo to 0 here, could be a temporary issue
            // setSaldo(0);
            // If the error is 401, the interceptor will handle logout
        }
    };

    const logout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('token');
        localStorage.removeItem('saldo'); // Remove saldo from localStorage
        setEmail('');
        setUser(null);
        setSaldo(0); // Reset saldo state
        // Clear the header using the imported function
        setAuthToken(null);
    };

    const signUp = async (email, password, username) => {
        const response = await API.createAccount({ email, password, username });
        // Assuming signup doesn't automatically log in / return a token
        // If it does, handle token/state setting like in login
        setUser(response.data.account);
        // Set initial saldo if provided by signup response
        if (response.data.account?.saldo !== undefined) {
             setSaldo(response.data.account.saldo);
             localStorage.setItem('saldo', response.data.account.saldo);
        }
        localStorage.setItem('userEmail', email);
        setEmail(email);
        return response.data;
    };

    const login = async (email, password) => {
        const response = await API.login({ email, password });
        console.log("Login response:", response); // Log for debugging
        const { token, saldo, user } = response.data; // Assuming user details are also returned

        if (token) { // Check if token exists
             // Explicitly set the token for immediate use BEFORE setting state
             setAuthToken(token);

             // Proceed with setting state and local storage
             setUser(user); // Set user state
             setSaldo(saldo); // Update saldo state
             setEmail(email); // Update email state
             localStorage.setItem('userEmail', email);
             localStorage.setItem('token', token);
             localStorage.setItem('saldo', saldo); // Store saldo in localStorage
             console.log("Token and user state set after login.");
        } else {
             console.error("Login response did not contain a token.");
             // Throw an error to be caught by the calling component (Login.jsx)
             throw new Error("Login failed: No token received.");
        }

        return response.data;
    };

    const updateSaldo = (newSaldo) => {
        setSaldo(newSaldo);
        localStorage.setItem('saldo', newSaldo);
    };

    const value = {
        user,
        email,
        saldo, // Provide saldo in the context
        signUp,
        login,
        logout,
        updateSaldo, // Function to update saldo
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};