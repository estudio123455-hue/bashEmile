const admin = require('firebase-admin');
const path = require('path');

let db = null;

const initializeFirebase = () => {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    db = admin.firestore();
    console.log('✅ Firebase already initialized');
    return db;
  }

  try {
    // Option 1: Using environment variables (for Vercel/production)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔧 Initializing Firebase with env vars...');
      console.log('   Project ID:', process.env.FIREBASE_PROJECT_ID);
      console.log('   Client Email:', process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + '...');
      
      // Handle different formats of private key
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    // Option 2: Using service account JSON file (for local dev)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace('./', ''));
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }
    // Option 3: Default credentials (for Google Cloud environments)
    else {
      console.warn('⚠️  Firebase credentials not configured, using in-memory storage');
      return null;
    }

    db = admin.firestore();
    console.log('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('   Full error:', error);
    return null;
  }
};

const getDb = () => db;

const getAuth = () => admin.auth();

// Firestore collections
const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  TICKETS: 'tickets',
  ORDERS: 'orders',
};

// Helper functions for Firestore
const firestoreHelpers = {
  // Convert Firestore document to plain object with id
  docToObject: (doc) => {
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  // Convert Firestore query snapshot to array
  queryToArray: (snapshot) => {
    const results = [];
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  },

  // Get timestamp
  timestamp: () => admin.firestore.FieldValue.serverTimestamp(),

  // Increment field
  increment: (value = 1) => admin.firestore.FieldValue.increment(value),

  // Delete field
  deleteField: () => admin.firestore.FieldValue.delete(),
};

module.exports = {
  initializeFirebase,
  getDb,
  getAuth,
  admin,
  COLLECTIONS,
  firestoreHelpers,
};
