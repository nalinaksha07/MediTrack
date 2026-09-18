import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('meditrack_token');
    const saved = localStorage.getItem('meditrack_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('meditrack_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('meditrack_token');
          localStorage.removeItem('meditrack_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    const { token, ...userData } = res.data;
    localStorage.setItem('meditrack_token', token);
    localStorage.setItem('meditrack_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('meditrack_token');
    localStorage.removeItem('meditrack_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
