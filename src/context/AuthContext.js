// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session); // Debug log
      if (session) {
        const userEmail = session.user.email;
        console.log('User Email:', userEmail); // Debug log
        if (userEmail === 'capsprojectv2@gmail.com') {
          setUser(session.user);
        }
      }
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session); // Debug log
      if (event === 'SIGNED_IN' && session) {
        const userEmail = session.user.email;
        console.log('User Email (onAuthStateChange):', userEmail); // Debug log
        if (userEmail === 'capsprojectv2@gmail.com') {
          setUser(session.user);
        } else {
          console.log('User is not an admin, signing out...');
          supabase.auth.signOut();
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};