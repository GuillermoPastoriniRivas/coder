import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API from '../api';

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
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
            setSaldo(0);
        }
    };

    const logout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('token');
        localStorage.removeItem('saldo'); // Remove saldo from localStorage
        setEmail('');
        setUser(null);
        setSaldo(0); // Reset saldo state
        delete axios.defaults.headers.common['Authorization'];
    };

    const signUp = async (email, password, username) => {
        const response = await API.createAccount({ email, password, username });
        setUser(response.data.account);
        setSaldo(response.data.account.saldo); // Set saldo from response
        localStorage.setItem('userEmail', email);
        localStorage.setItem('saldo', response.data.account.saldo); // Store saldo in localStorage
        setEmail(email);
        return response.data;
    };

    const login = async (email, password) => {
        const response = await API.login({ email, password });
        console.log(response)
        const { token, saldo } = response.data; // Destructure saldo from response
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(response.data.user); // Ensure user data is set

        setSaldo(saldo); // Update saldo state
        localStorage.setItem('userEmail', email);
        localStorage.setItem('token', token);
        localStorage.setItem('saldo', saldo); // Store saldo in localStorage
        setEmail(email);
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