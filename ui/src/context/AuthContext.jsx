import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');

  const login = (email) => {
    localStorage.setItem('userEmail', email);
    setEmail(email);
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    setEmail('');
  };

  return (
    <AuthContext.Provider value={{ email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}