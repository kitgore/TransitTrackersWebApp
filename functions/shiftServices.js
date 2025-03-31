import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    query, 
    where,
    Timestamp,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from './config';
  
  // Collection references
  const shiftsCollection = collection(db, 'shifts');
  const usersCollection = collection(db, 'users');
  const rolesCollection = collection(db, 'roles');
  
  // Fetch shifts for a specific date
  export const fetchShiftsByDate = async (date) => {
    const q = query(shiftsCollection, where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };
  
  // Create a new shift
  export const createShift = async (shiftData) => {
    // Add timestamp
    const dataWithTimestamp = {
      ...shiftData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(shiftsCollection, dataWithTimestamp);
    return {
      id: docRef.id,
      ...dataWithTimestamp
    };
  };
  
  // Update an existing shift
  export const updateShift = async (id, shiftData) => {
    const shiftRef = doc(db, 'shifts', id);
    
    // Add timestamp
    const dataWithTimestamp = {
      ...shiftData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(shiftRef, dataWithTimestamp);
    return {
      id,
      ...dataWithTimestamp
    };
  };
  
  // Delete a shift
  export const deleteShift = async (id) => {
    const shiftRef = doc(db, 'shifts', id);
    await deleteDoc(shiftRef);
    return id;
  };
  
  // Fetch users for dropdown selection
  export const fetchUsers = async () => {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };
  
  // Fetch roles for configuration
  export const fetchRoles = async () => {
    const snapshot = await getDocs(rolesCollection);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => a.order - b.order);
  };