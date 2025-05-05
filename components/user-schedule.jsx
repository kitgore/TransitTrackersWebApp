'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GanttTimeline from '@/components/vis-timeline';
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchShiftsByDate, 
  updateShift as updateFirebaseShift,
  fetchUsers,
  fetchRoles,
  fetchVehicles,
  assignVehicleToShift,
  removeVehicleFromShift,
  updateShiftWithVehicle
} from '@/src/firebase/shiftService';
import { checkShiftConflict } from '@/src/firebase/conflictService';
import { useBaseSchedule, SHIFT_STATUS, DATE_FORMATS } from './base-schedule';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";

export default function ShiftScheduler() {
  // Get current user from AuthContext
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get base functionality from useBaseSchedule hook
  const {
    timelineRef,
    containerRef,
    itemsDatasetRef,
    rolesDatasetRef,
    currentDate,
    setCurrentDate,
    roles,
    setRoles,
    users,
    setUsers,
    shifts,
    setShifts,
    options,
    setOptions,
    getTimelineRef,
    formatDate,
    getRoleNameById,
    formatTimeInput,
    isShiftAvailable,
    formatDateHeader,
    formatTimeForTitle,
    getRoleDisplayName
  } = useBaseSchedule();

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

  // State for vehicles
  const [vehicles, setVehicles] = useState([]);
  
  // State for vehicle availability
  const [vehicleAvailability, setVehicleAvailability] = useState({});
  
  // State for vehicle selection error
  const [vehicleError, setVehicleError] = useState('');
  const [pickupError, setPickupError] = useState('');

  // Reference to track resize state
  const isResizingRef = useRef(false);
  
  // Add a ref to track the last loaded date
  const lastLoadedDateRef = useRef(null);

  // State for pickup dialog
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [pickupShiftData, setPickupShiftData] = useState({
    id: '',
    name: '',
    startTime: null,
    endTime: null,
    role: '',
    roleName: '',
    formattedStartTime: '',
    formattedEndTime: '',
    status: '',
    date: '',
    vehicleId: null,
    vehicleName: null,
  });

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
  }, [currentDate, formatDate]);

  // Update shift in Firebase
  const updateShiftInFirebase = useCallback(async (shift) => {
    const originalShift = shift; // Save the original in case you want to revert local state
  
    try {
      const { date, id } = shift;
  
      if (!date) {
        throw new Error("Missing date in shift data");
      }
  
      if (!id) {
        throw new Error("Missing ID in shift data");
      }
  
      console.log(`Updating shift with path: schedules/${date}/shifts/${id}`);
  
      // Remove properties that shouldn't go to Firestore (if needed)
      const shiftDataForFirebase = { ...shift };
  
      const result = await updateFirebaseShift(date, id, shiftDataForFirebase);
  
      if (!result.success) {
        // Optionally revert local UI if you are using optimistic updates
  
        // Show error toast
        toast({
          title: "Shift Conflict",
          description: result.message,
          variant: "destructive",
        });
  
        return null;
      }
  
      return result.shift;
  
    } catch (error) {
      console.error("Failed to update shift:", error);
  
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the shift.",
        variant: "destructive",
      });
  
      return null;
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
  
  // Remove the vehicle availability check effect and create a function instead
  const checkVehicleAvailability = useCallback(async (vehicleId, startTime, endTime, shiftId, date) => {
    if (!vehicleId || !startTime || !endTime || !date) return;

    try {
      console.log(`Checking availability for vehicle ${vehicleId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
      const conflicts = await checkShiftConflict({
        vehicleId,
        startTime: formatTimeInput(startTime),
        endTime: formatTimeInput(endTime),
        date,
        id: shiftId
      });

      setVehicleAvailability(prev => ({
        ...prev,
        [vehicleId]: { available: !conflicts, conflictingShifts: conflicts || [] }
      }));

      if (conflicts) {
        setVehicleError(`Vehicle is not available during this time. It has ${conflicts.length} conflicting shift(s).`);
      } else {
        setVehicleError('');
      }
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      setVehicleError('Error checking vehicle availability. Please try again.');
    }
  }, [formatTimeInput]);

  // Modify the vehicle selection handler in the edit dialog
  const handleVehicleSelect = useCallback((e) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    setEditShiftData(prev => ({
      ...prev,
      vehicleId: vehicleId,
      vehicleName: vehicle ? vehicle.name : ''
    }));
    
    // Check availability when vehicle changes
    if (vehicleId && editShiftData.startTime && editShiftData.endTime) {
      checkVehicleAvailability(
        vehicleId,
        editShiftData.startTime,
        editShiftData.endTime,
        editShiftData.id,
        editShiftData.date
      );
    }
    setVehicleError(''); // Clear error when vehicle is selected
  }, [vehicles, editShiftData, checkVehicleAvailability]);

  // Force timeline redraw after shifts are loaded
  useEffect(() => {
    console.log('=== Shifts Loaded Effect ===');
    console.log('Shifts length:', shifts.length);
    
    if (shifts.length > 0 && timelineRef.current) {
      // Check if items are already visible
      const hasVisibleItems = timelineRef.current.dom?.root?.querySelector('.vis-item');
      console.log('Timeline state:', {
        hasVisibleItems: !!hasVisibleItems,
        timelineExists: !!timelineRef.current
      });
      
      if (!hasVisibleItems) {
        console.log('No visible items, forcing redraw');
        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.redraw();
          }
        }, 100);
      } else {
        console.log('Items already visible, skipping redraw');
      }
    }
  }, [shifts]);

  // Initialize shifts with consistent date format after component mounts
  useEffect(() => {
    console.log("USE EFFECT CALLED - Loading shifts");
    console.log("Current state:", {
      roles: roles.length,
      currentDate: currentDate,
      timelineRef: !!timelineRef.current,
      itemsDatasetRef: !!itemsDatasetRef.current,
      currentUser: !!user
    });
    
    let lastFetchTime = 0;
    
    const loadShifts = async () => {
      // Wait until roles are loaded and not just the default role
      if (roles.length === 0 || (roles.length === 1 && roles[0].id === 'default')) {
        console.log('Waiting for roles to load...');
        return;
      }

      const now = Date.now();
      if (now - lastFetchTime < 5000) {
        return;
      }
      lastFetchTime = now;

      // Check if we've already loaded shifts for this date
      const currentDateISO = formatDate(currentDate, DATE_FORMATS.ISO);
      if (lastLoadedDateRef.current === currentDateISO) {
        return;
      }
      lastLoadedDateRef.current = currentDateISO;

      try {
        console.log(`Fetching shifts for date: ${currentDateISO}`);
        
        // Clear existing shifts from both state and timeline dataset
        setShifts([]);
        if (itemsDatasetRef.current) {
          itemsDatasetRef.current.clear();
        }
        
        const firebaseShifts = await fetchShiftsFromFirebase();
        
        if (firebaseShifts.length > 0) {
          console.log('Loaded shifts from Firebase:', firebaseShifts);
          
          // Format the shifts for the timeline
          const formattedShifts = firebaseShifts.map(shift => {
            console.log('Processing shift:', {
              id: shift.id,
              startTimeISO: shift.startTimeISO,
              endTimeISO: shift.endTimeISO,
              role: shift.role,
              status: shift.status
            });
            
            // Check if the role exists
            const roleExists = roles.some(r => r.id === shift.role);
            if (!roleExists) {
              console.warn(`Shift ${shift.id} references invalid role ${shift.role}`);
              return null;
            }
            
            try {
              // Convert Firestore Timestamp to Date if needed
              let startDate, endDate;
              
              if (shift.startTimeISO && typeof shift.startTimeISO === 'object' && 'seconds' in shift.startTimeISO) {
                startDate = new Date(shift.startTimeISO.seconds * 1000);
                console.log('Converted Firestore Timestamp to Date:', {
                  original: shift.startTimeISO,
                  converted: startDate
                });
              } else {
                startDate = new Date(shift.startTimeISO);
              }
              
              if (shift.endTimeISO && typeof shift.endTimeISO === 'object' && 'seconds' in shift.endTimeISO) {
                endDate = new Date(shift.endTimeISO.seconds * 1000);
              } else {
                endDate = new Date(shift.endTimeISO);
              }
              
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error('Invalid dates in shift:', {
                  shift,
                  startDate,
                  endDate
                });
                return null;
              }
              
              // Determine the shift class based on status and ownership
              let shiftClass = 'shift-item';
              if (shift.status === SHIFT_STATUS.AVAILABLE) {
                shiftClass += ' available-shift';
              } else if (shift.userId === user?.uid) {
                shiftClass += ' my-shift';
              }
              
              const formattedShift = {
                ...shift,
                id: shift.id,
                group: shift.role,
                content: `${shift.name} | ${shift.startTimeFormatted}-${shift.endTimeFormatted}`,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                className: shiftClass,
                date: shift.date || currentDateISO,
              };
              
              console.log('Formatted shift:', formattedShift);
              return formattedShift;
            } catch (err) {
              console.error(`Error formatting shift ${shift.id}:`, err);
              return null;
            }
          }).filter(shift => shift !== null);
          
          console.log('Setting formatted shifts:', formattedShifts);
          
          // Update the state first
          setShifts(formattedShifts);
          
          // Then update the timeline dataset if available
          if (itemsDatasetRef.current) {
            console.log('Updating timeline dataset with new shifts');
            // Clear the dataset first to ensure no old shifts remain
            itemsDatasetRef.current.clear();
            // Add the new shifts
            itemsDatasetRef.current.add(formattedShifts);
            
            if (timelineRef.current) {
              console.log('Forcing timeline redraw after dataset update');
              timelineRef.current.redraw();
            }
          }
        } else {
          console.log('No shifts found in Firebase');
          setShifts([]);
          if (itemsDatasetRef.current) {
            itemsDatasetRef.current.clear();
          }
        }
      } catch (error) {
        console.error('Error loading shifts:', error);
        setShifts([]);
        if (itemsDatasetRef.current) {
          itemsDatasetRef.current.clear();
        }
      }
    };
    
    loadShifts();
  }, [fetchShiftsFromFirebase, roles, currentDate, formatDate, user?.uid]);

  // Force timeline reinitialization when data is ready
  useEffect(() => {
    if (timelineRef.current) {
      console.log('=== Timeline Reinitialization Effect ===');
      console.log('Triggered by changes in:', {
        shiftsLength: shifts.length,
        rolesLength: roles.length,
        currentDate: currentDate.toISOString(),
        timelineExists: !!timelineRef.current
      });
      
      const initializeTimeline = () => {
        if (timelineRef.current && timelineRef.current.dom && timelineRef.current.dom.root) {
          console.log('Timeline DOM ready, initializing...');
          const container = timelineRef.current.dom.root;
          const height = container.clientHeight;
          const width = container.clientWidth;
          
          // Force container resize
          container.style.height = `${height}px`;
          container.style.width = `${width}px`;
          
          // Only redraw if necessary
          const needsRedraw = !timelineRef.current.dom.root.querySelector('.vis-item');
          if (needsRedraw) {
            console.log('Timeline needs redraw - no items found');
            timelineRef.current.redraw();
          } else {
            console.log('Timeline already has items, skipping redraw');
          }
        } else {
          console.log('Timeline DOM not ready, retrying in 100ms');
          setTimeout(initializeTimeline, 100);
        }
      };
      
      initializeTimeline();
    }
  }, [shifts, roles, currentDate]);

  // Update options when currentDate changes
  useEffect(() => {
    console.log('=== Options Update Effect ===');
    console.log('Current date changed to:', currentDate.toISOString());
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Calculate the start and end times for the 8-hour window
    let startHour = currentHour - 4;
    let endHour = currentHour + 4;
    
    if (startHour < 5) {
      startHour = 5;
      endHour = 13;
    } else if (endHour > 24) {
      endHour = 24;
      startHour = 16;
    }
    
    const newOptions = {
      ...options,
      min: new Date(new Date(currentDate).setHours(5, 0, 0, 0)),
      max: new Date(new Date(currentDate).setHours(24, 0, 0, 0)),
      start: new Date(new Date(currentDate).setHours(startHour, 0, 0, 0)),
      end: new Date(new Date(currentDate).setHours(endHour, 0, 0, 0)),
      editable: {
        add: false,
        updateTime: false,
        updateGroup: false,
        remove: false
      },
      moveable: true,
      zoomable: true,
      selectable: true,
      horizontalScroll: false,
      verticalScroll: false,
      orientation: {
        axis: 'top',
        item: 'top'
      }
    };
    
    // Deep compare options
    const optionsChanged = JSON.stringify(options) !== JSON.stringify(newOptions);
    console.log('Options comparison:', {
      optionsChanged,
      currentOptionsLength: Object.keys(options).length,
      newOptionsLength: Object.keys(newOptions).length
    });
    
    if (optionsChanged) {
      console.log('Options changed, updating timeline');
      setOptions(newOptions);
    } else {
      console.log('Options unchanged, skipping update');
    }
  }, [currentDate]);

  // Function to handle shift editing
  const handleShiftEdit = useCallback((itemId) => {
    console.log('=== handleShiftEdit ===');
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
        
        // Try to find the shift in our state array
        let fullShiftData = shifts.find(s => s.id === itemId);
        
        // If not found by direct ID match, create a minimal version
        if (!fullShiftData) {
          fullShiftData = {
            id: itemId,
            date: formatDate(currentDate, DATE_FORMATS.ISO),
            ...datasetItem
          };
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
        
        console.log('Setting edit shift data:', {
          id: itemId,
          name,
          startTime,
          endTime,
          role: datasetItem.group,
          roleName
        });
        
        // Set edit shift data
        setEditShiftData({
          id: itemId,
          name: name,
          startTime: startTime,
          endTime: endTime,
          role: datasetItem.group,
          roleName: roleName,
          formattedStartTime: formatTimeInput(startTime),
          formattedEndTime: formatTimeInput(endTime),
          status: isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED,
          userId: fullShiftData.userId || null,
          date: fullShiftData.date || formatDate(currentDate, DATE_FORMATS.ISO),
          vehicleId: fullShiftData.vehicleId || null,
          vehicleName: fullShiftData.vehicleName || null,
        });
        
        console.log('Opening edit dialog');
        setEditDialogOpen(true);
      } catch (error) {
        console.error('Error accessing timeline dataset:', error);
      }
    } else {
      console.error('Timeline or dataset refs not available');
    }
  }, [shifts, currentDate, formatDate, formatTimeInput, getRoleNameById, isShiftAvailable]);

  // Update local state after shift changes
  const updateLocalShiftState = useCallback((updatedShift) => {
    console.log('=== Updating Local Shift State ===');
    console.log('Updated shift:', updatedShift);
    
    setShifts(prevShifts => {
      const newShifts = prevShifts.map(shift => 
        shift.id === updatedShift.id ? updatedShift : shift
      );
      console.log('Shifts state updated:', {
        prevLength: prevShifts.length,
        newLength: newShifts.length
      });
      return newShifts;
    });
    
    if (itemsDatasetRef.current) {
      console.log('Updating timeline item directly');
      itemsDatasetRef.current.update({
        id: updatedShift.id,
        content: updatedShift.content,
        className: updatedShift.className
      });
    } else {
      console.warn('Timeline dataset ref not available');
    }
  }, []);

  // Function to handle shift clicks
  const handleShiftClick = useCallback((event) => {
    console.log('Shift clicked:', event);
    
    if (!event || !event.item) return;
    
    // Find the clicked shift
    const clickedShift = shifts.find(shift => shift.id === event.item);
    
    if (!clickedShift) {
      console.log('Shift not found:', event.item);
      return;
    }
    
    // Check if this is the user's shift
    if (clickedShift.userId === user?.uid) {
      // Set the shift data for editing
      setEditShiftData({
        id: clickedShift.id,
        name: clickedShift.name,
        startTime: new Date(clickedShift.startTimeISO),
        endTime: new Date(clickedShift.endTimeISO),
        role: clickedShift.role,
        roleName: clickedShift.roleName,
        formattedStartTime: clickedShift.startTimeFormatted,
        formattedEndTime: clickedShift.endTimeFormatted,
        status: clickedShift.status,
        date: clickedShift.date,
        vehicleId: clickedShift.vehicleId,
        vehicleName: clickedShift.vehicleName,
      });
      setEditDialogOpen(true);
      return;
    }
    
    // Only allow picking up available shifts
    if (clickedShift.status !== SHIFT_STATUS.AVAILABLE) {
      console.log('Shift is not available for pickup');
      return;
    }
    
    // Set the shift data for pickup
    setPickupShiftData({
      id: clickedShift.id,
      name: clickedShift.name,
      startTime: new Date(clickedShift.startTimeISO),
      endTime: new Date(clickedShift.endTimeISO),
      role: clickedShift.role,
      roleName: clickedShift.roleName,
      formattedStartTime: clickedShift.startTimeFormatted,
      formattedEndTime: clickedShift.endTimeFormatted,
      status: clickedShift.status,
      date: clickedShift.date,
      vehicleId: clickedShift.vehicleId,
      vehicleName: clickedShift.vehicleName,
    });
    
    // Open the pickup dialog
    setPickupDialogOpen(true);
  }, [shifts, user?.uid]);

  // Function to handle shift pickup confirmation
  const handlePickupConfirm = async () => {
    try {
      if (!user) {
        console.error('No current user found');
        alert('Please sign in to pick up shifts');
        return;
      }

      // Check if a vehicle is assigned
      if (!pickupShiftData.vehicleId) {
        setPickupError('You must assign a vehicle!');
        return;
      }

      // Find current user in users array and get their full name
      const currentUser = users.find(u => u.id === user.uid);
      const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : user.displayName || user.email?.split('@')[0] || 'User';

      // Format the shift data for both Firebase and the timeline
      const updatedShift = {
        ...pickupShiftData,
        // Timeline required properties
        id: pickupShiftData.id,
        group: pickupShiftData.role,
        start: pickupShiftData.startTime.toISOString(),
        end: pickupShiftData.endTime.toISOString(),
        content: `${userName} | ${pickupShiftData.formattedStartTime}-${pickupShiftData.formattedEndTime}`,
        className: 'shift-item',
        
        // Firebase properties
        status: SHIFT_STATUS.ASSIGNED,
        userId: user.uid,
        name: userName,
        startTimeISO: pickupShiftData.startTime.toISOString(),
        endTimeISO: pickupShiftData.endTime.toISOString(),
        startTimeFormatted: pickupShiftData.formattedStartTime,
        endTimeFormatted: pickupShiftData.formattedEndTime,
        role: pickupShiftData.role,
        roleName: pickupShiftData.roleName,
        date: pickupShiftData.date,
        vehicleId: pickupShiftData.vehicleId || null,
        vehicleName: pickupShiftData.vehicleName || null
      };

      console.log('Updating shift with data:', updatedShift);

      // Update in Firebase
      const result = await updateShiftInFirebase(updatedShift);

      if (!result) {
        // Conflict or error already handled inside updateShiftInFirebase
        return;
      }

      // Update local state using the new function
      updateLocalShiftState(updatedShift);

      // Close the dialog and reset errors
      setPickupDialogOpen(false);
      setPickupError('');
    } catch (error) {
      console.error('Failed to pick up shift:', error);
      alert('Failed to pick up shift. Please try again.');
    }
  };

  // Function to handle shift edit confirmation
  const handleEditConfirm = async () => {
    try {
      if (!user) {
        console.error('No current user found');
        alert('Please sign in to edit shifts');
        return;
      }

      // Check if a vehicle is assigned
      if (!editShiftData.vehicleId) {
        setVehicleError('You must assign a vehicle!');
        return;
      }

      // Format the shift data for both Firebase and the timeline
      const updatedShift = {
        ...editShiftData,
        // Timeline required properties
        id: editShiftData.id,
        group: editShiftData.role,
        start: editShiftData.startTime.toISOString(),
        end: editShiftData.endTime.toISOString(),
        content: `${editShiftData.name} | ${editShiftData.formattedStartTime}-${editShiftData.formattedEndTime}`,
        className: 'shift-item my-shift',
        
        // Firebase properties
        status: SHIFT_STATUS.ASSIGNED,
        userId: user.uid,
        startTimeISO: editShiftData.startTime.toISOString(),
        endTimeISO: editShiftData.endTime.toISOString(),
        startTimeFormatted: editShiftData.formattedStartTime,
        endTimeFormatted: editShiftData.formattedEndTime,
        role: editShiftData.role,
        roleName: editShiftData.roleName,
        date: editShiftData.date,
        vehicleId: editShiftData.vehicleId || null,
        vehicleName: editShiftData.vehicleName || null
      };

      console.log('Updating shift with data:', updatedShift);

      // Update in Firebase
      const result = await updateShiftInFirebase(updatedShift);

      if (!result) {
        // Conflict or error already handled inside updateShiftInFirebase
        return;
      }

      // Update local state
      setShifts(prevShifts => 
        prevShifts.map(shift => 
          shift.id === editShiftData.id ? updatedShift : shift
        )
      );

      // Close the dialog and reset errors
      setEditDialogOpen(false);
      setVehicleError('');
    } catch (error) {
      console.error('Failed to update shift:', error);
      alert('Failed to update shift. Please try again.');
    }
  };

  // Set up event listeners in a useEffect
  useEffect(() => {
    if (!timelineRef.current) return;

    console.log('Setting up timeline event listeners');
    
    // Remove any existing handlers first to avoid duplicates
    timelineRef.current.off('click');
    timelineRef.current.off('doubleClick');
    
    // Handle clicks
    const handleClick = (event) => {
      console.log('Timeline click:', event);
      
      // If we clicked on a shift
      if (event.item) {
        console.log('Shift clicked:', event.item);
        handleShiftClick(event);
      }
    };
    
    // Add event listeners
    timelineRef.current.on('click', handleClick);
    
    // Cleanup function
    return () => {
      console.log('Cleaning up timeline event listeners');
      if (timelineRef.current) {
        timelineRef.current.off('click');
      }
    };
  }, [handleShiftClick]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setCurrentDate(prev => new Date(prev.getTime() - 86400000))}>
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
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setCurrentDate(prev => new Date(prev.getTime() + 86400000))}>
          <ChevronRight className="h-6 w-6" />
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
            getTimelineRef={(ref, itemsDs, groupsDs) => getTimelineRef(ref, itemsDs, groupsDs)}
          />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden h-[80vh] flex items-center justify-center">
          <p className="text-lg">Loading roles...</p>
        </div>
      )}
      
      {/* Pickup Shift Dialog */}
      <Dialog open={pickupDialogOpen} onOpenChange={setPickupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pick Up Shift</DialogTitle>
            <DialogDescription>
              {pickupShiftData.roleName && pickupShiftData.startTime && pickupShiftData.endTime
                ? `Pick up shift for ${pickupShiftData.roleName} from ${formatTimeForTitle(pickupShiftData.startTime)} to ${formatTimeForTitle(pickupShiftData.endTime)}`
                : 'Pick up shift'}
            </DialogDescription>
          </DialogHeader>
          
          {pickupShiftData.id ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Role</Label>
                <div className="col-span-3">{pickupShiftData.roleName}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Time</Label>
                <div className="col-span-3">
                  {pickupShiftData.formattedStartTime} - {pickupShiftData.formattedEndTime}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vehicle" className="text-right">
                  Assign Vehicle
                </Label>
                <div className="col-span-3">
                  <select 
                    id="vehicle"
                    value={pickupShiftData.vehicleId || ''} 
                    onChange={(e) => {
                      const vehicle = vehicles.find(v => v.id === e.target.value);
                      setPickupShiftData(prev => ({
                        ...prev,
                        vehicleId: e.target.value,
                        vehicleName: vehicle ? vehicle.name : ''
                      }));
                      setPickupError(''); // Clear error when vehicle is selected
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles
                      .filter(vehicle => vehicle.status === 'Available' || vehicle.status === 'In Use')
                      .map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </option>
                    ))}
                  </select>
                  {vehicleError && <div className="text-red-500 text-sm mt-1">{vehicleError}</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">Loading shift details...</div>
          )}
          
          {pickupError && <div className="text-red-500 text-sm text-center mb-4">{pickupError}</div>}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPickupDialogOpen(false);
              setPickupError('');
            }}>
              Cancel
            </Button>
            <Button onClick={handlePickupConfirm}>Pick Up Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Shift Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              {editShiftData.roleName && editShiftData.startTime && editShiftData.endTime
                ? `Edit shift details for ${editShiftData.roleName} from ${formatTimeForTitle(editShiftData.startTime)} to ${formatTimeForTitle(editShiftData.endTime)}`
                : 'Edit shift details'}
            </DialogDescription>
          </DialogHeader>
          
          {editShiftData.id ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Role</Label>
                <div className="col-span-3">{editShiftData.roleName}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Time</Label>
                <div className="col-span-3">
                  {editShiftData.formattedStartTime} - {editShiftData.formattedEndTime}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vehicle" className="text-right">
                  Assign Vehicle
                </Label>
                <div className="col-span-3">
                  <select 
                    id="vehicle"
                    value={editShiftData.vehicleId || ''} 
                    onChange={handleVehicleSelect}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles
                      .filter(vehicle => vehicle.status === 'Available' || vehicle.status === 'In Use')
                      .map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </option>
                    ))}
                  </select>
                  {vehicleError && <div className="text-red-500 text-sm mt-1">{vehicleError}</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">Loading shift details...</div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setVehicleError('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditConfirm}>Save Changes</Button>
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
        .my-shift {
          background-color: #2563eb; /* Blue background */
          border-color: #1d4ed8; /* Darker blue border */
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