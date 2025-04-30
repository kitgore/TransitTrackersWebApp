import { collection, doc, getDocs, getDoc, updateDoc, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { getShiftsCollection } from './shiftService';

// Vehicle interface
export interface Vehicle {
  id: string;
  name: string;
  vin: string;
  licensePlate: string;
  status: string;
  note?: string;
  adaAccessible?: boolean;
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

export const setVehicleStatusToInUseForCurrentShift = async (): Promise<void> => {
  console.log("set vehicle status called");

  try {
    const currentDateTime = new Date();
    const currentDate = currentDateTime.toISOString().split('T')[0];
    const shiftsSnapshot = await getDocs(getShiftsCollection(currentDate));

    const activeVehicleIds = new Set<string>();

    shiftsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.vehicleId || data.vehicleId === "Select") return;

      const start = data.start instanceof Timestamp ? data.start.toDate() : new Date(data.start);
      const end = data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end);

      if (currentDateTime >= start && currentDateTime <= end) {
        activeVehicleIds.add(data.vehicleId);
      }
    });

    const vehiclesSnapshot = await getDocs(collection(db, "vehicles"));

    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleId = vehicleDoc.id;
      const isActive = activeVehicleIds.has(vehicleId);
      const currentStatus = vehicleDoc.data().status;

      // Skip updating the vehicle status if it's "Out of Service"
      if (currentStatus === "Out of Service") {
        console.log(`Vehicle ${vehicleId} status is "Out of Service", skipping update.`);
        continue;
      }

      const desiredStatus = isActive ? "In Use" : "Available";

      // Only update the status if it's not already the desired status
      if (currentStatus !== desiredStatus) {
        await updateDoc(doc(db, "vehicles", vehicleId), {
          status: desiredStatus
        });
        console.log(`Vehicle ${vehicleId} status set to ${desiredStatus}`);
      }
    }

  } catch (error) {
    console.error("Error setting vehicle statuses:", error);
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