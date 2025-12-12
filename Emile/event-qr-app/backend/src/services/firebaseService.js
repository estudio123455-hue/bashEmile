const { getDb, COLLECTIONS, firestoreHelpers } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory fallback storage
let inMemoryStorage = {
  users: [],
  events: [],
  tickets: [],
  orders: [],
};

// Initialize with mock events
const initializeMockEvents = () => {
  inMemoryStorage.events = [
    {
      id: '1',
      title: 'Concierto de Rock',
      description: 'Una noche increíble con las mejores bandas de rock en vivo.',
      date: '2025-01-15',
      time: '20:00',
      location: 'Estadio Nacional',
      price: 50000,
      currency: 'COP',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      availableTickets: 500,
      totalTickets: 1000,
      category: 'concert',
    },
    {
      id: '2',
      title: 'Festival de Jazz',
      description: 'El mejor jazz internacional en un ambiente íntimo.',
      date: '2025-01-20',
      time: '19:00',
      location: 'Teatro Municipal',
      price: 35000,
      currency: 'COP',
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
      availableTickets: 200,
      totalTickets: 300,
      category: 'concert',
    },
    {
      id: '3',
      title: 'Conferencia Tech 2025',
      description: 'Descubre las últimas tendencias en tecnología.',
      date: '2025-02-01',
      time: '09:00',
      location: 'Centro de Convenciones',
      price: 75000,
      currency: 'COP',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      availableTickets: 300,
      totalTickets: 500,
      category: 'conference',
    },
    {
      id: '4',
      title: 'Exposición de Arte Moderno',
      description: 'Una colección única de obras de artistas contemporáneos.',
      date: '2025-02-10',
      time: '10:00',
      location: 'Museo de Arte Contemporáneo',
      price: 15000,
      currency: 'COP',
      image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
      availableTickets: 150,
      totalTickets: 200,
      category: 'general',
    },
    {
      id: '5',
      title: 'Stand Up Comedy Night',
      description: 'Los mejores comediantes del país en una noche llena de risas.',
      date: '2025-02-15',
      time: '21:00',
      location: 'Club de Comedia Central',
      price: 25000,
      currency: 'COP',
      image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
      availableTickets: 100,
      totalTickets: 150,
      category: 'theater',
    },
    {
      id: '6',
      title: 'Maratón Ciudad 2025',
      description: 'Participa en la carrera más importante del año.',
      date: '2025-03-01',
      time: '07:00',
      location: 'Parque Central',
      price: 30000,
      currency: 'COP',
      image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
      availableTickets: 1000,
      totalTickets: 2000,
      category: 'sports',
    },
  ];
};

initializeMockEvents();

// ============ USER SERVICES ============

const userService = {
  // Create user from Firebase Auth (no password needed)
  async createFromFirebase(firebaseUser) {
    const db = getDb();
    const { uid, email, name } = firebaseUser;
    
    const user = {
      id: uid,
      name: name || email?.split('@')[0] || 'Usuario',
      email: email?.toLowerCase() || '',
      role: 'user', // Default role, can be changed by admin
      avatar: null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (db) {
        await db.collection(COLLECTIONS.USERS).doc(uid).set(user);
        return user;
      }
    } catch (error) {
      console.error('Firebase error in createFromFirebase:', error.message);
    }
    
    // Fallback to in-memory
    inMemoryStorage.users.push(user);
    return user;
  },

  async create(userData) {
    const db = getDb();
    const { name, email, password } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (db) {
        const docRef = await db.collection(COLLECTIONS.USERS).add(user);
        return { id: docRef.id, ...user };
      }
    } catch (error) {
      console.error('Firebase error in create user:', error.message);
    }
    
    // Fallback to in-memory
    const id = uuidv4();
    const newUser = { id, ...user };
    inMemoryStorage.users.push(newUser);
    return newUser;
  },

  async findByEmail(email) {
    const db = getDb();
    
    try {
      if (db) {
        const snapshot = await db.collection(COLLECTIONS.USERS)
          .where('email', '==', email.toLowerCase())
          .limit(1)
          .get();
        
        if (snapshot.empty) return null;
        return firestoreHelpers.docToObject(snapshot.docs[0]);
      }
    } catch (error) {
      console.error('Firebase error in findByEmail:', error.message);
    }
    
    return inMemoryStorage.users.find(u => u.email === email.toLowerCase()) || null;
  },

  async findById(id) {
    const db = getDb();
    
    try {
      if (db) {
        const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
        return firestoreHelpers.docToObject(doc);
      }
    } catch (error) {
      console.error('Firebase error in findById:', error.message);
    }
    
    return inMemoryStorage.users.find(u => u.id === id) || null;
  },

  async update(id, data) {
    const db = getDb();
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    
    try {
      if (db) {
        await db.collection(COLLECTIONS.USERS).doc(id).update(updateData);
        const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
        return firestoreHelpers.docToObject(doc);
      }
    } catch (error) {
      console.error('Firebase error in update:', error.message);
    }
    
    const index = inMemoryStorage.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    inMemoryStorage.users[index] = { ...inMemoryStorage.users[index], ...updateData };
    return inMemoryStorage.users[index];
  },

  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

// ============ EVENT SERVICES ============

const eventService = {
  async findAll(filters = {}) {
    const db = getDb();
    const { category, search, limit = 20, offset = 0 } = filters;
    
    try {
      if (db) {
        let query = db.collection(COLLECTIONS.EVENTS);
        
        if (category && category !== 'all') {
          query = query.where('category', '==', category);
        }
        
        query = query.where('availableTickets', '>', 0);
        
        const snapshot = await query.limit(parseInt(limit)).get();
        let events = firestoreHelpers.queryToArray(snapshot);
        
        if (search) {
          const searchLower = search.toLowerCase();
          events = events.filter(e => 
            e.title.toLowerCase().includes(searchLower) ||
            e.location.toLowerCase().includes(searchLower)
          );
        }
        
        return events;
      }
    } catch (error) {
      console.error('Firebase error, falling back to in-memory:', error.message);
    }
    
    // Fallback to in-memory
    let events = [...inMemoryStorage.events];
    
    if (category && category !== 'all') {
      events = events.filter(e => e.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(searchLower) ||
        e.location.toLowerCase().includes(searchLower)
      );
    }
    
    events = events.filter(e => e.availableTickets > 0);
    
    return events.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  },

  async findById(id) {
    const db = getDb();
    
    try {
      if (db) {
        const doc = await db.collection(COLLECTIONS.EVENTS).doc(id).get();
        return firestoreHelpers.docToObject(doc);
      }
    } catch (error) {
      console.error('Firebase error in findById:', error.message);
    }
    
    return inMemoryStorage.events.find(e => e.id === id) || null;
  },

  async updateTickets(id, quantity) {
    const db = getDb();
    
    if (db) {
      await db.collection(COLLECTIONS.EVENTS).doc(id).update({
        availableTickets: firestoreHelpers.increment(-quantity),
      });
    } else {
      const index = inMemoryStorage.events.findIndex(e => e.id === id);
      if (index !== -1) {
        inMemoryStorage.events[index].availableTickets -= quantity;
      }
    }
  },

  async create(eventData) {
    const db = getDb();
    const event = {
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (db) {
      const docRef = await db.collection(COLLECTIONS.EVENTS).add(event);
      return { id: docRef.id, ...event };
    } else {
      const id = uuidv4();
      const newEvent = { id, ...event };
      inMemoryStorage.events.push(newEvent);
      return newEvent;
    }
  },
};

// ============ ORDER SERVICES ============

const orderService = {
  async create(orderData) {
    const db = getDb();
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (db) {
      const docRef = await db.collection(COLLECTIONS.ORDERS).add(order);
      return { id: docRef.id, ...order };
    } else {
      const newOrder = { id: orderData.orderId, ...order };
      inMemoryStorage.orders.push(newOrder);
      return newOrder;
    }
  },

  async findByOrderId(orderId) {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.ORDERS)
        .where('orderId', '==', orderId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return firestoreHelpers.docToObject(snapshot.docs[0]);
    } else {
      return inMemoryStorage.orders.find(o => o.orderId === orderId) || null;
    }
  },

  async findByUserAndOrderId(userId, orderId) {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.ORDERS)
        .where('orderId', '==', orderId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return firestoreHelpers.docToObject(snapshot.docs[0]);
    } else {
      return inMemoryStorage.orders.find(o => o.orderId === orderId && o.userId === userId) || null;
    }
  },

  async update(orderId, data) {
    const db = getDb();
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.ORDERS)
        .where('orderId', '==', orderId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const docId = snapshot.docs[0].id;
      await db.collection(COLLECTIONS.ORDERS).doc(docId).update(updateData);
      const doc = await db.collection(COLLECTIONS.ORDERS).doc(docId).get();
      return firestoreHelpers.docToObject(doc);
    } else {
      const index = inMemoryStorage.orders.findIndex(o => o.orderId === orderId);
      if (index === -1) return null;
      inMemoryStorage.orders[index] = { ...inMemoryStorage.orders[index], ...updateData };
      return inMemoryStorage.orders[index];
    }
  },
};

// ============ TICKET SERVICES ============

const ticketService = {
  async create(ticketData) {
    const db = getDb();
    const ticket = {
      ...ticketData,
      createdAt: new Date().toISOString(),
    };
    
    if (db) {
      const docRef = await db.collection(COLLECTIONS.TICKETS).add(ticket);
      return { id: docRef.id, ...ticket };
    } else {
      const newTicket = { id: ticketData.ticketId, ...ticket };
      inMemoryStorage.tickets.push(newTicket);
      return newTicket;
    }
  },

  async findByOrderId(orderId) {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.TICKETS)
        .where('orderId', '==', orderId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return firestoreHelpers.docToObject(snapshot.docs[0]);
    } else {
      return inMemoryStorage.tickets.find(t => t.orderId === orderId) || null;
    }
  },

  async findByUserId(userId, status = null) {
    const db = getDb();
    
    if (db) {
      let query = db.collection(COLLECTIONS.TICKETS).where('userId', '==', userId);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.orderBy('purchaseDate', 'desc').get();
      return firestoreHelpers.queryToArray(snapshot);
    } else {
      let tickets = inMemoryStorage.tickets.filter(t => t.userId === userId);
      
      if (status) {
        tickets = tickets.filter(t => t.status === status);
      }
      
      return tickets.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    }
  },

  async findByTicketId(ticketId) {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.TICKETS)
        .where('ticketId', '==', ticketId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return firestoreHelpers.docToObject(snapshot.docs[0]);
    } else {
      return inMemoryStorage.tickets.find(t => t.ticketId === ticketId) || null;
    }
  },

  async findByUserAndTicketId(userId, ticketId) {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.TICKETS)
        .where('ticketId', '==', ticketId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return firestoreHelpers.docToObject(snapshot.docs[0]);
    } else {
      return inMemoryStorage.tickets.find(t => t.ticketId === ticketId && t.userId === userId) || null;
    }
  },

  async update(ticketId, data) {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection(COLLECTIONS.TICKETS)
        .where('ticketId', '==', ticketId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const docId = snapshot.docs[0].id;
      await db.collection(COLLECTIONS.TICKETS).doc(docId).update(data);
      const doc = await db.collection(COLLECTIONS.TICKETS).doc(docId).get();
      return firestoreHelpers.docToObject(doc);
    } else {
      const index = inMemoryStorage.tickets.findIndex(t => t.ticketId === ticketId);
      if (index === -1) return null;
      inMemoryStorage.tickets[index] = { ...inMemoryStorage.tickets[index], ...data };
      return inMemoryStorage.tickets[index];
    }
  },
};

module.exports = {
  userService,
  eventService,
  orderService,
  ticketService,
  inMemoryStorage,
};
