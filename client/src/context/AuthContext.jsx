import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check localStorage on mount
        const storedUser = localStorage.getItem('user_role');
        if (storedUser) {
            setUser({ role: storedUser });
        }
        setLoading(false);
    }, []);

    const login = (password) => {
        if (password === 'adlv2468') {
            const userData = { role: 'admin' };
            setUser(userData);
            localStorage.setItem('user_role', 'admin');
            return true;
        } else if (password === 'lvqc2468') {
            const userData = { role: 'agent' };
            setUser(userData);
            localStorage.setItem('user_role', 'agent');
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user_role');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
