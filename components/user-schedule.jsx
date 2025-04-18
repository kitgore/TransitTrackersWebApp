'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GanttTimeline from '@/components/vis-timeline'; // Adjust path as needed
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import dayjs from 'dayjs';

import { Label } from '@/components/ui/label';
import { 
  fetchShiftsByDate, 
  createShift as createFirebaseShift, 
  updateShift as updateFirebaseShift, 
  deleteShift as deleteFirebaseShift,
  fetchUsers,
  fetchRoles,
  fetchVehicles,
  checkVehicleAvailability,
  assignVehicleToShift,
  removeVehicleFromShift,
  updateShiftWithVehicle
} from '@/src/firebase/shiftService';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Constants for shift status
const SHIFT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  PENDING: 'PENDING',
};

// Constants for date formatting
const DATE_FORMATS = {
  ISO: 'iso',
  DISPLAY: 'display',
};

export default function ShiftScheduler() {
  // Get current user from AuthContext
  const { user } = useAuth();
  
  // Reference to timeline for event handling
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  
  // Reference to the timeline's internal datasets
  const itemsDatasetRef = useRef(null);
  const rolesDatasetRef = useRef(null);
  
  // Get today's date for creating the sample data
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // State for dialog control - only keep the edit dialog for picking up shifts
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // State for editing an existing shift
  const [editShiftData, setEditShiftData] = useState({
    id: '',
    name: '',
    startTime: null,
    endTime: null,
    role: '',
    roleName: '',
    formattedStartTime: '',
    formattedEndTime: '',
    status: '',
    userId: null,
    vehicleId: null,
    vehicleName: null,
  });

  // State for roles and users
  const [roles, setRoles] = useState([
      { id: 'default', content: 'Loading Roles...' }
  ]);
  
  // State for users
  const [users, setUsers] = useState([]);
  
  // State for vehicles
  const [vehicles, setVehicles] = useState([]);
  
  // State for vehicle availability
  const [vehicleAvailability, setVehicleAvailability] = useState({});
  
  // State for vehicle selection error
  const [vehicleError, setVehicleError] = useState('');

  const colors = { bg: '#18181b', border: '#18181b' };
  
  // State for shifts - start with empty array
  const [shifts, setShifts] = useState([]);
  
  // ========== Utility Functions ==========
  
  // Format date consistently - this is critical!
  const formatDateForTimeline = (date) => {
    return date.toISOString(); // Always use ISO string with timezone
  };
  
  // Create a date at a specific hour
  const createDateAtHour = (hour, minutes = 0) => {
    const date = new Date(currentDate);
    date.setHours(hour, minutes, 0, 0);
    return formatDateForTimeline(date);
  };
  
  // Format time display in HH:MM format
  const formatTimeDisplay = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Format time input value (HH:MM format for input type="time")
  const formatTimeInput = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Parse time input value
  const parseTimeInput = (timeStr, baseDate) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Format date for Firebase queries and display
  const formatDate = (date, format) => {
    if (format === DATE_FORMATS.ISO) {
      return date.toISOString().split('T')[0];
    } else {
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    }
  };
  
  // Format date header
  const formatDateHeader = (date) => {
    return formatDate(date, DATE_FORMATS.DISPLAY);
  };
  
  // Function to determine if a shift is available
  const isShiftAvailable = (name) => {
    return name.toUpperCase() === SHIFT_STATUS.AVAILABLE;
  };
  
  // Get role name by ID
  const getRoleNameById = (roleId) => {
    console.log('🔍 Looking up role name for ID:', roleId);
    console.log('Available roles:', roles);
    const role = roles.find(r => r.id === roleId);
    console.log('Found role:', role);
    return role ? role.content : roleId;
  };

  // Get role name for display
  const getRoleDisplayName = (shift) => {
    console.log('📋 Getting role display name for shift:', shift);
    if (!shift) {
      console.log('❌ No shift provided');
      return '';
    }
    // First try to use the roleName from the shift data
    if (shift.roleName) {
      console.log('✅ Using shift.roleName:', shift.roleName);
      return shift.roleName;
    }
    // Fallback to looking up the role name
    console.log('🔄 Falling back to role lookup for role:', shift.role);
    return getRoleNameById(shift.role);
  };

  // Format time for dialog title
  const formatTimeForTitle = (date) => {
    if (!date) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // update the date when currentDate changes
  useEffect(() => {
    if (!timelineRef.current) return;
    const min = new Date(new Date(currentDate).setHours(5, 0, 0, 0));
    const max = new Date(new Date(currentDate).setHours(24, 0, 0, 0));
    timelineRef.current.setWindow(min, max, { animation: false });
  }, [currentDate]);

  // ========== Firebase Integration Functions ==========
  
  // Fetch shifts from Firebase
  const fetchShiftsFromFirebase = useCallback(async () => {
    const dateISO = formatDate(currentDate, DATE_FORMATS.ISO);
    try {
      console.log(`Fetching shifts for date: ${dateISO}`);
      const shifts = await fetchShiftsByDate(dateISO);
      
      // Ensure each shift has a date property
      const shiftsWithDate = shifts.map(shift => ({
        ...shift,
        date: dateISO, // Explicitly add the date
      }));
      
      console.log(`Found ${shiftsWithDate.length} shifts for date ${dateISO}`);
      return shiftsWithDate;
    } catch (error) {
      console.error(`Error fetching shifts: ${error.message}`);
      return [];
    }
  }, [currentDate]);

  // Save shift to Firebase
  const saveShiftToFirebase = useCallback(async (shift) => {
    const savedShift = await createFirebaseShift(shift);
    return savedShift;
  }, []);

// Update shift in Firebase
const updateShiftInFirebase = useCallback(async (shift) => {
  try {
    // Extract the required data
    const date = shift.date;
    const id = shift.id;
    
    if (!date) {
      throw new Error("Missing date in shift data");
    }
    
    if (!id) {
      throw new Error("Missing ID in shift data");
    }
    
    console.log(`Updating shift with path: schedules/${date}/shifts/${id}`);
    
    // Create a clean object with only the fields we want to update
    const shiftDataForFirebase = {
      name: shift.name,
      startTimeISO: shift.startTimeISO,
      endTimeISO: shift.endTimeISO,
      startTimeFormatted: shift.startTimeFormatted,
      endTimeFormatted: shift.endTimeFormatted,
      role: shift.role,
      roleName: shift.roleName,
      status: shift.status,
      userId: shift.userId,
      vehicleId: shift.vehicleId,
      vehicleName: shift.vehicleName
    };
    
    // Pass the date and the ID
    const updatedShift = await updateFirebaseShift(date, id, shiftDataForFirebase);
    return updatedShift;
  } catch (error) {
    console.error("Failed to update shift:", error);
    throw error;
  }
}, []);

// Delete from Firebase
const deleteShiftFromFirebase = useCallback(async (shift) => {
  try {
    // Extract the required data from the shift object
    const date = shift.date;
    const id = shift.id;
    
    if (!date) {
      throw new Error("Missing date in shift data");
    }
    
    if (!id) {
      throw new Error("Missing ID in shift data");
    }
    
    console.log(`Deleting shift with path: schedules/${date}/shifts/${id}`);
    
    await deleteFirebaseShift(date, id);
    return true;
  } catch (error) {
    console.error("Failed to delete shift:", error);
    throw error;
  }
}, []);

  // Load users from Firebase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log('Loading users from Firebase...');
        const fetchedUsers = await fetchUsers();
        console.log('Fetched users:', fetchedUsers);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    
    loadUsers();
  }, []);

  // Load roles from Firebase
  useEffect(() => {
    const loadRoles = async () => {
      try {
        console.log('Loading roles from Firebase...');
        const fetchedRoles = await fetchRoles();
        console.log('Fetched roles:', fetchedRoles);
        if (fetchedRoles.length > 0) {
          const formattedRoles = fetchedRoles.map(role => ({
            id: role.id,
            content: role.name
          }));
          console.log('Formatted roles:', formattedRoles);
          setRoles(formattedRoles);
          
          // Update any existing shifts with the correct role names
          setShifts(prevShifts => {
            return prevShifts.map(shift => {
              // Find the role for this shift
              const role = formattedRoles.find(r => r.id === shift.role);
              if (role) {
                // Update the shift with the correct role name
                return {
                  ...shift,
                  roleName: role.content
                };
              }
              return shift;
            });
          });
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    
    loadRoles();
  }, []);
  
  // Load vehicles from Firebase
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        console.log('Loading vehicles from Firebase...');
        const fetchedVehicles = await fetchVehicles();
        console.log('Fetched vehicles:', fetchedVehicles);
        if (fetchedVehicles.length > 0) {
          setVehicles(fetchedVehicles);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };
    
    loadVehicles();
  }, []);
  
  // Check vehicle availability when shift times change
  useEffect(() => {
    const checkAvailability = async () => {
      // Only check if we have a vehicle selected and valid times
      if (
        editShiftData.vehicleId && 
        editShiftData.startTime && 
        editShiftData.endTime
      ) {
        const vehicleId = editShiftData.vehicleId;
        const startDate = editShiftData.startTime.toISOString().split('T')[0]; // get date portion
        const endDate = editShiftData.endTime.toISOString().split('T')[0]; // get date portion
        const shiftId = editShiftData.id; // pass shift ID to avoid conflict with the current shift
  
        try {
          console.log(`Checking availability for vehicle ${vehicleId} from ${startDate} to ${endDate}`);
          
          const result = await checkVehicleAvailability(vehicleId, startDate, endDate, shiftId); // pass shiftId to avoid conflict
          
          setVehicleAvailability(prev => ({
            ...prev,
            [vehicleId]: result
          }));
  
          if (!result.available) {
            setVehicleError(`Vehicle is not available during this time. It has ${result.conflictingShifts.length} conflicting shift(s).`);
          } else {
            setVehicleError('');
          }
        } catch (error) {
          console.error('Error checking vehicle availability:', error);
          setVehicleError('Error checking vehicle availability. Please try again.');
        }
      }
    };
  
    checkAvailability();
  }, [
    editShiftData.vehicleId, 
    editShiftData.startTime, 
    editShiftData.endTime,
    editShiftData.id // Ensure the shift ID triggers when it changes
  ]);
  
  
  // ========== Shift Management Functions ==========
  
  // Create a shift object with proper format - Firebase will generate the ID
  const createShiftObject = ({
    name, 
    startTime, 
    endTime, 
    role, 
    userId = null,
    vehicleId = null,
    vehicleName = null,
  }) => {
    // Ensure we have proper Date objects
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    
    const timeDisplay = `${formatTimeDisplay(start)}-${formatTimeDisplay(end)}`;
    const status = isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED;
    const dateISO = formatDate(currentDate, DATE_FORMATS.ISO);
    
    // Get role name - roles should be loaded at this point
    const roleName = getRoleNameById(role);
    
    return {
      // Don't set an id field - Firebase will generate this
      group: role,
      content: `${name} | ${timeDisplay}`,
      start: start.toISOString(), // Ensure ISO string format
      end: end.toISOString(), // Ensure ISO string format
      className: status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
      name,
      status,
      userId,
      
      // For Firestore
      role,
      date: dateISO,
      startTimeISO: start.toISOString(),
      endTimeISO: end.toISOString(),
      startTimeFormatted: formatTimeDisplay(start),
      endTimeFormatted: formatTimeDisplay(end),
      roleName: roleName,
      vehicleId,
      vehicleName,
      
      // Timestamps will be added in Firebase service
    };
  };

  
// Initialize shifts with consistent date format after component mounts
useEffect(() => {

  console.log("USE EFFECT CALLED");
  let lastFetchTime = 0;
  
  const loadShifts = async () => {
    if (roles.length === 0) return; // Wait until roles are loaded

    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      return;
    }
    lastFetchTime = now;

    try {
      const dateISO = formatDate(currentDate, DATE_FORMATS.ISO);
      console.log(`Fetching shifts for date: ${dateISO}`);
      
      const firebaseShifts = await fetchShiftsFromFirebase();
      
      if (firebaseShifts.length > 0) {
        console.log('Loaded shifts from Firebase:', firebaseShifts);
        
        // Format the shifts for the timeline
        const formattedShifts = firebaseShifts.map(shift => {
          console.log('📊 Processing shift from Firebase:', {
            id: shift.id,
            startTimeISO: shift.startTimeISO,
            endTimeISO: shift.endTimeISO,
            startTimeISOType: typeof shift.startTimeISO,
            endTimeISOType: typeof shift.endTimeISO
          });
          
          // Check if the role exists
          const roleExists = roles.some(r => r.id === shift.role);
          if (!roleExists) {
            console.warn(`Shift ${shift.id} references invalid role ${shift.role}, skipping, existing roles:`, roles.map(r => r.id));
            return null;
          }
          
          try {
            // Convert Firestore Timestamp to Date if needed
            let startDate, endDate;
            
            if (shift.startTimeISO && typeof shift.startTimeISO === 'object' && 'seconds' in shift.startTimeISO) {
              // This is a Firestore Timestamp
              startDate = new Date(shift.startTimeISO.seconds * 1000);
            } else {
              startDate = new Date(shift.startTimeISO);
            }
            
            if (shift.endTimeISO && typeof shift.endTimeISO === 'object' && 'seconds' in shift.endTimeISO) {
              // This is a Firestore Timestamp
              endDate = new Date(shift.endTimeISO.seconds * 1000);
            } else {
              endDate = new Date(shift.endTimeISO);
            }
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.error('Invalid dates in shift:', shift);
              return null;
            }
            
            // Create a timeline item using Firebase's document ID as the primary ID
            const formattedShift = {
              ...shift,
              // Essential timeline properties
              id: shift.id, // This is the Firebase document ID
              group: shift.role, // Map role to group for vis-timeline
              content: `${shift.name} | ${shift.startTimeFormatted}-${shift.endTimeFormatted}`,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              className: shift.status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
              
              // Make sure we always have a date
              date: shift.date || dateISO,
            };
            
            console.log('✅ Formatted shift:', {
              id: formattedShift.id,
              start: formattedShift.start,
              end: formattedShift.end,
              startType: typeof formattedShift.start,
              endType: typeof formattedShift.end
            });
            
            return formattedShift;
          } catch (err) {
            console.error(`Error formatting shift ${shift.id}:`, err);
            return null;
          }
        }).filter(shift => shift !== null); // Filter out null entries
        
        // Debug the formatted shifts
        console.log('Formatted shifts with IDs:', formattedShifts.map(s => ({ 
          id: s.id,
          content: s.content
        })));
        
        setShifts(formattedShifts);
      } else {
        console.log('No shifts found in Firebase');
        setShifts([]);
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
      setShifts([]);
    }
  };
  
  if (roles.length > 0) {
    loadShifts();
  }
 
}, [fetchShiftsFromFirebase, roles, currentDate]);
  
// Timeline options with fixed window
  const [options] = useState({
    min: new Date(new Date(currentDate).setHours(5, 0, 0, 0)),  // scrollable lower bound
    max: new Date(new Date(currentDate).setHours(24, 0, 0, 0)), // scrollable upper bound
    //start: new Date(new Date(currentDate).setHours(8, 0, 0, 0)), // initial view start
    //end: new Date(new Date(currentDate).setHours(17, 0, 0, 0)),  // initial view end
    editable: true,
    selectable: true,
    margin: {
      item: {
        horizontal: 0,
      }
    },
    // Set showMajorLabels to false to hide the date headers
    showMajorLabels: false,
    showMinorLabels: true,
    orientation: 'top',
    timeAxis: { scale: 'hour', step: 1 },
    zoomable: false,
    // Add custom format for the time labels to ensure they just show hours
    format: {
      minorLabels: {
        hour: 'ha', // Format hour labels as "8am", "9am", etc.
        minute: 'h:mma'
      }
    },
    // Set row heights to match current filled row height
    groupHeightMode: 'fixed',
    // groupHeight: 180
  });

  // ========== Event Handlers ==========
  
  // Function to handle shift pickup (modified from handleShiftEdit)
  const handleShiftPickup = (itemId) => {
    console.log('Opening pickup dialog for shift:', itemId);
    
    if (!user) {
      alert('You must be logged in to pick up shifts.');
      return;
    }
    
    if (timelineRef.current && itemsDatasetRef.current) {
      try {
        // First check if we can find the item in the vis-timeline dataset
        const datasetItem = itemsDatasetRef.current.get(itemId);
        
        if (!datasetItem) {
          console.error('Shift not found in timeline dataset:', itemId);
          return;
        }
        
        console.log('Shift data found in dataset:', datasetItem);
        
        // Try to find the shift in our state array
        let fullShiftData = shifts.find(s => s.id === itemId);
        
        // If not found by direct ID match, try looking at our shift data more carefully
        if (!fullShiftData) {
          console.log("Direct ID match not found, checking all shifts...");
          console.log("All shift IDs:", shifts.map(s => s.id));
          
          // Create a minimal version based on the timeline item data
          fullShiftData = {
            id: itemId,
            date: formatDate(currentDate, DATE_FORMATS.ISO),
            ...datasetItem
          };
          
          console.log("Using dataset item as fallback:", fullShiftData);
        }
        
        // Only allow pickup of available shifts
        if (fullShiftData.status !== SHIFT_STATUS.AVAILABLE) {
          alert('This shift is not available for pickup.');
          return;
        }
        
        // Convert string timestamps to Date objects
        const startTime = new Date(datasetItem.start);
        const endTime = new Date(datasetItem.end);
        
        // Try to extract the name from the content field
        let name = SHIFT_STATUS.AVAILABLE;
        if (datasetItem.content && typeof datasetItem.content === 'string') {
          const contentParts = datasetItem.content.split('|');
          name = contentParts[0]?.trim() || SHIFT_STATUS.AVAILABLE;
        }
        
        // Use the roleName from the full shift data
        const roleName = fullShiftData.roleName || getRoleNameById(datasetItem.group);
        
        // Find current user in users array
        const currentUser = users.find(u => u.id === user.uid);
        const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'Current User';
        
        console.log('Setting edit shift data with:', {
          id: itemId,
          name: userName,
          role: datasetItem.group,
          roleName,
          startTime,
          endTime,
          userId: user.uid
        });
        
        // Set edit shift data using the timeline item data
        setEditShiftData({
          id: itemId,
          name: userName,
          startTime: startTime,
          endTime: endTime,
          role: datasetItem.group,
          roleName: roleName,
          formattedStartTime: formatTimeInput(startTime),
          formattedEndTime: formatTimeInput(endTime),
          status: SHIFT_STATUS.AVAILABLE,
          userId: user.uid, // Set to current user
          date: fullShiftData.date || formatDate(currentDate, DATE_FORMATS.ISO),
          createdAt: fullShiftData.createdAt || new Date(),
          updatedAt: fullShiftData.updatedAt || new Date(),
          vehicleId: fullShiftData.vehicleId || null,
          vehicleName: fullShiftData.vehicleName || null,
        });
        
        // Open the edit dialog
        setEditDialogOpen(true);
      } catch (error) {
        console.error('Error accessing timeline dataset:', error);
      }
    } else {
      console.log('Timeline or dataset refs not available yet');
    }
  };
  
  // Function to handle ANY click on the timeline
  const handleTimelineClick = (clickEvent) => {
    console.log('Timeline clicked:', clickEvent);
    
    // If an item was clicked, handle the shift pickup
    if (clickEvent.item) {
      console.log(`Shift clicked: ${clickEvent.item}`);
      handleShiftPickup(clickEvent.item);
    }
  };

  // Function to update a shift from edit dialog data (modified to only allow pickup)
  const updateShiftFromDialog = async () => {
    try {
      if (vehicleError) {
        alert('Please fix vehicle errors before saving');
        return;
      }

      const shiftId = editShiftData.id;
      const date = editShiftData.date;
      
      console.log(`[updateShiftFromDialog] Updating shift ${shiftId} for date ${date}`);
      
      // Get the original shift to check for vehicle changes
      const originalShift = shifts.find(s => s.id === shiftId);
      if (!originalShift) {
        console.error(`[updateShiftFromDialog] Original shift ${shiftId} not found`);
        throw new Error(`Original shift ${shiftId} not found`);
      }
      
      // Only allow pickup of available shifts
      if (originalShift.status !== SHIFT_STATUS.AVAILABLE) {
        alert('This shift is not available for pickup.');
        return;
      }
      
      // Prepare shift data for Firebase - ensure all fields are properly formatted
      const shiftDataForFirebase = {
        id: shiftId,
        date: date,
        name: editShiftData.name,
        startTimeISO: editShiftData.startTimeISO || new Date(editShiftData.startTime).toISOString(),
        endTimeISO: editShiftData.endTimeISO || new Date(editShiftData.endTime).toISOString(),
        startTimeFormatted: formatTimeDisplay(editShiftData.startTime),
        endTimeFormatted: formatTimeDisplay(editShiftData.endTime),
        role: editShiftData.role,
        roleName: editShiftData.roleName,
        status: SHIFT_STATUS.ASSIGNED, // Always set to ASSIGNED when picked up
        userId: user.uid, // Always use current user
        vehicleId: editShiftData.vehicleId || null,
        vehicleName: editShiftData.vehicleName || null
        // Don't include updatedAt - let Firestore handle this
      };
      
      console.log(`[updateShiftFromDialog] Updating shift with data:`, shiftDataForFirebase);
      
      // Update the shift in Firebase
      await updateShiftInFirebase(shiftDataForFirebase);
      console.log(`[updateShiftFromDialog] Shift updated in Firebase`);
      
      // Always update vehicle assignment to ensure it's handled correctly
      console.log(`[updateShiftFromDialog] Updating vehicle assignment`);
      // Pass the date to updateShiftWithVehicle to help it find the shift
      await updateShiftWithVehicle(shiftId, editShiftData.vehicleId || null, editShiftData.vehicleName || null, date);
      console.log(`[updateShiftFromDialog] Vehicle assignment updated`);
      
      // Update local state with the new shift data
      const updatedShift = {
        ...originalShift,
        ...shiftDataForFirebase,
        className: 'shift-item', // Remove the 'available-shift' class
        content: `${editShiftData.name} | ${formatTimeDisplay(editShiftData.startTime)}-${formatTimeDisplay(editShiftData.endTime)}`,
        vehicleId: editShiftData.vehicleId || null,
        vehicleName: editShiftData.vehicleName || null
      };
      
      // Update the shifts array with the new shift data
      setShifts(prevShifts => 
        prevShifts.map(shift => 
          shift.id === shiftId ? updatedShift : shift
        )
      );
      
      // Update the timeline items dataset directly if available
      if (itemsDatasetRef.current) {
        console.log(`[updateShiftFromDialog] Updating timeline items dataset`);
        itemsDatasetRef.current.update(updatedShift);
      }
      
      console.log(`[updateShiftFromDialog] Local state updated`);
      setEditDialogOpen(false);
      console.log(`[updateShiftFromDialog] Edit dialog closed`);
    } catch (error) {
      console.error(`[updateShiftFromDialog] Error updating shift:`, error);
      alert('Failed to update shift. Please try again.');
    }
  };
  
  // Handle shift updates (when moved or resized) - disable this functionality
  const handleTimeChange = async (event) => {
    // Disable this functionality - users can't modify shift times
    console.log('Shift time change disabled for regular users');
  };

  // ========== Form Input Handlers ==========
  
  // Handle user selection in edit dialog
  const handleEditUserSelect = (e) => {
    const userId = e.target.value || null;
    const selectedUser = users.find(u => u.id === userId);
    
    setEditShiftData(prev => ({
      ...prev,
      userId: userId,
      name: userId 
        ? `${selectedUser?.firstName} ${selectedUser?.lastName}`.trim()
        : SHIFT_STATUS.AVAILABLE,
      status: userId ? SHIFT_STATUS.ASSIGNED : SHIFT_STATUS.AVAILABLE
    }));
  };

  // Get timeline reference after it's mounted
  const getTimelineRef = (ref, itemsDataset, groupsDataset) => {
    timelineRef.current = ref;
    itemsDatasetRef.current = itemsDataset;
    rolesDatasetRef.current = groupsDataset;
    
    // Add click event listener to the timeline
    if (ref) {
      console.log('Registering timeline click handler');
      
      // Remove any existing handlers first to avoid duplicates
      ref.off('click');
      ref.off('doubleClick');
      
      // Register our custom click handler for all clicks
      ref.on('click', handleTimelineClick);
      
      // Also register a double-click handler as backup
      ref.on('doubleClick', (event) => {
        console.log('Double click event received:', event);
        if (event.item) {
          handleShiftPickup(event.item);
        }
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">

      <div className="flex justify-between items-center mb-2">
        <Button onClick={() => setCurrentDate(prev => new Date(prev.getTime() - 86400000))}>
          ← Previous Day
        </Button>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !currentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
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
        </div>
        <Button onClick={() => setCurrentDate(prev => new Date(prev.getTime() + 86400000))}>
          Next Day →
        </Button>
      </div>
      
      {roles.length > 0 && roles[0].id !== 'default' ? (
        <div className="border rounded-lg overflow-hidden h-[80vh]">
          <GanttTimeline
            items={shifts}
            groups={roles}
            options={{
              ...options,
              editable: false, // Disable editing (dragging/resizing)
              selectable: true,
            }}
            className="h-full"
            onTimeChange={handleTimeChange}
            getTimelineRef={(ref, itemsDs, groupsDs) => getTimelineRef(ref, itemsDs, groupsDs)}
          />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden h-[80vh] flex items-center justify-center">
          <p className="text-lg">Loading roles...</p>
        </div>
      )}
      
      {/* Pickup Shift Dialog (modified from Edit Shift Dialog) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pick Up Shift</DialogTitle>
            <DialogDescription>
              {(() => {
                console.log('🎯 Pickup dialog shift data:', editShiftData);
                if (!editShiftData.id) {
                  console.log('❌ No valid shift data yet');
                  return 'Loading shift details...';
                }
                return editShiftData.roleName && editShiftData.startTime && editShiftData.endTime
                  ? `Pick up shift for ${getRoleDisplayName(editShiftData)} at ${formatTimeForTitle(editShiftData.startTime)} to ${formatTimeForTitle(editShiftData.endTime)}`
                  : 'Pick up shift';
              })()}
            </DialogDescription>
          </DialogHeader>
          
          {editShiftData.id ? (
            <div className="grid gap-4 py-4">
              {/* Display user information (read-only) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Assigning To
                </Label>
                <div className="col-span-3 p-2 border rounded bg-gray-50">
                  {editShiftData.name}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editVehicle" className="text-right">
                  Assign Vehicle
                </Label>
                <div className="col-span-3">
                  <select 
                    id="editVehicle"
                    value={editShiftData.vehicleId || ''} 
                    onChange={(e) => {
                      const vehicle = vehicles.find(v => v.id === e.target.value);
                      setEditShiftData(prev => ({
                        ...prev,
                        vehicleId: e.target.value,
                        vehicleName: vehicle ? vehicle.name : ''
                      }));
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles
                      .filter(vehicle => vehicle.status === 'Available')
                      .map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </option>
                    ))}
                    </select>
                    {vehicleError && <div className="text-red-500 text-sm mt-1">{vehicleError}</div>}
                </div>
              </div>
              
              {/* Display shift time information (read-only) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Start Time
                </Label>
                <div className="col-span-3 p-2 border rounded bg-gray-50">
                  {editShiftData.formattedStartTime}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  End Time
                </Label>
                <div className="col-span-3 p-2 border rounded bg-gray-50">
                  {editShiftData.formattedEndTime}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">Loading shift details...</div>
          )}
          
          <DialogFooter className="flex justify-end">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateShiftFromDialog}>Pick Up Shift</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        .shift-item {
          color: #fafafa;
          border-width: 1px;
          border-style: solid;
          box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          background-color: #18181b;
          border-color: #18181b;
          border-radius: calc(var(--radius) - 2px) !important;
          padding: 4px 8px;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .available-shift {
          background-color: #15803d; /* Green background */
          border-color: #166534; /* Darker green border */
          color: white;
          cursor: pointer; /* Add pointer cursor to indicate clickable */
        }
        .vis-item.vis-selected {
          border-color:rgb(49, 62, 147);
          box-shadow: 0 0 5px rgb(49, 62, 147);
          background-color: rgb(49, 62, 147);
        }
        .vis-label {
          font-weight: bold;
          padding: 4px;
        }
        .vis-timeline {
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }
        .vis-grid.vis-minor {
          border-color: #f0f0f0;
        }
        .vis-grid.vis-major {
          border-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}