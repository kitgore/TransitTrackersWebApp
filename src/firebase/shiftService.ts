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
  addShiftToVehicle, 
  removeShiftFromVehicle, 
  getVehicleAvailability,
  Vehicle
} from './vehicleService';

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
      
      // If the shift has a vehicle assigned, remove it from the vehicle
      if (vehicleId) {
        console.log(`Removing shift ${id} from vehicle ${vehicleId} before deletion`);
        await removeShiftFromVehicle(vehicleId, id, date);
      }
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

// Check if a vehicle is available for a specific time window
export const checkVehicleAvailability = async (
  vehicleId: string, 
  startTimeISO: string, 
  endTimeISO: string
): Promise<{ available: boolean; conflictingShifts: string[] }> => {
  try {
    // Extract dates from ISO strings
    const startDate = startTimeISO.split('T')[0];
    const endDate = endTimeISO.split('T')[0];
    
    return await getVehicleAvailability(vehicleId, startDate, endDate);
  } catch (error) {
    console.error(`Error checking availability for vehicle ${vehicleId}:`, error);
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
    
    // Add the shift to the vehicle's assigned shifts
    await addShiftToVehicle(vehicleId, shiftId, date);
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
    
    // Remove the shift from the vehicle's assigned shifts
    console.log(`[removeVehicleFromShift] Removing shift from vehicle's assigned shifts`);
    await removeShiftFromVehicle(vehicleId, shiftId, date);
    
    console.log(`[removeVehicleFromShift] Successfully removed vehicle from shift`);
  } catch (error) {
    console.error(`[removeVehicleFromShift] Error removing vehicle from shift ${shiftId}:`, error);
    throw error;
  }
};

// Update a shift with vehicle assignment
export const updateShiftWithVehicle = async (shiftId: string, vehicleId: string | null, vehicleName: string | null): Promise<void> => {
  try {
    console.log(`[updateShiftWithVehicle] Starting update for shift ${shiftId} with vehicle ${vehicleId} (${vehicleName})`);
    
    // First, try to find the shift in the schedules collection
    let shiftDoc = null;
    let shiftData = null;
    let shiftDate = null;
    
    // Try to find the shift in the schedules collection
    const schedulesRef = collection(db, 'schedules');
    const schedulesSnapshot = await getDocs(schedulesRef);
    
    for (const scheduleDoc of schedulesSnapshot.docs) {
      const date = scheduleDoc.id;
      const shiftsRef = collection(db, `schedules/${date}/shifts`);
      const shiftsSnapshot = await getDocs(shiftsRef);
      
      for (const doc of shiftsSnapshot.docs) {
        if (doc.id === shiftId) {
          shiftDoc = doc;
          shiftData = doc.data();
          shiftDate = date;
          console.log(`[updateShiftWithVehicle] Found shift in schedules/${date}/shifts/${shiftId}`);
          break;
        }
      }
      
      if (shiftDoc) break;
    }
    
    // If shift not found in schedules, try the shifts collection
    if (!shiftDoc) {
      console.log(`[updateShiftWithVehicle] Shift not found in schedules, trying shifts collection...`);
      const shiftRef = doc(db, 'shifts', shiftId);
      shiftDoc = await getDoc(shiftRef);
      
      if (shiftDoc.exists()) {
        shiftData = shiftDoc.data();
        shiftDate = shiftData.date;
        console.log(`[updateShiftWithVehicle] Found shift in shifts collection`);
      } else {
        console.error(`[updateShiftWithVehicle] Shift ${shiftId} not found in any collection`);
        throw new Error(`Shift ${shiftId} not found`);
      }
    }
    
    if (!shiftData) {
      console.error(`[updateShiftWithVehicle] Shift ${shiftId} has no data`);
      throw new Error(`Shift ${shiftId} has no data`);
    }
    
    if (!shiftDate) {
      console.error(`[updateShiftWithVehicle] Shift ${shiftId} has no date`);
      throw new Error(`Shift ${shiftId} has no date`);
    }
    
    const currentVehicleId = shiftData.vehicleId;
    
    console.log(`[updateShiftWithVehicle] Current vehicle ID: ${currentVehicleId}, New vehicle ID: ${vehicleId}`);
    
    // Update the shift with new vehicle information
    const updateData: any = {
      vehicleId: vehicleId,
      vehicleName: vehicleName,
      updatedAt: serverTimestamp()
    };
    
    // Get the correct document reference based on where we found the shift
    let docRef;
    if (shiftDoc.ref.path.includes('schedules')) {
      docRef = shiftDoc.ref;
    } else {
      docRef = doc(db, 'shifts', shiftId);
    }
    
    console.log(`[updateShiftWithVehicle] Updating shift with data:`, updateData);
    await updateDoc(docRef, updateData);
    console.log(`[updateShiftWithVehicle] Successfully updated shift document`);
    
    // Handle vehicle assignment changes
    if (currentVehicleId !== vehicleId) {
      console.log(`[updateShiftWithVehicle] Vehicle ID changed, updating vehicle assignments`);
      
      // Remove from old vehicle if it exists
      if (currentVehicleId) {
        console.log(`[updateShiftWithVehicle] Removing shift from old vehicle ${currentVehicleId}`);
        await removeShiftFromVehicle(currentVehicleId, shiftId, shiftDate);
        console.log(`[updateShiftWithVehicle] Successfully removed from old vehicle`);
      }
      
      // Add to new vehicle if provided
      if (vehicleId) {
        console.log(`[updateShiftWithVehicle] Adding shift to new vehicle ${vehicleId}`);
        await addShiftToVehicle(vehicleId, shiftId, shiftDate);
        console.log(`[updateShiftWithVehicle] Successfully added to new vehicle`);
      }
    } else {
      console.log(`[updateShiftWithVehicle] Vehicle ID unchanged, no vehicle assignment updates needed`);
    }
    
    console.log(`[updateShiftWithVehicle] Update completed successfully`);
  } catch (error) {
    console.error(`[updateShiftWithVehicle] Error updating shift ${shiftId}:`, error);
    throw error;
  }
};

// Get future shifts for a vehicle (for when a vehicle goes out of service)
export const getFutureShiftsForVehicle = async (vehicleId: string): Promise<{ date: string; shiftIds: string[] }[]> => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }
    
    const vehicleData = vehicleDoc.data() as Vehicle;
    const assignedShifts = vehicleData.assignedShifts || {};
    
    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Filter for future dates only
    const futureShifts = Object.entries(assignedShifts)
      .filter(([date]) => date >= today)
      .map(([date, shiftIds]) => ({ date, shiftIds }));
    
    return futureShifts;
  } catch (error) {
    console.error(`Error getting future shifts for vehicle ${vehicleId}:`, error);
    throw error;
  }
};