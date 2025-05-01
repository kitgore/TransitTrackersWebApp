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
    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentDate = `${currentDateTime.getFullYear()}-${pad(currentDateTime.getMonth() + 1)}-${pad(currentDateTime.getDate())}`;
    console.log("Local currentDateTime:", currentDateTime.toString());


    const shiftsSnapshot = await getDocs(getShiftsCollection(currentDate));

    const activeVehicleToDriverNameMap = new Map<string, string>();

    // Step 1: Identify active vehicles and store driver name
    shiftsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.vehicleId || data.vehicleId === "Select") return;

      const start = data.start instanceof Timestamp
      ? data.start.toDate()
      : data.startTime instanceof Timestamp
      ? data.startTime.toDate()
      : new Date(data.start || data.startTime);

    const end = data.end instanceof Timestamp
      ? data.end.toDate()
      : data.endTime instanceof Timestamp
      ? data.endTime.toDate()
      : new Date(data.end || data.endTime);


      if (currentDateTime >= start && currentDateTime <= end) {
        const driverName = data.name || "Unknown Driver";
        activeVehicleToDriverNameMap.set(data.vehicleId, driverName);
      }
    });

    // Step 2: Update vehicle statuses
    const vehiclesSnapshot = await getDocs(collection(db, "vehicles"));

    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleId = vehicleDoc.id;
      const isActive = activeVehicleToDriverNameMap.has(vehicleId);
      const currentStatus = vehicleDoc.data().status;

      if (currentStatus === "Out of Service") {
        console.log(`Vehicle ${vehicleId} status is "Out of Service", skipping update.`);
        continue;
      }

      const desiredStatus = isActive ? "In Use" : "Available";

      if (currentStatus !== desiredStatus) {
        const updateData: any = {
          status: desiredStatus
        };
      
        if (isActive) {
          const driverName = activeVehicleToDriverNameMap.get(vehicleId) || "Unknown Driver";
          updateData.note = `Being Driven by ${driverName}`; // update the note as well
          console.log(`Vehicle ${vehicleId} set to 'In Use' by ${driverName}`);
        } else {
          updateData.note = ""; // Optional: clear the note
          console.log(`Vehicle ${vehicleId} set to 'Available'`);
        }
      
        await updateDoc(doc(db, "vehicles", vehicleId), updateData);
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