import { collection, doc, getDocs, getDoc, updateDoc, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Vehicle interface
export interface Vehicle {
  id: string;
  name: string;
  vin: string;
  licensePlate: string;
  status: string;
  note?: string;
  assignedShifts?: {
    [date: string]: string[]; // date -> array of shift IDs
  };
}

// Fetch all vehicles
export const fetchAllVehicles = async (): Promise<Vehicle[]> => {
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

// Fetch vehicles by status
export const fetchVehiclesByStatus = async (status: string): Promise<Vehicle[]> => {
  try {
    const vehiclesCollection = collection(db, 'vehicles');
    const q = query(vehiclesCollection, where('status', '==', status));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vehicle));
  } catch (error) {
    console.error(`Error fetching vehicles with status ${status}:`, error);
    throw error;
  }
};

// Update vehicle status
export const updateVehicleStatus = async (vehicleId: string, status: string, note?: string): Promise<void> => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (note !== undefined) {
      updateData.note = note;
    }
    
    await updateDoc(vehicleRef, updateData);
  } catch (error) {
    console.error(`Error updating vehicle ${vehicleId} status:`, error);
    throw error;
  }
};

// Add shift to vehicle's assigned shifts
export const addShiftToVehicle = async (vehicleId: string, shiftId: string, date: string): Promise<void> => {
  try {
    console.log(`[addShiftToVehicle] Adding shift ${shiftId} to vehicle ${vehicleId} for date ${date}`);
    
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      console.error(`[addShiftToVehicle] Vehicle ${vehicleId} does not exist`);
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }
    
    const vehicleData = vehicleDoc.data() as Vehicle;
    const assignedShifts = vehicleData.assignedShifts || {};
    
    console.log(`[addShiftToVehicle] Current assigned shifts:`, assignedShifts);
    
    // Initialize the date array if it doesn't exist
    if (!assignedShifts[date]) {
      assignedShifts[date] = [];
      console.log(`[addShiftToVehicle] Initialized empty array for date ${date}`);
    }
    
    // Add the shift ID if it's not already there
    if (!assignedShifts[date].includes(shiftId)) {
      assignedShifts[date].push(shiftId);
      console.log(`[addShiftToVehicle] Added shift ${shiftId} to date ${date}`);
      
      // Update the vehicle document with the new assignments
      await updateDoc(vehicleRef, {
        assignedShifts,
        updatedAt: serverTimestamp()
      });
      
      console.log(`[addShiftToVehicle] Successfully updated vehicle document`);
    } else {
      console.log(`[addShiftToVehicle] Shift ${shiftId} already assigned to vehicle for date ${date}`);
    }
  } catch (error) {
    console.error(`[addShiftToVehicle] Error adding shift ${shiftId} to vehicle ${vehicleId}:`, error);
    throw error;
  }
};

// Remove shift from vehicle's assigned shifts
export const removeShiftFromVehicle = async (vehicleId: string, shiftId: string, date: string): Promise<void> => {
  try {
    console.log(`[removeShiftFromVehicle] Removing shift ${shiftId} from vehicle ${vehicleId} for date ${date}`);
    
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      console.error(`[removeShiftFromVehicle] Vehicle ${vehicleId} does not exist`);
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }
    
    const vehicleData = vehicleDoc.data() as Vehicle;
    const assignedShifts = vehicleData.assignedShifts || {};
    
    console.log(`[removeShiftFromVehicle] Current assigned shifts:`, assignedShifts);
    
    // Check if the date exists in assignedShifts
    if (assignedShifts[date]) {
      // Remove the shift ID if it exists
      const beforeCount = assignedShifts[date].length;
      assignedShifts[date] = assignedShifts[date].filter(id => id !== shiftId);
      const afterCount = assignedShifts[date].length;
      
      if (beforeCount !== afterCount) {
        console.log(`[removeShiftFromVehicle] Removed shift ${shiftId} from date ${date}`);
        
        // If the date array is empty, remove the date entry
        if (assignedShifts[date].length === 0) {
          delete assignedShifts[date];
          console.log(`[removeShiftFromVehicle] Removed empty date entry for ${date}`);
        }
        
        // Update the vehicle document with the new assignments
        await updateDoc(vehicleRef, {
          assignedShifts,
          updatedAt: serverTimestamp()
        });
        
        console.log(`[removeShiftFromVehicle] Successfully updated vehicle document`);
      } else {
        console.log(`[removeShiftFromVehicle] Shift ${shiftId} was not found in date ${date}`);
      }
    } else {
      console.log(`[removeShiftFromVehicle] No shifts found for date ${date}`);
    }
  } catch (error) {
    console.error(`[removeShiftFromVehicle] Error removing shift ${shiftId} from vehicle ${vehicleId}:`, error);
    throw error;
  }
};

// Get vehicle availability for a date range
export const getVehicleAvailability = async (
  vehicleId: string, 
  startDate: string, 
  endDate: string
): Promise<{ available: boolean; conflictingShifts: string[] }> => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (!vehicleDoc.exists()) {
      throw new Error(`Vehicle ${vehicleId} does not exist`);
    }
    
    const vehicleData = vehicleDoc.data() as Vehicle;
    
    // Check if the vehicle is out of service
    if (vehicleData.status === 'Out of Service') {
      return { available: false, conflictingShifts: [] };
    }
    
    // Get all assigned shifts for the date range
    const assignedShifts = vehicleData.assignedShifts || {};
    const conflictingShifts: string[] = [];
    
    // Check each date in the range
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (assignedShifts[dateStr] && assignedShifts[dateStr].length > 0) {
        conflictingShifts.push(...assignedShifts[dateStr]);
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      available: conflictingShifts.length === 0,
      conflictingShifts
    };
  } catch (error) {
    console.error(`Error checking availability for vehicle ${vehicleId}:`, error);
    throw error;
  }
};

// Get future shifts assigned to a vehicle (for when a vehicle goes out of service)
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