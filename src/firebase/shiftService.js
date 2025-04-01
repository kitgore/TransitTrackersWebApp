// src/firebase/shiftService.js
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
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { db } from './config';

// Get or create a schedule document for a specific date
const getScheduleDocRef = (date) => {
  // Format: "YYYY-MM-DD"
  return doc(db, 'schedules', date);
};

// Get shifts collection for a specific date
const getShiftsCollection = (date) => {
  const scheduleRef = getScheduleDocRef(date);
  return collection(scheduleRef, 'shifts');
};

// Fetch shifts for a specific date
export const fetchShiftsByDate = async (date) => {
  try {
    const shiftsCollection = getShiftsCollection(date);
    const snapshot = await getDocs(shiftsCollection);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id, // This is the Firestore document ID - most important for timeline
      firestoreId: doc.id, // Redundant but kept for compatibility
      date: date, // Ensure the date is always included
    }));
  } catch (error) {
    console.error(`Error fetching shifts for date ${date}:`, error);
    throw error;
  }
};

// Create a new shift for a specific date
export const createShift = async (shiftData) => {
  try {
    // Get the date from the shift data
    const { date } = shiftData;
   
    if (!date) {
      throw new Error('Shift data must include a date');
    }
   
    // Add timestamp
    const dataWithTimestamp = {
      ...shiftData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
   
    // Get the shifts collection for this date
    const shiftsCollection = getShiftsCollection(date);
   
    // Add the document to the shifts subcollection
    const docRef = await addDoc(shiftsCollection, dataWithTimestamp);
    
    // Return the shift data with the Firebase-generated ID
    return {
      ...dataWithTimestamp,
      id: docRef.id,
      firestoreId: docRef.id,
      date: date, // Ensure date is included
      
      // Set default values for any serverTimestamp fields
      // since they won't be immediately available
      createdAt: dataWithTimestamp.createdAt || new Date(),
      updatedAt: dataWithTimestamp.updatedAt || new Date(),
    };
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
};

// Update an existing shift
export const updateShift = async (date, id, shiftData) => {
  try {
    // Make sure id is a string
    const idString = String(id);
   
    const shiftsCollection = getShiftsCollection(date);
    const shiftRef = doc(shiftsCollection, idString);
   
    // Add timestamp and preserve the id
    const dataWithTimestamp = {
      ...shiftData,
      updatedAt: serverTimestamp(),
      id: idString, // Ensure ID is preserved
      firestoreId: idString, // Keep this for compatibility
      date: date, // Ensure date is included
    };
    
    // Remove any fields that shouldn't be updated
    delete dataWithTimestamp.createdAt; // Don't update creation time
   
    await updateDoc(shiftRef, dataWithTimestamp);
   
    return {
      ...dataWithTimestamp,
      // Set default value for updatedAt since serverTimestamp
      // won't be immediately available
      updatedAt: dataWithTimestamp.updatedAt || new Date(),
    };
  } catch (error) {
    console.error(`Error updating shift ${id}:`, error);
    throw error;
  }
};

// Delete a shift
export const deleteShift = async (date, id) => {
  try {
    if (!date) {
      throw new Error('Date is required to delete a shift');
    }
    
    if (!id) {
      throw new Error('Shift ID is required to delete a shift');
    }
    
    const shiftsCollection = getShiftsCollection(date);
    const shiftRef = doc(shiftsCollection, id);
    await deleteDoc(shiftRef);
    return id;
  } catch (error) {
    console.error(`Error deleting shift ${id}:`, error);
    throw error;
  }
};

// Fetch users for dropdown selection
export const fetchUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      displayName: `${doc.data().firstName} ${doc.data().lastName}`.trim() // Create displayName from firstName and lastName
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Fetch roles for configuration (renamed from groups)
export const fetchRoles = async () => {
  try {
    const rolesCollection = collection(db, 'roles');
    const snapshot = await getDocs(rolesCollection);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};