import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');

  const login = (email) => {
    localStorage.setItem('userEmail', email);
    setEmail(email);
  };

  return (
    <AuthContext.Provider value={{ email, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}