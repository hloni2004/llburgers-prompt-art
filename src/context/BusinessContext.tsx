import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchBusinessIsOpen } from '@/api/api';
import { useStompSubscription } from '@/hooks/useStompSubscription';

interface BusinessStatusPayload {
  type: 'BUSINESS_OPENED' | 'BUSINESS_CLOSED' | string;
  message: string;
  timestamp: string;
}

interface BusinessContextType {
  isOpen: boolean;
  toggleBusiness: () => void;
  setOpen: (open: boolean) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to `true` (open) until we hear from the server.
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Fetch authoritative status from the backend on mount.
  useEffect(() => {
    fetchBusinessIsOpen().then(setIsOpen).catch(() => { /* keep default */ });
  }, []);

  // Listen for real-time business open/close events over WebSocket.
  useStompSubscription<BusinessStatusPayload>('/topic/business', payload => {
    const open = payload.type === 'BUSINESS_OPENED';
    setIsOpen(open);
  });

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const toggleBusiness = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <BusinessContext.Provider value={{ isOpen, toggleBusiness, setOpen }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
};
