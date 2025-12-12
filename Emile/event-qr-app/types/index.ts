export type UserRole = 'user' | 'organizer';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  image: string;
  availableTickets: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  userId: string;
  purchaseDate: string;
  qrCode: string;
  quantity: number;
  totalPrice: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
}

export interface TicketContextType {
  tickets: Ticket[];
  purchaseTicket: (event: Event, quantity: number) => Promise<Ticket>;
  getTicketById: (id: string) => Ticket | undefined;
}
