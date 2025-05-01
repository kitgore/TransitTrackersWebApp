import { getShiftsCollection } from './shiftService'; // Adjust import path
import { Timestamp, getDocs, query, where } from 'firebase/firestore';

interface CheckShiftConflictInput {
  driverId: string;
  vehicleId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  id?: string; // Optional — used to skip the current shift on edit
  date?: string; // Needed to know which subcollection to search
}

export async function checkShiftConflict(input: CheckShiftConflictInput): Promise<boolean> {
  const { driverId, vehicleId, startTime, endTime, id, date } = input;

  if (!date) throw new Error('Missing shift date for conflict check');

  const shiftsCollection = getShiftsCollection(date);

  // Get all shifts where startTime or endTime overlaps
  const q = query(
    shiftsCollection,
    where('startTime', '<', endTime),
    where('endTime', '>', startTime)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const shift = doc.data();

    const sameDriver = shift.userId === driverId;
    const sameVehicle = shift.vehicleId === vehicleId;
    const isSameShift = doc.id === id;

    if ((sameDriver || sameVehicle) && !isSameShift) {
      return true; // Conflict found
    }
  }

  return false; // No conflicts
}
