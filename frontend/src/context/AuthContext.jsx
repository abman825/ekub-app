import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ተጠቃሚው ከ localStorage ጫን እንዲል ማድረግ
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (data) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } else {
      // በቀጥታ የተጠቃሚው ዳታ ብቻ ሲመጣ
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    }
  };

  // በ Settings ወይም Profile ሰዓት መረጃው ወዲያውኑ እንዲዘምን የሚያደርግ
  const updateUser = (updatedData) => {
    setUser(prevUser => {
      const newUserData = { ...prevUser, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUserData));
      return newUserData;
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;