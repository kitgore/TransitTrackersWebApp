import { getShiftsCollection } from './shiftService'; // Adjust import path
import { Timestamp, getDocs, query, where } from 'firebase/firestore';

interface CheckShiftConflictInput {
  driverId?: string;
  vehicleId?: string;
  startTime: string; // Changed to string in "HH:mm" format
  endTime: string;   // Changed to string in "HH:mm" format
  id?: string;       // Optional — used to skip the current shift on edit
  date?: string;     // Needed to know which subcollection to search
}

export async function checkShiftConflict(input: CheckShiftConflictInput): Promise<boolean> {
  console.log("CONFLICT CHECKER CALLED");
  const { driverId, vehicleId, startTime, endTime, id, date } = input;

  if (!date) throw new Error('Missing shift date for conflict check');

  console.log(date);

  const shiftsCollection = getShiftsCollection(date);

  // Convert startTime and endTime strings to Date objects
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0); // Set time based on the startTime
  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0, 0); // Set time based on the endTime

  // Fetch all shifts where startTime is before the end of the new shift
  const q = query(shiftsCollection, where('startTime', '<', endDate));
  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const shift = doc.data();

    // Skip current shift when editing
    if (doc.id === id) continue;

    // Skip if it doesn't have start/end time
    if (!shift.startTime || !shift.endTime) continue;

    const shiftStart = shift.startTime.toDate();
    const shiftEnd = shift.endTime.toDate();

    // Check if this shift overlaps
    const overlaps = shiftEnd > startDate && shiftStart < endDate;

    // Check for same driver or vehicle
    const sameDriver = driverId && shift.userId === driverId;
    const sameVehicle = vehicleId && shift.vehicleId === vehicleId;

    if (overlaps && (sameDriver || sameVehicle)) {
      return true; // Conflict
    }
  }

  return false; // No conflict
}

