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
  collectionGroup,
  FieldValue,
  orderBy
} from 'firebase/firestore';
import { db } from './config';

// Type definitions
interface Shift {
  id?: string;
  firestoreId?: string;
  date: string;
  name: string;
  role: string;
  roleName?: string;
  startTimeISO: string;
  endTimeISO: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'PENDING';
  userId?: string | null;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Role {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FirestoreShift extends Omit<Shift, 'createdAt' | 'updatedAt'> {
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// Get or create a schedule document for a specific date
const getScheduleDocRef = (date: string) => {
  // Format: "YYYY-MM-DD"
  return doc(db, 'schedules', date);
};

// Get shifts collection for a specific date
const getShiftsCollection = (date: string) => {
  const scheduleRef = getScheduleDocRef(date);
  return collection(scheduleRef, 'shifts');
};

// Fetch shifts for a specific date
export const fetchShiftsByDate = async (date: string): Promise<Shift[]> => {
  try {
    const shiftsCollection = getShiftsCollection(date);
    const snapshot = await getDocs(shiftsCollection);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        firestoreId: doc.id,
        date: date,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Shift;
    });
  } catch (error) {
    console.error(`Error fetching shifts for date ${date}:`, error);
    throw error;
  }
};

// Create a new shift for a specific date
export const createShift = async (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shift> => {
  try {
    // Get the date from the shift data
    const { date } = shiftData;
   
    if (!date) {
      throw new Error('Shift data must include a date');
    }
   
    // Add timestamp
    const dataWithTimestamp: FirestoreShift = {
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
      ...shiftData,
      id: docRef.id,
      firestoreId: docRef.id,
      date: date,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
};

// Update an existing shift
export const updateShift = async (date: string, id: string, shiftData: Partial<Shift>): Promise<Shift> => {
  try {
    // Make sure id is a string
    const idString = String(id);
   
    const shiftsCollection = getShiftsCollection(date);
    const shiftRef = doc(shiftsCollection, idString);
   
    // Create a clean object with only the fields we want to update
    const updateData: Record<string, any> = {
      ...shiftData,
      updatedAt: serverTimestamp(),
      id: idString,
      date: date,
    };
    
    // Remove any fields that shouldn't be updated
    delete updateData.createdAt; // Don't update creation time
    delete updateData.firestoreId; // Don't update firestoreId
   
    await updateDoc(shiftRef, updateData);
   
    return {
      ...shiftData,
      id: idString,
      firestoreId: idString,
      date: date,
      updatedAt: new Date()
    } as Shift;
  } catch (error) {
    console.error(`Error updating shift ${id}:`, error);
    throw error;
  }
};

// Delete a shift
export const deleteShift = async (date: string, id: string): Promise<string> => {
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
export const fetchRoles = async (): Promise<Role[]> => {
  try {
    const rolesCollection = collection(db, 'roles');
    const snapshot = await getDocs(rolesCollection);
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          order: data.order,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      })
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Create a new role
export const createRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
  try {
    const rolesCollection = collection(db, 'roles');
    
    // Add timestamp
    const dataWithTimestamp = {
      ...roleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add the document to the roles collection
    const docRef = await addDoc(rolesCollection, dataWithTimestamp);
    
    // Return the role data with the Firebase-generated ID
    return {
      ...roleData,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

// Update an existing role
export const updateRole = async (id: string, roleData: Partial<Role>): Promise<Role> => {
  try {
    const rolesCollection = collection(db, 'roles');
    const roleRef = doc(rolesCollection, id);
    
    // Add timestamp and preserve the id
    const dataWithTimestamp = {
      ...roleData,
      updatedAt: serverTimestamp(),
      id: id,
    };
    
    // Remove any fields that shouldn't be updated
    delete dataWithTimestamp.createdAt; // Don't update creation time
    
    await updateDoc(roleRef, dataWithTimestamp);
    
    return {
      ...roleData,
      id: id,
      updatedAt: new Date()
    } as Role;
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

// Delete a role
export const deleteRole = async (id: string): Promise<string> => {
  try {
    if (!id) {
      throw new Error('Role ID is required to delete a role');
    }
    
    const rolesCollection = collection(db, 'roles');
    const roleRef = doc(rolesCollection, id);
    await deleteDoc(roleRef);
    return id;
  } catch (error) {
    console.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};