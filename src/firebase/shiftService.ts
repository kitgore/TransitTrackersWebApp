// src/firebase/shiftService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  collectionGroup,
  FieldValue,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { 
  //addShiftToVehicle, 
  //removeShiftFromVehicle, 
  //getVehicleAvailability,
  Vehicle
} from './vehicleService';

import { checkShiftConflict } from './conflictService';

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
  vehicleId?: string | null;
  vehicleName?: string | null;
  repeating?: boolean;
  repeatDays?: {
    M: boolean;
    Tu: boolean;
    W: boolean;
    Th: boolean;
    F: boolean;
    Sa: boolean;
    Su: boolean;
  };
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

// Add new types for drafts
interface Draft {
  id?: string;
  firestoreId?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED';
  shifts?: {
    [date: string]: {
      [shiftId: string]: Shift;
    };
  };
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

interface FirestoreDraft extends Omit<Draft, 'createdAt' | 'updatedAt'> {
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// Get or create a schedule document for a specific date
const getScheduleDocRef = (date: string) => {
  // Format: "YYYY-MM-DD"
  return doc(db, 'schedules', date);
};

// Get shifts collection for a specific date
export const getShiftsCollection = (date: string) => {
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
   
    // Ensure roleName is preserved if it exists in shiftData
    if (shiftData.roleName) {
      updateData.roleName = shiftData.roleName;
    }
   
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
    
    console.log(`Deleting shift ${id} from date ${date}`);
    
    // First, get the shift to check if it has a vehicle assigned
    const shiftsCollection = getShiftsCollection(date);
    const shiftRef = doc(shiftsCollection, id);
    const shiftDoc = await getDoc(shiftRef);
    
    if (shiftDoc.exists()) {
      const shiftData = shiftDoc.data() as Shift;
      const vehicleId = shiftData.vehicleId;
    }
    
    // Now delete the shift
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

// Fetch all vehicles
export const fetchVehicles = async (): Promise<Vehicle[]> => {
  try {
    const vehiclesCollection = collection(db, 'vehicles');
    const querySnapshot = await getDocs(vehiclesCollection);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vehicle));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

// Assign a vehicle to a shift
export const assignVehicleToShift = async (
  shiftId: string, 
  date: string, 
  vehicleId: string,
  vehicleName: string
): Promise<void> => {
  try {
    // Update the shift with the vehicle information
    const shiftRef = doc(db, `schedules/${date}/shifts`, shiftId);
    await updateDoc(shiftRef, {
      vehicleId,
      vehicleName,
      updatedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error(`Error assigning vehicle ${vehicleId} to shift ${shiftId}:`, error);
    throw error;
  }
};

// Remove vehicle assignment from a shift
export const removeVehicleFromShift = async (shiftId: string, date: string): Promise<void> => {
  try {
    console.log(`[removeVehicleFromShift] Removing vehicle from shift ${shiftId} for date ${date}`);
    
    // First try to get the shift directly by its document ID
    const shiftRef = doc(db, `schedules/${date}/shifts`, shiftId);
    let shiftDoc;
    
    try {
      shiftDoc = await getDoc(shiftRef);
      console.log(`[removeVehicleFromShift] Direct document lookup result:`, shiftDoc.exists() ? 'Found' : 'Not found');
    } catch (error) {
      console.error(`[removeVehicleFromShift] Error getting shift document:`, error);
      throw error;
    }
    
    // If not found by direct ID, try querying
    if (!shiftDoc.exists()) {
      console.log(`[removeVehicleFromShift] Shift not found by direct ID, trying query...`);
      const shiftsQuery = query(
        collection(db, `schedules/${date}/shifts`), 
        where('id', '==', shiftId)
      );
      
      const querySnapshot = await getDocs(shiftsQuery);
      
      if (querySnapshot.empty) {
        console.error(`[removeVehicleFromShift] Shift ${shiftId} not found in any collection`);
        throw new Error(`Shift ${shiftId} not found`);
      }
      
      shiftDoc = querySnapshot.docs[0];
      console.log(`[removeVehicleFromShift] Found shift via query`);
    }
    
    const shiftData = shiftDoc.data() as Shift;
    const vehicleId = shiftData.vehicleId;
    
    console.log(`[removeVehicleFromShift] Shift data:`, { vehicleId });
    
    if (!vehicleId) {
      console.log(`[removeVehicleFromShift] No vehicle assigned, nothing to do`);
      return;
    }
    
    // Update the shift to remove the vehicle information
    console.log(`[removeVehicleFromShift] Updating shift to remove vehicle information`);
    await updateDoc(shiftDoc.ref, {
      vehicleId: null,
      vehicleName: null,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[removeVehicleFromShift] Successfully removed vehicle from shift`);
  } catch (error) {
    console.error(`[removeVehicleFromShift] Error removing vehicle from shift ${shiftId}:`, error);
    throw error;
  }
};

// Update a shift with vehicle assignment
export const updateShiftWithVehicle = async (
  shiftId: string, 
  vehicleId: string | null, 
  vehicleName: string | null,
  date?: string
): Promise<void> => {
  try {
    console.log(`[updateShiftWithVehicle] Starting update for shift ${shiftId} with vehicle ${vehicleId} (${vehicleName}) for date ${date || 'unknown'}`);
    
    if (!date) {
      throw new Error('Date is required to update shift with vehicle');
    }

    // Get the shift reference using the nested collection path
    const shiftRef = doc(db, `schedules/${date}/shifts`, shiftId);
    console.log(`[updateShiftWithVehicle] Looking up shift at path: schedules/${date}/shifts/${shiftId}`);
    
    const shiftDoc = await getDoc(shiftRef);
    
    if (!shiftDoc.exists()) {
      console.error(`[updateShiftWithVehicle] Shift ${shiftId} not found at path: schedules/${date}/shifts/${shiftId}`);
      throw new Error(`Shift ${shiftId} not found`);
    }

    const shiftData = shiftDoc.data();
    console.log(`[updateShiftWithVehicle] Found shift data:`, shiftData);
    
    // Update the shift with new vehicle information
    const updateData: any = {
      vehicleId: vehicleId || null,
      vehicleName: vehicleName || null,
      updatedAt: serverTimestamp()
    };
    
    // Remove any undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log(`[updateShiftWithVehicle] Updating shift with data:`, updateData);
    await updateDoc(shiftRef, updateData);
    console.log(`[updateShiftWithVehicle] Successfully updated shift document`);

    console.log(`[updateShiftWithVehicle] Update completed successfully`);
  } catch (error) {
    console.error(`[updateShiftWithVehicle] Error updating shift ${shiftId}:`, error);
    throw error;
  }
};

export const fetchShiftsByUser = async (userId: string): Promise<Shift[]> => {
  try {
    console.log(`[fetchShiftsByUser] Starting fetch for user ID: ${userId}`);
    
    // Calculate date range for next 2 months
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 2);
    
    // Generate array of dates in YYYY-MM-DD format
    const dateRange: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`[fetchShiftsByUser] Generated date range with ${dateRange.length} dates`);
    
    // No need to filter future dates since we're already starting from today
    const futureDates = dateRange;
    console.log(`[fetchShiftsByUser] Looking at ${futureDates.length} days from today to ${endDate.toISOString().split('T')[0]}`);
    
    const allShifts: Shift[] = [];
    
    // Process each future date
    const fetchPromises = futureDates.map(async (date) => {
      try {
        // Try to directly access the shifts subcollection for this date
        const shiftsCollection = collection(db, `schedules/${date}/shifts`);
        const userShiftsQuery = query(shiftsCollection, where('userId', '==', userId));
        const userShiftsSnapshot = await getDocs(userShiftsQuery);
        
        console.log(`[fetchShiftsByUser] Found ${userShiftsSnapshot.size} shifts for user on date ${date}`);
        
        userShiftsSnapshot.docs.forEach(shiftDoc => {
          const shiftData = shiftDoc.data();
          allShifts.push({
            ...shiftData,
            id: shiftDoc.id,
            firestoreId: shiftDoc.id,
            date: date,
            createdAt: shiftData.createdAt?.toDate(),
            updatedAt: shiftData.updatedAt?.toDate()
          } as Shift);
        });
      } catch (error) {
        console.error(`[fetchShiftsByUser] Error processing shifts for date ${date}:`, error);
        // Continue with next date even if one fails
      }
    });
    
    // Wait for all promises to resolve
    await Promise.all(fetchPromises);
    
    console.log(`[fetchShiftsByUser] Total matching shifts found: ${allShifts.length}`);
    
    // Sort shifts by start time
    if (allShifts.length > 0) {
      const sortedShifts = allShifts.sort((a, b) => 
        new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime()
      );
      return sortedShifts;
    }
    
    return [];
  } catch (error) {
    console.error('[fetchShiftsByUser] Error:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get or create a draft document
const getDraftDocRef = (draftId: string) => {
  return doc(db, 'schedule-drafts', draftId);
};

// Create a new draft
export const createDraft = async (draftData: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Promise<Draft> => {
  try {
    const dataWithTimestamp: FirestoreDraft = {
      ...draftData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const draftsCollection = collection(db, 'schedule-drafts');
    const docRef = await addDoc(draftsCollection, dataWithTimestamp);

    return {
      ...draftData,
      id: docRef.id,
      firestoreId: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
};

// Get a draft by ID
export const getDraft = async (draftId: string): Promise<Draft | null> => {
  try {
    const draftRef = getDraftDocRef(draftId);
    const draftDoc = await getDoc(draftRef);

    if (!draftDoc.exists()) {
      return null;
    }

    return {
      ...draftDoc.data(),
      id: draftDoc.id,
      firestoreId: draftDoc.id
    } as Draft;
  } catch (error) {
    console.error('Error getting draft:', error);
    throw error;
  }
};

// Update a draft
export const updateDraft = async (draftId: string, draftData: Partial<Draft>): Promise<void> => {
  try {
    const draftRef = getDraftDocRef(draftId);
    const dataWithTimestamp = {
      ...draftData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(draftRef, dataWithTimestamp);
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
};

// Delete a draft
export const deleteDraft = async (draftId: string): Promise<void> => {
  try {
    const draftRef = getDraftDocRef(draftId);
    await deleteDoc(draftRef);
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

// Get all drafts
export const getAllDrafts = async (): Promise<Draft[]> => {
  try {
    const draftsCollection = collection(db, 'schedule-drafts');
    const querySnapshot = await getDocs(draftsCollection);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      firestoreId: doc.id
    })) as Draft[];
  } catch (error) {
    console.error('Error getting all drafts:', error);
    throw error;
  }
};

// Get drafts by date range
export const getDraftsByDateRange = async (startDate: string, endDate: string): Promise<Draft[]> => {
  try {
    const draftsCollection = collection(db, 'schedule-drafts');
    const q = query(
      draftsCollection,
      where('startDate', '>=', startDate),
      where('endDate', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      firestoreId: doc.id
    })) as Draft[];
  } catch (error) {
    console.error('Error getting drafts by date range:', error);
    throw error;
  }
};

// Publish a draft to the main schedule
export const publishDraft = async (draftId: string): Promise<void> => {
  try {
    const draft = await getDraft(draftId);
    if (!draft || !draft.shifts) {
      throw new Error('Draft not found or has no shifts');
    }

    // For each date in the draft
    for (const [date, shifts] of Object.entries(draft.shifts)) {
      // For each shift in the date
      for (const [shiftId, shiftData] of Object.entries(shifts)) {
        // Create the shift in the main schedule
        await createShift({
          ...shiftData,
          date: date
        });
      }
    }

    // Update draft status to published
    await updateDraft(draftId, { status: 'PUBLISHED' });
  } catch (error) {
    console.error('Error publishing draft:', error);
    throw error;
  }
};