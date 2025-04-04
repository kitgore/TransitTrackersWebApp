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
import { Label } from '@/components/ui/label';
import { 
  fetchShiftsByDate, 
  createShift as createFirebaseShift, 
  updateShift as updateFirebaseShift, 
  deleteShift as deleteFirebaseShift,
  fetchUsers,
  fetchRoles
} from '@/src/firebase/shiftService';

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
  // Reference to timeline for event handling
  const timelineRef = useRef(null);
  
  // Reference to the timeline's internal datasets
  const itemsDatasetRef = useRef(null);
  const rolesDatasetRef = useRef(null);
  
  // Get today's date for creating the sample data
  const todayRef = useRef(new Date());
const today = todayRef.current;
  
  // Track click information
  const lastClickRef = useRef({
    time: 0,
    item: null
  });
  
  // State for dialog control
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newShiftData, setNewShiftData] = useState({
    id: '',
    name: SHIFT_STATUS.AVAILABLE,
    startTime: null,
    endTime: null,
    role: '',
    roleName: '',
    formattedStartTime: '',
    formattedEndTime: '',
    status: SHIFT_STATUS.AVAILABLE,
    userId: null,
  });
  
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
  });

  // State for roles and users
  const [roles, setRoles] = useState([
      { id: 'default', content: 'Loading Roles...' }
  ]);
  
  // State for users
  const [users, setUsers] = useState([]);

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
    const date = new Date(today);
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

  // ========== Firebase Integration Functions ==========
  
  // Fetch shifts from Firebase
  const fetchShiftsFromFirebase = useCallback(async () => {
    const dateISO = formatDate(today, DATE_FORMATS.ISO);
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
  }, [today]);

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
    
    // Remove properties that could cause issues with Firestore
    const shiftDataForFirebase = { ...shift };
    
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
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    
    loadRoles();
  }, []);
  
  // ========== Shift Management Functions ==========
  
  // Create a shift object with proper format - Firebase will generate the ID
  const createShiftObject = ({
    name, 
    startTime, 
    endTime, 
    role, 
    userId = null,
  }) => {
    // Ensure we have proper Date objects
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    
    const timeDisplay = `${formatTimeDisplay(start)}-${formatTimeDisplay(end)}`;
    const status = isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED;
    const dateISO = formatDate(today, DATE_FORMATS.ISO);
    
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
      roleName: getRoleNameById(role),
      
      // Timestamps will be added in Firebase service
    };
  };
  
// Initialize shifts with consistent date format after component mounts
useEffect(() => {
  let lastFetchTime = 0;
  
  const loadShifts = async () => {
    if (roles.length === 0) return; // Wait until roles are loaded

    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      return;
    }
    lastFetchTime = now;
    
    try {
      const dateISO = formatDate(today, DATE_FORMATS.ISO);
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
}, [fetchShiftsFromFirebase, roles, today]);
  // Timeline options with fixed window
  const [options] = useState({
    min: new Date(new Date(today).setHours(8, 0, 0, 0)),
    max: new Date(new Date(today).setHours(18, 0, 0, 0)),
    editable: true,
    selectable: true,
    margin: {
      item: {
        horizontal: 10
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
    }
  });

  // ========== Event Handlers ==========
  
  // Function to prepare dialog when clicking on the background
  const handleBackgroundClick = (clickEvent) => {
    if (clickEvent.what === 'background' && clickEvent.group && clickEvent.time) {
      console.log('Background clicked:', clickEvent);
      
      // Get the clicked time and group
      const clickedTime = new Date(clickEvent.time);
      const role = clickEvent.group;
      
      // Round time to the nearest half hour for better UX
      const minutes = clickedTime.getMinutes();
      clickedTime.setMinutes(minutes < 30 ? 0 : 30);
      clickedTime.setSeconds(0);
      clickedTime.setMilliseconds(0);
      
      // Calculate end time (start time + 3 hours)
      const endTime = new Date(clickedTime.getTime() + 3 * 60 * 60 * 1000);
      
      // Get role name for display
      const roleName = getRoleNameById(role);
      
      // Set new shift data for the dialog
      setNewShiftData({
        id: `shift${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: SHIFT_STATUS.AVAILABLE,
        startTime: clickedTime,
        endTime: endTime,
        role: role,
        roleName: roleName,
        formattedStartTime: formatTimeInput(clickedTime),
        formattedEndTime: formatTimeInput(endTime),
        status: SHIFT_STATUS.AVAILABLE,
        userId: null
      });
      
      // Open the dialog
      setCreateDialogOpen(true);
    }
  };
  
  // Function to handle ANY click on the timeline
  const handleTimelineClick = (clickEvent) => {
    const now = Date.now();
    console.log('Timeline clicked:', clickEvent);
    
    // Log the item ID if it's a shift click
    if (clickEvent.item) {
      console.log(`Shift clicked: ${clickEvent.item}, time: ${now}, last click time: ${lastClickRef.current.time}`);
      
      // Check if this is a double click (same item, within 500ms)
      if (clickEvent.item === lastClickRef.current.item && 
          now - lastClickRef.current.time < 500) {
        console.log(`DOUBLE CLICK DETECTED on item: ${clickEvent.item}`);
        handleShiftEdit(clickEvent.item);
      }
      
      // Update the last click info
      lastClickRef.current = {
        time: now,
        item: clickEvent.item
      };
    } else if (clickEvent.what === 'background') {
      // If it's a background click, handle it normally
      handleBackgroundClick(clickEvent);
    }
  };

// Function to handle shift editing
const handleShiftEdit = (itemId) => {
  console.log('Opening edit dialog for shift:', itemId);
  
  if (timelineRef.current && itemsDatasetRef.current) {
    try {
      // First check if we can find the item in the vis-timeline dataset
      const datasetItem = itemsDatasetRef.current.get(itemId);
      
      if (!datasetItem) {
        console.error('Shift not found in timeline dataset:', itemId);
        return;
      }
      
      console.log('Shift data found in dataset:', datasetItem);
      
      // Try to find the shift in our state array - this should match
      // as we're now using Firebase IDs consistently
      let fullShiftData = shifts.find(s => s.id === itemId);
      
      // If not found by direct ID match, try looking at our shift data more carefully
      if (!fullShiftData) {
        console.log("Direct ID match not found, checking all shifts...");
        console.log("All shift IDs:", shifts.map(s => s.id));
        
        // Create a minimal version based on the timeline item data
        fullShiftData = {
          id: itemId,
          date: formatDate(today, DATE_FORMATS.ISO),
          ...datasetItem
        };
        
        console.log("Using dataset item as fallback:", fullShiftData);
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
      
      console.log('Setting edit shift data with:', {
        id: itemId,
        name,
        role: datasetItem.group,
        roleName,
        startTime,
        endTime
      });
      
      // Set edit shift data using the timeline item data
      setEditShiftData({
        id: itemId,
        name: name,
        startTime: startTime,
        endTime: endTime,
        role: datasetItem.group,
        roleName: roleName, // Use the roleName from fullShiftData
        formattedStartTime: formatTimeInput(startTime),
        formattedEndTime: formatTimeInput(endTime),
        status: isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED,
        userId: fullShiftData.userId || null,
        date: fullShiftData.date || formatDate(today, DATE_FORMATS.ISO),
        createdAt: fullShiftData.createdAt || new Date(),
        updatedAt: fullShiftData.updatedAt || new Date()
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
  
  // Function to add a shift from dialog data
  const addShiftFromDialog = async () => {
    try {
      // Create a new shift object
      const newShift = createShiftObject({
        name: newShiftData.name,
        startTime: newShiftData.startTime,
        endTime: newShiftData.endTime,
        role: newShiftData.role,
        userId: newShiftData.userId
      });
      
      console.log('Adding new shift from dialog:', newShift);
      
      // Save to Firebase and get back the Firebase-generated ID
      const savedShift = await saveShiftToFirebase(newShift);
      
      console.log('Shift saved to Firebase with ID:', savedShift.id);
      
      // Then update the local state with the saved shift
      setShifts(prevShifts => [...prevShifts, {
        ...savedShift,
        // These are the critical properties for the timeline
        id: savedShift.id, // Use the Firebase-generated ID
        group: savedShift.role, 
        content: `${savedShift.name} | ${savedShift.startTimeFormatted}-${savedShift.endTimeFormatted}`,
        className: savedShift.status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
        start: savedShift.startTimeISO,
        end: savedShift.endTimeISO,
      }]);
      
      // Close the dialog
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to add shift:', error);
      // Could add error handling UI here
    }
  };
  
// Function to update a shift from edit dialog data
const updateShiftFromDialog = async () => {
  try {
    // Find the original shift using the id from editShiftData
    const originalShift = shifts.find(shift => shift.id === editShiftData.id);
    
    if (!originalShift) {
      console.error('Original shift not found for updating:', editShiftData.id);
      console.log('Available shifts:', shifts.map(s => ({ id: s.id })));
      return;
    }
    
    // Create updated shift object
    const updatedShift = {
      ...originalShift,
      name: editShiftData.name,
      role: editShiftData.role,
      userId: editShiftData.userId,
      status: isShiftAvailable(editShiftData.name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED,
      
      // Timeline specific fields
      start: formatDateForTimeline(editShiftData.startTime),
      end: formatDateForTimeline(editShiftData.endTime),
      group: editShiftData.role,
      
      // For Firestore
      startTimeISO: formatDateForTimeline(editShiftData.startTime),
      endTimeISO: formatDateForTimeline(editShiftData.endTime),
      startTimeFormatted: formatTimeDisplay(editShiftData.startTime),
      endTimeFormatted: formatTimeDisplay(editShiftData.endTime),
      roleName: getRoleNameById(editShiftData.role),
      
      // Don't update createdAt but keep the original value
      createdAt: originalShift.createdAt,
      
      // updatedAt will be set by the Firebase service
    };
    
    console.log('Updating shift:', {
      id: editShiftData.id,
      date: updatedShift.date
    });
    
    // FIXED: Pass the entire shift object
    const updatedFirebaseShift = await updateShiftInFirebase(updatedShift);
    
    // Then update the local state
    setShifts(prevShifts => {
      return prevShifts.map(shift => {
        if (shift.id === editShiftData.id) {
          // For the timeline, we need to update these properties as well
          return {
            ...updatedFirebaseShift,
            id: updatedFirebaseShift.id, // Keep the Firebase ID
            group: updatedFirebaseShift.role, // Ensure group is set for vis-timeline
            content: `${updatedFirebaseShift.name} | ${updatedFirebaseShift.startTimeFormatted}-${updatedFirebaseShift.endTimeFormatted}`,
            className: updatedFirebaseShift.status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
            start: updatedFirebaseShift.startTimeISO, // Ensure start is properly formatted
            end: updatedFirebaseShift.endTimeISO, // Ensure end is properly formatted
          };
        }
        return shift;
      });
    });
    
    // Close the dialog
    setEditDialogOpen(false);
  } catch (error) {
    console.error('Failed to update shift:', error);
    // Could add error handling UI here
  }
};
  
// Function to delete a shift
const deleteShift = async () => {
  try {
    // Make sure we have the date and ID
    if (!editShiftData.date) {
      console.error('Missing date in shift data for deletion');
      return;
    }
    
    if (!editShiftData.id) {
      console.error('Missing ID in shift data for deletion');
      return;
    }
    
    // Pass the entire shift object instead of separate arguments
    await deleteShiftFromFirebase(editShiftData);
    
    // Then update local state
    setShifts(prevShifts => prevShifts.filter(shift => shift.id !== editShiftData.id));
    
    // Close the dialog
    setEditDialogOpen(false);
  } catch (error) {
    console.error('Failed to delete shift:', error);
  }
};
  
// Handle shift updates (when moved or resized)
const handleTimeChange = async (event) => {
  console.log('Shift updated:', event);
  
  if (!event || !event.id) return;
  
  try {
    // Find the shift that was changed - should use the Firebase document ID
    const originalShift = shifts.find(shift => shift.id === event.id);
    
    if (!originalShift) {
      console.log('Original shift not found for update:', event.id);
      console.log('Available shifts:', shifts.map(s => s.id));
      return;
    }
    
    // Make sure we have the date
    if (!originalShift.date) {
      console.error('Missing date in shift data');
      return;
    }
    
    // Make sure we're using the correct date format for display
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;
    const status = originalShift.status || (isShiftAvailable(originalShift.name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED);
    
    console.log(`Updating shift ${originalShift.id} with new time: ${timeDisplay}`);
    
    // Create an updated shift object
    const updatedShift = {
      ...originalShift,
      start: event.start,
      end: event.end,
      role: event.group || originalShift.role, // Update role from group
      group: event.group || originalShift.group, // Update group for vis-timeline
      content: `${originalShift.name} | ${timeDisplay}`,
      className: status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
      
      // For Firestore
      startTimeISO: event.start,
      endTimeISO: event.end,
      startTimeFormatted: formatTimeDisplay(startTime),
      endTimeFormatted: formatTimeDisplay(endTime),
      roleName: getRoleNameById(event.group || originalShift.group),
      
      // Don't update createdAt
      createdAt: originalShift.createdAt,
      
      // updatedAt will be set by the Firebase service
    };
    
    // Update Firebase - FIXED: Pass the entire shift object
    await updateShiftInFirebase(updatedShift);
    
    // Update local state
    setShifts(prevShifts => {
      return prevShifts.map(shift => {
        if (shift.id === event.id) {
          return updatedShift;
        }
        return shift;
      });
    });
  } catch (error) {
    console.error('Failed to update shift time:', error);
    // Could reset the timeline item to its original position
  }
};

  // ========== Form Input Handlers ==========
  
  // Handle changes to shift name input for new shift
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setNewShiftData(prev => ({
      ...prev,
      name: newName,
      status: isShiftAvailable(newName) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED
    }));
  };

  // Handle changes to start time input for new shift
  const handleStartTimeChange = (e) => {
    const newStartTime = parseTimeInput(e.target.value, newShiftData.startTime);
    
    // If start time is after end time, adjust end time to maintain at least 30 min duration
    let newEndTime = newShiftData.endTime;
    if (newStartTime >= newShiftData.endTime) {
      newEndTime = new Date(newStartTime.getTime() + 30 * 60 * 1000);
    }
    
    setNewShiftData(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: newEndTime,
      formattedStartTime: formatTimeInput(newStartTime),
      formattedEndTime: formatTimeInput(newEndTime)
    }));
  };

  // Handle changes to end time input for new shift
  const handleEndTimeChange = (e) => {
    const newEndTime = parseTimeInput(e.target.value, newShiftData.endTime);
    
    // If end time is before start time, don't update
    if (newEndTime <= newShiftData.startTime) {
      return;
    }
    
    setNewShiftData(prev => ({
      ...prev,
      endTime: newEndTime,
      formattedEndTime: formatTimeInput(newEndTime)
    }));
  };
  
  // Handle changes to shift name input for edit shift
  const handleEditNameChange = (e) => {
    const newName = e.target.value;
    setEditShiftData(prev => ({
      ...prev,
      name: newName,
      status: isShiftAvailable(newName) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED
    }));
  };

  // Handle changes to start time input for edit shift
  const handleEditStartTimeChange = (e) => {
    const newStartTime = parseTimeInput(e.target.value, editShiftData.startTime);
    
    // If start time is after end time, adjust end time to maintain at least 30 min duration
    let newEndTime = editShiftData.endTime;
    if (newStartTime >= editShiftData.endTime) {
      newEndTime = new Date(newStartTime.getTime() + 30 * 60 * 1000);
    }
    
    setEditShiftData(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: newEndTime,
      formattedStartTime: formatTimeInput(newStartTime),
      formattedEndTime: formatTimeInput(newEndTime)
    }));
  };

  // Handle changes to end time input for edit shift
  const handleEditEndTimeChange = (e) => {
    const newEndTime = parseTimeInput(e.target.value, editShiftData.endTime);
    
    // If end time is before start time, don't update
    if (newEndTime <= editShiftData.startTime) {
      return;
    }
    
    setEditShiftData(prev => ({
      ...prev,
      endTime: newEndTime,
      formattedEndTime: formatTimeInput(newEndTime)
    }));
  };

  // Handle user selection
  const handleUserSelect = (e) => {
    const userId = e.target.value || null;
    const selectedUser = users.find(u => u.id === userId);
    
    setNewShiftData(prev => ({
      ...prev,
      userId: userId,
      name: userId 
        ? `${selectedUser?.firstName} ${selectedUser?.lastName}`.trim()
        : SHIFT_STATUS.AVAILABLE,
      status: userId ? SHIFT_STATUS.ASSIGNED : SHIFT_STATUS.AVAILABLE
    }));
  };

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
          handleShiftEdit(event.item);
        }
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{formatDateHeader(today)}</h1>
      
      {roles.length > 0 && ( // Only render when roles are available
        <div className="border rounded-lg overflow-hidden">
          <GanttTimeline
            items={shifts}
            groups={roles}
            options={options}
            className="h-[600px]"
            onTimeChange={handleTimeChange}
            getTimelineRef={(ref, itemsDs, groupsDs) => getTimelineRef(ref, itemsDs, groupsDs)}
          />
        </div>
      )}
        
      <div className="mt-4 space-y-2">
        <p className="text-sm text-blue-500">
          Current shift count: {shifts.length}
        </p>
      </div>
      
      {/* Create Shift Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Shift</DialogTitle>
            <DialogDescription>
              Create a new shift for {newShiftData.roleName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                Assign To
              </Label>
              <select
                id="user"
                value={newShiftData.userId || ''}
                onChange={handleUserSelect}
                className="col-span-3 p-2 border rounded"
              >
                <option value="">Available</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={newShiftData.formattedStartTime}
                onChange={handleStartTimeChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={newShiftData.formattedEndTime}
                onChange={handleEndTimeChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addShiftFromDialog}>Add Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Shift Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              {(() => {
                console.log('🎯 Edit dialog shift data:', editShiftData);
                if (!editShiftData.id) {
                  console.log('❌ No valid shift data yet');
                  return 'Loading shift details...';
                }
                return editShiftData.roleName && editShiftData.startTime && editShiftData.endTime
                  ? `Update shift details for ${getRoleDisplayName(editShiftData)} at ${formatTimeForTitle(editShiftData.startTime)} to ${formatTimeForTitle(editShiftData.endTime)}`
                  : 'Update shift details';
              })()}
            </DialogDescription>
          </DialogHeader>
          
          {editShiftData.id ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editUser" className="text-right">
                  Assign To
                </Label>
                <select
                  id="editUser"
                  value={editShiftData.userId || ''}
                  onChange={handleEditUserSelect}
                  className="col-span-3 p-2 border rounded"
                >
                  <option value="">Available</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStartTime" className="text-right">
                  Start Time
                </Label>
                <Input
                  id="editStartTime"
                  type="time"
                  value={editShiftData.formattedStartTime}
                  onChange={handleEditStartTimeChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEndTime" className="text-right">
                  End Time
                </Label>
                <Input
                  id="editEndTime"
                  type="time"
                  value={editShiftData.formattedEndTime}
                  onChange={handleEditEndTimeChange}
                  className="col-span-3"
                />
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">Loading shift details...</div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={deleteShift}>
              Delete Shift
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateShiftFromDialog}>Save Changes</Button>
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