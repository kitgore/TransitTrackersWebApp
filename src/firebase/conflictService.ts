import { getShiftsCollection } from './shiftService'; // Adjust import path
import { Timestamp, getDocs, query, where } from 'firebase/firestore';

interface CheckShiftConflictInput {
  driverId?: string;
  vehicleId?: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  id?: string;
  date: string;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [hour, minute] = timeStr.split(":").map(Number);
  const date = new Date(dateStr + "T00:00:00");
  date.setHours(hour, minute, 0, 0);
  return date;
}

export async function checkShiftConflict(input: CheckShiftConflictInput): Promise<any[] | null> {
  const { driverId, vehicleId, startTime, endTime, id, date } = input;

  const newStart = combineDateAndTime(date, startTime);
  const newEnd = combineDateAndTime(date, endTime);

  const shiftsCollection = getShiftsCollection(date);
  const snapshot = await getDocs(shiftsCollection);

  const conflictingShifts: any[] = [];

  for (const doc of snapshot.docs) {
    const shift = doc.data();

    if (doc.id === id) continue; // Skip the current shift being edited
    if (!shift.startTimeFormatted || !shift.endTimeFormatted) continue;

    const shiftStart = combineDateAndTime(date, shift.startTimeFormatted);
    const shiftEnd = combineDateAndTime(date, shift.endTimeFormatted);

    const overlaps = shiftEnd > newStart && shiftStart < newEnd;
    const sameDriver = driverId && shift.userId === driverId;
    const sameVehicle = vehicleId && shift.vehicleId === vehicleId;

    if (overlaps && (sameDriver || sameVehicle)) {
      conflictingShifts.push({ id: doc.id, ...shift });
    }
  }

  return conflictingShifts.length > 0 ? conflictingShifts : null;
}
