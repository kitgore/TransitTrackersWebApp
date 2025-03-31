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
  const groupsDatasetRef = useRef(null);
  
  // Get today's date for creating the sample data
  const today = new Date();
  
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
    group: '',
    groupName: '',
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
    group: '',
    groupName: '',
    formattedStartTime: '',
    formattedEndTime: '',
    status: '',
    userId: null,
  });

  // Define the shift groups (rows in the Gantt chart)
  const [groups] = useState([
    { id: 'Shift 0', content: 'AXE 2' },
    { id: 'Shift 1', content: 'AXE 3' },
    { id: 'Shift 2', content: 'AXE 4' },
    { id: 'Shift 3', content: 'Jacks 1' },
    { id: 'Shift 4', content: 'Jacks 2' },
    { id: 'Shift 5', content: 'Jacks 3' },
    { id: 'Shift 6', content: 'Clean/Fuel' },
    { id: 'Shift 7', content: 'Louie 1' },
    { id: 'Shift 8', content: 'Louie 2' },
    { id: 'Shift 9', content: 'Louie 3' },
    { id: 'Shift 10', content: 'Louie 4' }
  ]);

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

  // Format date header
  const formatDateHeader = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Function to determine if a shift is available
  const isShiftAvailable = (name) => {
    return name.toUpperCase() === SHIFT_STATUS.AVAILABLE;
  };
  
  // Get group name by ID
  const getGroupNameById = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.content : groupId;
  };

  // ========== Firebase Integration Functions ==========
  
  // These would be implemented later when adding Firebase
  const fetchShiftsFromFirebase = useCallback(async () => {
    // This will be implemented when adding Firebase
    console.log('Fetching shifts from Firebase...');
    return [];
  }, []);

  const saveShiftToFirebase = useCallback(async (shift) => {
    // This will be implemented when adding Firebase
    console.log('Saving shift to Firebase:', shift);
    return shift;
  }, []);

  const updateShiftInFirebase = useCallback(async (shift) => {
    // This will be implemented when adding Firebase
    console.log('Updating shift in Firebase:', shift);
    return shift;
  }, []);

  const deleteShiftFromFirebase = useCallback(async (shiftId) => {
    // This will be implemented when adding Firebase
    console.log('Deleting shift from Firebase:', shiftId);
    return true;
  }, []);
  
  // ========== Shift Management Functions ==========
  
  // Create a shift object with proper format
  const createShiftObject = ({
    name, 
    startTime, 
    endTime, 
    group, 
    id = `shift${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId = null,
  }) => {
    const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;
    const status = isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED;
    
    return {
      id,
      group,
      content: `${name} | ${timeDisplay}`,
      start: formatDateForTimeline(startTime),
      end: formatDateForTimeline(endTime),
      className: status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
      name,
      status,
      userId,
      
      // For Firestore (these properties would be used when saving to Firebase)
      // Using separate fields for easier querying
      startTimeISO: formatDateForTimeline(startTime),
      endTimeISO: formatDateForTimeline(endTime),
      startTimeFormatted: formatTimeDisplay(startTime),
      endTimeFormatted: formatTimeDisplay(endTime),
      groupName: getGroupNameById(group),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  // Initialize shifts with consistent date format after component mounts
  useEffect(() => {
    const loadShifts = async () => {
      // This would eventually fetch from Firebase
      // For now, use sample data
      
      // Sample shifts with specific start and end times
      const initialShifts = [
        // Shift 0 - Morning to afternoon
        createShiftObject({
          name: 'Benjamin Griepp', 
          startTime: new Date(createDateAtHour(8)), 
          endTime: new Date(createDateAtHour(11, 30)), 
          group: 'Shift 0',
          userId: 'user123'
        }),
        createShiftObject({
          name: 'Drake Stanton', 
          startTime: new Date(createDateAtHour(12)), 
          endTime: new Date(createDateAtHour(15)), 
          group: 'Shift 0',
          userId: 'user456'
        }),
        createShiftObject({
          name: 'Lauren Bushman', 
          startTime: new Date(createDateAtHour(15, 30)), 
          endTime: new Date(createDateAtHour(18)), 
          group: 'Shift 0',
          userId: 'user789'
        }),
        
        // Shift 1 - Spread throughout the day
        createShiftObject({
          name: 'Alonso Jimenez', 
          startTime: new Date(createDateAtHour(8)), 
          endTime: new Date(createDateAtHour(10)), 
          group: 'Shift 1',
          userId: 'user234'
        }),
        createShiftObject({
          name: 'Michael Jones', 
          startTime: new Date(createDateAtHour(10, 30)), 
          endTime: new Date(createDateAtHour(13)), 
          group: 'Shift 1',
          userId: 'user567'
        }),
        createShiftObject({
          name: 'Sophia Park', 
          startTime: new Date(createDateAtHour(13, 30)), 
          endTime: new Date(createDateAtHour(18)), 
          group: 'Shift 1',
          userId: 'user890'
        }),
        
        // Shift 2 - Alternating short and long shifts
        createShiftObject({
          name: 'Jane Smith', 
          startTime: new Date(createDateAtHour(8)), 
          endTime: new Date(createDateAtHour(9, 30)), 
          group: 'Shift 2',
          userId: 'user345'
        }),
        createShiftObject({
          name: 'David Wilson', 
          startTime: new Date(createDateAtHour(10)), 
          endTime: new Date(createDateAtHour(13, 30)), 
          group: 'Shift 2',
          userId: 'user678'
        }),
        createShiftObject({
          name: 'Linda Thompson', 
          startTime: new Date(createDateAtHour(14)), 
          endTime: new Date(createDateAtHour(18)), 
          group: 'Shift 2',
          userId: 'user901'
        }),
        
        // Shift 3 - Multiple shorter shifts
        createShiftObject({
          name: 'AVAILABLE', 
          startTime: new Date(createDateAtHour(8)), 
          endTime: new Date(createDateAtHour(10)), 
          group: 'Shift 3'
        }),
        createShiftObject({
          name: 'Thomas Brown', 
          startTime: new Date(createDateAtHour(10, 15)), 
          endTime: new Date(createDateAtHour(12)), 
          group: 'Shift 3',
          userId: 'user456'
        }),
        createShiftObject({
          name: 'Jessica Lee', 
          startTime: new Date(createDateAtHour(12, 15)), 
          endTime: new Date(createDateAtHour(14, 45)), 
          group: 'Shift 3',
          userId: 'user789'
        }),
        createShiftObject({
          name: 'Andrew Clark', 
          startTime: new Date(createDateAtHour(15)), 
          endTime: new Date(createDateAtHour(18)), 
          group: 'Shift 3',
          userId: 'user234'
        }),
      ];
      
      // In the real implementation, you would fetch from Firebase:
      // const firebaseShifts = await fetchShiftsFromFirebase();
      
      console.log('Setting initial shifts with consistent format:', initialShifts);
      setShifts(initialShifts);
    };
    
    loadShifts();
  }, []);

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
      const group = clickEvent.group;
      
      // Round time to the nearest half hour for better UX
      const minutes = clickedTime.getMinutes();
      clickedTime.setMinutes(minutes < 30 ? 0 : 30);
      clickedTime.setSeconds(0);
      clickedTime.setMilliseconds(0);
      
      // Calculate end time (start time + 3 hours)
      const endTime = new Date(clickedTime.getTime() + 3 * 60 * 60 * 1000);
      
      // Get group name for display
      const groupName = getGroupNameById(group);
      
      // Set new shift data for the dialog
      setNewShiftData({
        id: `shift${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: SHIFT_STATUS.AVAILABLE,
        startTime: clickedTime,
        endTime: endTime,
        group: group,
        groupName: groupName,
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
        const datasetItem = itemsDatasetRef.current.get(itemId);
        if (datasetItem) {
          console.log('Shift data found in dataset:', datasetItem);
          
          // Convert string timestamps to Date objects
          const startTime = new Date(datasetItem.start);
          const endTime = new Date(datasetItem.end);
          
          // Try to extract the name from the content field
          let name = SHIFT_STATUS.AVAILABLE;
          if (datasetItem.content && typeof datasetItem.content === 'string') {
            const contentParts = datasetItem.content.split('|');
            name = contentParts[0]?.trim() || SHIFT_STATUS.AVAILABLE;
          }
          
          // Get group name for display
          const groupName = getGroupNameById(datasetItem.group);
          
          // Set edit shift data using the dataset item
          setEditShiftData({
            id: datasetItem.id,
            name: name,
            startTime: startTime,
            endTime: endTime,
            group: datasetItem.group,
            groupName: groupName,
            formattedStartTime: formatTimeInput(startTime),
            formattedEndTime: formatTimeInput(endTime),
            status: isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED,
            userId: datasetItem.userId || null
          });
          
          // Open the edit dialog
          setEditDialogOpen(true);
        } else {
          console.log('Shift not found in dataset:', itemId);
        }
      } catch (error) {
        console.error('Error accessing timeline dataset:', error);
      }
    } else {
      console.log('Timeline or dataset refs not available yet');
    }
  };
  
  // Function to add a shift from dialog data
  const addShiftFromDialog = async () => {
    // Create a new shift object
    const newShift = createShiftObject({
      name: newShiftData.name,
      startTime: newShiftData.startTime,
      endTime: newShiftData.endTime,
      group: newShiftData.group,
      id: newShiftData.id,
      userId: newShiftData.userId
    });
    
    console.log('Adding new shift from dialog:', newShift);
    
    // In the future, this would be where we save to Firebase first
    // const savedShift = await saveShiftToFirebase(newShift);
    
    // Then update the local state with the saved shift
    setShifts(prevShifts => [...prevShifts, newShift]);
    
    // Close the dialog
    setCreateDialogOpen(false);
  };
  
  // Function to update a shift from edit dialog data
  const updateShiftFromDialog = async () => {
    // Create updated shift object
    const updatedShift = {
      ...shifts.find(shift => shift.id === editShiftData.id),
      name: editShiftData.name,
      content: `${editShiftData.name} | ${formatTimeDisplay(editShiftData.startTime)}-${formatTimeDisplay(editShiftData.endTime)}`,
      start: formatDateForTimeline(editShiftData.startTime),
      end: formatDateForTimeline(editShiftData.endTime),
      group: editShiftData.group,
      status: isShiftAvailable(editShiftData.name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED,
      className: isShiftAvailable(editShiftData.name) ? 'shift-item available-shift' : 'shift-item',
      userId: editShiftData.userId,
      
      // For Firestore
      startTimeISO: formatDateForTimeline(editShiftData.startTime),
      endTimeISO: formatDateForTimeline(editShiftData.endTime),
      startTimeFormatted: formatTimeDisplay(editShiftData.startTime),
      endTimeFormatted: formatTimeDisplay(editShiftData.endTime),
      groupName: getGroupNameById(editShiftData.group),
      updatedAt: new Date(),
    };
    
    // In the future, this would be where we update in Firebase first
    // const updatedFirebaseShift = await updateShiftInFirebase(updatedShift);
    
    // Then update the local state
    setShifts(prevShifts => {
      return prevShifts.map(shift => {
        if (shift.id === editShiftData.id) {
          return updatedShift;
        }
        return shift;
      });
    });
    
    // Close the dialog
    setEditDialogOpen(false);
  };
  
  // Function to delete a shift
  const deleteShift = async () => {
    // In the future, this would delete from Firebase first
    // await deleteShiftFromFirebase(editShiftData.id);
    
    // Then update local state
    setShifts(prevShifts => prevShifts.filter(shift => shift.id !== editShiftData.id));
    
    // Close the dialog
    setEditDialogOpen(false);
  };
  
  // Handle shift updates (when moved or resized)
  const handleTimeChange = async (event) => {
    console.log('Shift updated:', event);
    
    if (!event || !event.id) return;
    
    // Find the shift that was changed
    const originalShift = shifts.find(shift => shift.id === event.id);
    
    if (!originalShift) {
      console.log('Original shift not found for update');
      return;
    }
    
    // Update in the timeline
    setShifts(prevShifts => {
      return prevShifts.map(shift => {
        if (shift.id === event.id) {
          // Make sure we're using the correct date format for display
          const startTime = new Date(event.start);
          const endTime = new Date(event.end);
          const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;
          const status = shift.status || (isShiftAvailable(shift.name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED);
          
          console.log(`Updating shift ${shift.id} with new time: ${timeDisplay}`);
          
          // Create an updated shift object
          const updatedShift = {
            ...shift,
            start: event.start,
            end: event.end,
            group: event.group || shift.group,
            content: `${shift.name} | ${timeDisplay}`,
            className: status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
            
            // For Firestore
            startTimeISO: event.start,
            endTimeISO: event.end,
            startTimeFormatted: formatTimeDisplay(startTime),
            endTimeFormatted: formatTimeDisplay(endTime),
            groupName: getGroupNameById(event.group || shift.group),
            updatedAt: new Date(),
          };
          
          // In the future, we would update Firebase here:
          // updateShiftInFirebase(updatedShift);
          
          return updatedShift;
        }
        return shift;
      });
    });
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

  // Get timeline reference after it's mounted
  const getTimelineRef = (ref, itemsDataset, groupsDataset) => {
    timelineRef.current = ref;
    itemsDatasetRef.current = itemsDataset;
    groupsDatasetRef.current = groupsDataset;
    
    // Add click event listener to the timeline
    if (ref) {
      console.log('Registering timeline click handler');
      
      // Remove any existing handlers first to avoid duplicates
      ref.off('click');
      ref.off('doubleClick');
      
      // Register our custom click handler for all clicks
      ref.on('click', handleTimelineClick);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{formatDateHeader(today)}</h1>
      
      <div className="border rounded-lg overflow-hidden">
        <GanttTimeline
          items={shifts}
          groups={groups}
          options={options}
          className="h-[600px]"
          onTimeChange={handleTimeChange}
          getTimelineRef={(ref, itemsDs, groupsDs) => getTimelineRef(ref, itemsDs, groupsDs)}
        />
      </div>
      
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
              Create a new shift for {newShiftData.groupName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newShiftData.name}
                onChange={handleNameChange}
                className="col-span-3"
              />
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
              Update shift details for {editShiftData.groupName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editName" className="text-right">
                Name
              </Label>
              <Input
                id="editName"
                value={editShiftData.name}
                onChange={handleEditNameChange}
                className="col-span-3"
              />
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