import { Event, Ticket, TicketContextType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const TicketContext = createContext<TicketContextType | undefined>(undefined);

const TICKETS_KEY = '@event_app_tickets';

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTickets();
    } else {
      setTickets([]);
    }
  }, [user]);

  const loadTickets = async () => {
    try {
      const storedTickets = await AsyncStorage.getItem(TICKETS_KEY);
      if (storedTickets) {
        const allTickets: Ticket[] = JSON.parse(storedTickets);
        const userTickets = allTickets.filter((t) => t.userId === user?.id);
        setTickets(userTickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const getAllTickets = async (): Promise<Ticket[]> => {
    try {
      const storedTickets = await AsyncStorage.getItem(TICKETS_KEY);
      return storedTickets ? JSON.parse(storedTickets) : [];
    } catch {
      return [];
    }
  };

  const purchaseTicket = async (event: Event, quantity: number): Promise<Ticket> => {
    if (!user) {
      throw new Error('User must be logged in to purchase tickets');
    }

    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTicket: Ticket = {
      id: ticketId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      userId: user.id,
      purchaseDate: new Date().toISOString(),
      qrCode: JSON.stringify({
        ticketId,
        eventId: event.id,
        userId: user.id,
        eventTitle: event.title,
        date: event.date,
        quantity,
      }),
      quantity,
      totalPrice: event.price * quantity,
    };

    const allTickets = await getAllTickets();
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify([...allTickets, newTicket]));
    setTickets((prev) => [...prev, newTicket]);

    return newTicket;
  };

  const getTicketById = (id: string): Ticket | undefined => {
    return tickets.find((t) => t.id === id);
  };

  return (
    <TicketContext.Provider value={{ tickets, purchaseTicket, getTicketById }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}
