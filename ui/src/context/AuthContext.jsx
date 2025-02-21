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
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Optionally, you can fetch the user data here if needed
            // For example:
            // API.getUser().then(response => setUser(response.data.user)).catch(error => console.error(error));
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('token');
        setEmail('');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const signUp = async (email, password, username) => {
        const response = await API.createAccount({ email, password, username }); // Assuming this endpoint exists
        setUser(response.data.account);
        localStorage.setItem('userEmail', email);
        setEmail(email);
        return response.data;
    };
  
    const login = async (email, password) => {
        const response = await API.login({ email, password }); // Assuming this endpoint exists
        // Assuming the token is stored and used for authenticated requests
        const { token, user: loggedInUser } = response.data;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(loggedInUser);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('token', token);
        setEmail(email);
        return response.data;
    };

    const value = {
        user,
        email,
        signUp,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};