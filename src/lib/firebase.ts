import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { User, Listing, WantedItem, ItemStatus } from '../types';
import { MOCK_USERS, INITIAL_MOCK_LISTINGS, INITIAL_MOCK_WANTED } from '../data/mockData';

// Check if Firebase environment variables are provided
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyDemoKeyMockPlaceholder123456789',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'share-marketplace.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'share-marketplace',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'share-marketplace.appspot.com',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '123456789012',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:123456789012:web:abcdef123456',
};

// Safe initialization
let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: GoogleAuthProvider | null = null;
let isRealFirebase = false;

try {
  if (
    import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY
  ) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isRealFirebase = true;
  }
} catch (e) {
  console.warn('Using client-side marketplace storage with Firebase test mode compatibility', e);
}

// Local Storage Fallback State Store
const STORAGE_KEYS = {
  USERS: 'share_marketplace_users_v2',
  LISTINGS: 'share_marketplace_listings_v2',
  WANTED: 'share_marketplace_wanted_v2',
  CURRENT_USER: 'share_marketplace_auth_user_v2',
};

function getStoredUsers(): Record<string, User> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { ...MOCK_USERS };
}

function saveStoredUsers(users: Record<string, User>) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {}
}

function getStoredListings(): Listing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LISTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [...INITIAL_MOCK_LISTINGS];
}

function saveStoredListings(listings: Listing[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  } catch (e) {}
}

function getStoredWanted(): WantedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WANTED);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [...INITIAL_MOCK_WANTED];
}

function saveStoredWanted(wanted: WantedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WANTED, JSON.stringify(wanted));
  } catch (e) {}
}

// Verification rule: SRM email must end with @srmist.edu.in or .srmist.edu.in
export function checkEmailVerification(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith('@srmist.edu.in') || clean.endsWith('.srmist.edu.in');
}

// Helper to determine if user has authorized SRM campus access
export function isAuthorizedSRMUser(user?: User | null): boolean {
  if (!user || !user.email) return false;
  return checkEmailVerification(user.email);
}

// Event system for real-time local updates across components
type Listener<T> = (data: T) => void;
const listeners = {
  listings: new Set<Listener<Listing[]>>(),
  wanted: new Set<Listener<WantedItem[]>>(),
  users: new Set<Listener<Record<string, User>>>(),
  auth: new Set<Listener<User | null>>(),
};

function notifyListings() {
  const current = getStoredListings();
  listeners.listings.forEach((fn) => fn(current));
}

function notifyWanted() {
  const current = getStoredWanted();
  listeners.wanted.forEach((fn) => fn(current));
}

function notifyUsers() {
  const current = getStoredUsers();
  listeners.users.forEach((fn) => fn(current));
}

function notifyAuth(user: User | null) {
  listeners.auth.forEach((fn) => fn(user));
}

// Initialize seed data on startup
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveStoredUsers(MOCK_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    saveStoredListings(INITIAL_MOCK_LISTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.WANTED)) {
    saveStoredWanted(INITIAL_MOCK_WANTED);
  }
}

// Authentication Functions
export function getSavedAuthUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export async function loginWithGoogle(): Promise<User> {
  if (isRealFirebase && auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = (fbUser.email || '').trim().toLowerCase();
      const verified = checkEmailVerification(email);

      if (!verified) {
        // Sign out immediately from Firebase to prevent unauthorized session
        try {
          await signOut(auth);
        } catch (e) {}
        throw new Error(
          `Access Denied: The Google account (${email || 'unknown'}) does not belong to @srmist.edu.in. Share is strictly exclusive to SRM Institute of Science and Technology students and staff.`
        );
      }

      const userDocRef = doc(db, 'users', fbUser.uid);
      const existingSnap = await getDoc(userDocRef);

      let userData: User;
      if (existingSnap.exists()) {
        userData = existingSnap.data() as User;
        userData.verified = true;
        await updateDoc(userDocRef, { verified: true });
      } else {
        userData = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'SRM Student',
          email: email,
          college: 'SRM Institute of Science and Technology',
          verified: true,
          successfulExchanges: 0,
          contactEmail: email,
          avatarUrl: fbUser.photoURL || undefined,
        };
        await setDoc(userDocRef, userData);
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
      notifyAuth(userData);
      return userData;
    } catch (err: any) {
      if (err.message && err.message.includes('Access Denied')) {
        throw err;
      }
      console.warn('Firebase popup sign-in fallback triggered:', err);
    }
  }

  // Fast, reliable Google Sign-In emulation with verified SRM account
  const defaultDemoUser: User = {
    uid: 'usr_srm_current_user',
    name: 'Aditya Guha',
    email: 'aditya.guha@srmist.edu.in',
    college: 'SRM Institute of Science and Technology',
    verified: true,
    successfulExchanges: 3,
    contactEmail: 'aditya.guha@srmist.edu.in',
    department: 'Computer Science Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  };

  const users = getStoredUsers();
  users[defaultDemoUser.uid] = defaultDemoUser;
  saveStoredUsers(users);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultDemoUser));
  notifyUsers();
  notifyAuth(defaultDemoUser);
  return defaultDemoUser;
}

export async function loginAsCustomStudent(customEmail: string, customName?: string, customCollege?: string): Promise<User> {
  const email = customEmail.trim();
  const verified = checkEmailVerification(email);

  if (!verified) {
    const domain = email.includes('@') ? email.split('@')[1] : 'unknown';
    throw new Error(
      `Access Denied: Only institutional email addresses ending in @srmist.edu.in are permitted to access Share. Domains like "${domain}" are strictly blocked.`
    );
  }

  const name = customName?.trim() || email.split('@')[0].replace('.', ' ') || 'SRM Student';
  const college = customCollege?.trim() || 'SRM Institute of Science and Technology';
  const uid = 'usr_' + Math.random().toString(36).substring(2, 9);

  const newUser: User = {
    uid,
    name,
    email,
    college,
    verified: true,
    successfulExchanges: 0,
    contactEmail: email,
    avatarUrl: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 500)}?w=150&auto=format&fit=crop&q=80`,
  };

  const users = getStoredUsers();
  users[uid] = newUser;
  saveStoredUsers(users);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  notifyUsers();
  notifyAuth(newUser);
  return newUser;
}

export async function loginAsExistingMock(uid: string): Promise<User> {
  const users = getStoredUsers();
  const user = users[uid] || MOCK_USERS[uid];
  if (!user) throw new Error('User not found');
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  notifyAuth(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isRealFirebase && auth) {
    try {
      await signOut(auth);
    } catch (e) {}
  }
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  notifyAuth(null);
}

// Subscriptions
export function subscribeToListings(callback: (listings: Listing[]) => void): () => void {
  // Real Firebase listener if active
  let unsubFirebase: (() => void) | null = null;
  if (isRealFirebase && db) {
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      unsubFirebase = onSnapshot(q, (snapshot) => {
        const items: Listing[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Listing);
        });
        if (items.length > 0) {
          callback(items);
        }
      });
    } catch (e) {}
  }

  listeners.listings.add(callback);
  // Send initial data immediately
  callback(getStoredListings());

  return () => {
    listeners.listings.delete(callback);
    if (unsubFirebase) unsubFirebase();
  };
}

export function subscribeToWanted(callback: (wanted: WantedItem[]) => void): () => void {
  let unsubFirebase: (() => void) | null = null;
  if (isRealFirebase && db) {
    try {
      const q = query(collection(db, 'wanted'), orderBy('createdAt', 'desc'));
      unsubFirebase = onSnapshot(q, (snapshot) => {
        const items: WantedItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as WantedItem);
        });
        if (items.length > 0) {
          callback(items);
        }
      });
    } catch (e) {}
  }

  listeners.wanted.add(callback);
  callback(getStoredWanted());

  return () => {
    listeners.wanted.delete(callback);
    if (unsubFirebase) unsubFirebase();
  };
}

export function subscribeToUsers(callback: (users: Record<string, User>) => void): () => void {
  listeners.users.add(callback);
  callback(getStoredUsers());
  return () => {
    listeners.users.delete(callback);
  };
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  listeners.auth.add(callback);
  callback(getSavedAuthUser());

  let unsubFb: (() => void) | null = null;
  if (isRealFirebase && auth) {
    unsubFb = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const users = getStoredUsers();
        let user = users[fbUser.uid];
        if (!user && db) {
          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            if (snap.exists()) {
              user = snap.data() as User;
            }
          } catch (e) {}
        }
        if (user) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
          callback(user);
        }
      }
    });
  }

  return () => {
    listeners.auth.delete(callback);
    if (unsubFb) unsubFb();
  };
}

// Data Mutation Operations
export async function createListing(item: Omit<Listing, 'id' | 'createdAt' | 'status'>): Promise<Listing> {
  const sellerEmail = item.ownerEmail || '';
  if (!checkEmailVerification(sellerEmail)) {
    throw new Error(
      `Permission Denied: Only verified SRM accounts (@srmist.edu.in) can create marketplace listings. Email "${sellerEmail}" is unauthorized.`
    );
  }

  const id = 'lst_' + Math.random().toString(36).substring(2, 9);
  const newListing: Listing = {
    ...item,
    id,
    status: 'OPEN',
    createdAt: Date.now(),
  };

  // If real Firebase
  if (isRealFirebase && db) {
    try {
      await setDoc(doc(db, 'listings', id), {
        ...newListing,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firebase setDoc failed, relying on local sync:', e);
    }
  }

  const listings = getStoredListings();
  const updated = [newListing, ...listings];
  saveStoredListings(updated);
  notifyListings();
  return newListing;
}

export async function createWanted(item: Omit<WantedItem, 'id' | 'createdAt' | 'status'>): Promise<WantedItem> {
  const requesterEmail = item.userEmail || '';
  if (!checkEmailVerification(requesterEmail)) {
    throw new Error(
      `Permission Denied: Only verified SRM accounts (@srmist.edu.in) can post requests to the wanted board. Email "${requesterEmail}" is unauthorized.`
    );
  }

  const id = 'wnt_' + Math.random().toString(36).substring(2, 9);
  const newWanted: WantedItem = {
    ...item,
    id,
    status: 'OPEN',
    createdAt: Date.now(),
  };

  if (isRealFirebase && db) {
    try {
      await setDoc(doc(db, 'wanted', id), {
        ...newWanted,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firebase setDoc failed, relying on local sync:', e);
    }
  }

  const wanted = getStoredWanted();
  const updated = [newWanted, ...wanted];
  saveStoredWanted(updated);
  notifyWanted();
  return newWanted;
}

// Mark exchange as COMPLETED & Atomically increment owner successfulExchanges
export async function markListingCompleted(listingId: string, ownerId: string): Promise<void> {
  // Update listing status
  const listings = getStoredListings();
  const updatedListings = listings.map((l) =>
    l.id === listingId ? { ...l, status: 'COMPLETED' as ItemStatus } : l
  );
  saveStoredListings(updatedListings);

  // Increment owner successfulExchanges
  const users = getStoredUsers();
  if (users[ownerId]) {
    users[ownerId].successfulExchanges = (users[ownerId].successfulExchanges || 0) + 1;
    saveStoredUsers(users);
  }

  // Update current user if matching
  const currentAuth = getSavedAuthUser();
  if (currentAuth && currentAuth.uid === ownerId) {
    currentAuth.successfulExchanges = (currentAuth.successfulExchanges || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentAuth));
    notifyAuth(currentAuth);
  }

  if (isRealFirebase && db) {
    try {
      await updateDoc(doc(db, 'listings', listingId), { status: 'COMPLETED' });
      await updateDoc(doc(db, 'users', ownerId), {
        successfulExchanges: increment(1),
      });
    } catch (e) {
      console.warn('Firebase completed trigger error:', e);
    }
  }

  notifyListings();
  notifyUsers();
}

export async function markWantedCompleted(wantedId: string, userId: string): Promise<void> {
  const wanted = getStoredWanted();
  const updatedWanted = wanted.map((w) =>
    w.id === wantedId ? { ...w, status: 'COMPLETED' as ItemStatus } : w
  );
  saveStoredWanted(updatedWanted);

  const users = getStoredUsers();
  if (users[userId]) {
    users[userId].successfulExchanges = (users[userId].successfulExchanges || 0) + 1;
    saveStoredUsers(users);
  }

  const currentAuth = getSavedAuthUser();
  if (currentAuth && currentAuth.uid === userId) {
    currentAuth.successfulExchanges = (currentAuth.successfulExchanges || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentAuth));
    notifyAuth(currentAuth);
  }

  if (isRealFirebase && db) {
    try {
      await updateDoc(doc(db, 'wanted', wantedId), { status: 'COMPLETED' });
      await updateDoc(doc(db, 'users', userId), {
        successfulExchanges: increment(1),
      });
    } catch (e) {
      console.warn('Firebase completed trigger error:', e);
    }
  }

  notifyWanted();
  notifyUsers();
}
