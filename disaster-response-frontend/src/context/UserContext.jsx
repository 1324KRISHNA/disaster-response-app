import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext({
  user: { name: 'Admin Officer', email: 'admin@disaster-response.gov', role: 'commander' },
  updateProfile: () => {},
  updateRole: () => {}
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('disaster_user');
    if (saved) return JSON.parse(saved);
    return { name: 'Admin Officer', email: 'admin@disaster-response.gov', role: 'commander' };
  });

  useEffect(() => {
    localStorage.setItem('disaster_user', JSON.stringify(user));
  }, [user]);

  const updateProfile = (name, email) => {
    setUser(prev => ({ ...prev, name, email }));
  };

  const updateRole = (role) => {
    setUser(prev => ({ ...prev, role }));
  };

  return (
    <UserContext.Provider value={{ user, updateProfile, updateRole }}>
      {children}
    </UserContext.Provider>
  );
};
