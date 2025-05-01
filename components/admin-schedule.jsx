'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchShiftsByDate, 
  createShift as createFirebaseShift, 
  updateShift as updateFirebaseShift, 
  deleteShift as deleteFirebaseShift,
  fetchUsers,
  fetchRoles,
  fetchVehicles,
  updateShiftWithVehicle
} from '@/src/firebase/shiftService';
import { DATE_FORMATS } from './base-schedule';
import BaseAdminSchedule from './base-admin-schedule';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSchedule() {
  // State for data
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [roles, setRoles] = useState([{ id: 'default', content: 'Loading Roles...' }]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Format date for Firebase queries
  const formatDate = (date, format) => {
    if (format === DATE_FORMATS.ISO) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return date.toISOString();
  };

  // Format date for display
  const formatDateHeader = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Convert Firestore Timestamp to Date
  const convertTimestampToDate = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    return new Date(timestamp);
  };

  // Format shift data for timeline
  const formatShiftForTimeline = (shift) => {
    const startDate = convertTimestampToDate(shift.startTimeISO || shift.start);
    const endDate = convertTimestampToDate(shift.endTimeISO || shift.end);

    return {
      ...shift,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startTimeISO: startDate.toISOString(),
      endTimeISO: endDate.toISOString(),
    };
  };

  // Fetch shifts from Firebase
  const fetchShiftsFromFirebase = async (date) => {
    const dateISO = formatDate(date, DATE_FORMATS.ISO);
    try {
      const shifts = await fetchShiftsByDate(dateISO);
      const shiftsWithDate = shifts.map(shift => ({
        ...shift,
        date: dateISO,
      }));
      return shiftsWithDate.map(formatShiftForTimeline);
    } catch (error) {
      console.error(`Error fetching shifts: ${error.message}`);
      return [];
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load roles
        const fetchedRoles = await fetchRoles();
        if (fetchedRoles.length > 0) {
          setRoles(fetchedRoles.map(role => ({
            id: role.id,
            content: role.name || role.content // Use name if available, fallback to content
          })));
        }

        // Load users
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);

        // Load vehicles
        const fetchedVehicles = await fetchVehicles();
        setVehicles(fetchedVehicles);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load shifts when date changes
  useEffect(() => {
    const loadShifts = async () => {
      if (roles.length === 0 || roles[0].id === 'default') return;
      
      const fetchedShifts = await fetchShiftsFromFirebase(currentDate);
      setShifts(fetchedShifts);
    };

    loadShifts();
  }, [currentDate, roles]);

  // Callbacks for shift operations
  const handleShiftCreate = async (shift) => {
    try {
      const savedShift = await createFirebaseShift(shift);
      const formattedShift = formatShiftForTimeline(savedShift);
      setShifts(prev => [...prev, formattedShift]);
      return formattedShift;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  };

  const handleShiftUpdate = async (shift) => {
    try {
      const originalShift = shifts.find(s => s.id === shift.id);
      
      // Update local state immediately
      const formattedShift = formatShiftForTimeline(shift);
      setShifts(prev => prev.map(s => s.id === shift.id ? formattedShift : s));
      
      // Handle vehicle assignment changes
      if (originalShift?.vehicleId !== shift.vehicleId) {
        await updateShiftWithVehicle(
          shift.id,
          shift.vehicleId || null,
          shift.vehicleName || null,
          shift.date
        );
      }
      
      // Update the shift in Firebase
      await updateFirebaseShift(shift.date, shift.id, shift);
      
      return formattedShift;
    } catch (error) {
      console.error('Error updating shift:', error);
      // Revert local state if the update fails
      setShifts(prev => prev.map(s => s.id === shift.id ? originalShift : s));
      throw error;
    }
  };

  const handleShiftDelete = async (shift) => {
    try {
      await deleteFirebaseShift(shift.date, shift.id);
      setShifts(prev => prev.filter(s => s.id !== shift.id));
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10" 
          onClick={() => setCurrentDate(prev => new Date(prev.getTime() - 86400000))}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] h-10 justify-start text-left font-normal",
                !currentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-5 w-5" />
              <span>{formatDateHeader(currentDate)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  setCurrentDate(date);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10" 
          onClick={() => setCurrentDate(prev => new Date(prev.getTime() + 86400000))}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <BaseAdminSchedule
        shifts={shifts}
        roles={roles}
        users={users}
        vehicles={vehicles}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onShiftCreate={handleShiftCreate}
        onShiftUpdate={handleShiftUpdate}
        onShiftDelete={handleShiftDelete}
      />
    </div>
  );
}