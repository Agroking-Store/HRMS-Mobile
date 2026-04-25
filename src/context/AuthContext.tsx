import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isInitializing: boolean;
  setUser: (user: User | null) => void | Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isInitializing: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, storedUser] = await AsyncStorage.multiGet(['token', 'user']);
        const tokenValue = token[1];
        const userValue = storedUser[1];
        if (tokenValue && userValue) {
          const parsedUser = JSON.parse(userValue) as User;
          setUser(parsedUser);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const handleSetUser = useCallback(async (u: User | null) => {
    if (u === null) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    setUser(u);
  }, []);

  const contextValue = useMemo(
    () => ({ user, isInitializing, setUser: handleSetUser }),
    [handleSetUser, user, isInitializing],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
