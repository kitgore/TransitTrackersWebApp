'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function GanttChartPage() {
  // Reference to timeline for event handling
  const timelineRef = useRef(null);
  
  // Reference to the timeline's internal datasets
  const itemsDatasetRef = useRef(null);
  const groupsDatasetRef = useRef(null);
  
  // Get today's date for creating the sample data
  const today = new Date();
  
  // State for dialog control
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newShiftData, setNewShiftData] = useState({
    id: '',
    name: 'AVAILABLE',
    startTime: null,
    endTime: null,
    group: '',
    formattedStartTime: '',
    formattedEndTime: ''
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
    formattedEndTime: ''
  });
  
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
  
  // Create a shift with proper format
  const createShift = (name, startTime, endTime, group) => {
    const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;
    return {
      id: `shift${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      group: group,
      content: `${name} | ${timeDisplay}`,
      start: startTime,
      end: endTime,
      className: 'shift-item',
      name: name, // Store the original name for later updates
    };
  };

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
  
  // Initialize shifts with consistent date format after component mounts
  useEffect(() => {
    // Sample shifts with specific start and end times
    const initialShifts = [
      // Shift 0 - Morning to afternoon
      createShift('Benjamin Griepp', createDateAtHour(8), createDateAtHour(11, 30), 'Shift 0'),
      createShift('Drake Stanton', createDateAtHour(12), createDateAtHour(15), 'Shift 0'),
      createShift('Lauren Bushman', createDateAtHour(15, 30), createDateAtHour(18), 'Shift 0'),
      
      // Shift 1 - Spread throughout the day
      createShift('Alonso Jimenez', createDateAtHour(8), createDateAtHour(10), 'Shift 1'),
      createShift('Michael Jones', createDateAtHour(10, 30), createDateAtHour(13), 'Shift 1'),
      createShift('Sophia Park', createDateAtHour(13, 30), createDateAtHour(18), 'Shift 1'),
      
      // Shift 2 - Alternating short and long shifts
      createShift('Jane Smith', createDateAtHour(8), createDateAtHour(9, 30), 'Shift 2'),
      createShift('David Wilson', createDateAtHour(10), createDateAtHour(13, 30), 'Shift 2'),
      createShift('Linda Thompson', createDateAtHour(14), createDateAtHour(18), 'Shift 2'),
      
      // Shift 3 - Multiple shorter shifts
      createShift('AVAILABLE', createDateAtHour(8), createDateAtHour(10), 'Shift 3'),
      createShift('Thomas Brown', createDateAtHour(10, 15), createDateAtHour(12), 'Shift 3'),
      createShift('Jessica Lee', createDateAtHour(12, 15), createDateAtHour(14, 45), 'Shift 3'),
      createShift('Andrew Clark', createDateAtHour(15), createDateAtHour(18), 'Shift 3'),
      
      // Shift 4 - Distributed throughout the day
      createShift('AVAILABLE', createDateAtHour(8), createDateAtHour(9, 45), 'Shift 4'),
      createShift('Olivia Green', createDateAtHour(10), createDateAtHour(13), 'Shift 4'),
      createShift('Noah Adams', createDateAtHour(13, 15), createDateAtHour(16, 30), 'Shift 4'),
      createShift('Maria Garcia', createDateAtHour(16, 45), createDateAtHour(18), 'Shift 4'),
      
      // Shift 5 - Mix of shift durations
      createShift('AVAILABLE', createDateAtHour(8), createDateAtHour(11), 'Shift 5'),
      createShift('Emma White', createDateAtHour(11, 15), createDateAtHour(14, 30), 'Shift 5'),
      createShift('James Robinson', createDateAtHour(15), createDateAtHour(18), 'Shift 5'),
      
      // Shift 6 - Even distribution
      createShift('Ava Harris', createDateAtHour(8), createDateAtHour(10, 45), 'Shift 6'),
      createShift('Mason Clark', createDateAtHour(11), createDateAtHour(14), 'Shift 6'),
      createShift('Sophia Lewis', createDateAtHour(14, 15), createDateAtHour(18), 'Shift 6'),
      
      // Shift 7 - Varied shift lengths
      createShift('Ethan Walker', createDateAtHour(8), createDateAtHour(9), 'Shift 7'),
      createShift('Charlotte Young', createDateAtHour(9, 15), createDateAtHour(12, 30), 'Shift 7'),
      createShift('Liam Miller', createDateAtHour(13), createDateAtHour(16), 'Shift 7'),
      createShift('Amelia Moore', createDateAtHour(16, 15), createDateAtHour(18), 'Shift 7'),
      
      // Shift 8 - Two long shifts
      createShift('Aiden Jackson', createDateAtHour(8), createDateAtHour(13), 'Shift 8'),
      createShift('Isabella Allen', createDateAtHour(13, 30), createDateAtHour(18), 'Shift 8'),
      
      // Shift 9 - Multiple short shifts
      createShift('Lucas Thomas', createDateAtHour(8), createDateAtHour(9, 30), 'Shift 9'),
      createShift('Mia King', createDateAtHour(9, 45), createDateAtHour(11, 30), 'Shift 9'),
      createShift('Harper Scott', createDateAtHour(11, 45), createDateAtHour(13, 15), 'Shift 9'),
      createShift('Jacob Wright', createDateAtHour(13, 30), createDateAtHour(15), 'Shift 9'),
      createShift('Abigail Turner', createDateAtHour(15, 15), createDateAtHour(16, 30), 'Shift 9'),
      createShift('Benjamin Hill', createDateAtHour(16, 45), createDateAtHour(18), 'Shift 9'),
      
      // Shift 10 - Three equal blocks
      createShift('Ella Evans', createDateAtHour(8), createDateAtHour(11, 20), 'Shift 10'),
      createShift('Logan Carter', createDateAtHour(11, 30), createDateAtHour(14, 45), 'Shift 10'),
      createShift('Grace Murphy', createDateAtHour(15), createDateAtHour(18), 'Shift 10'),
    ];
    
    console.log('Setting initial shifts with consistent format:', initialShifts);
    setShifts(initialShifts);
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
      const groupObject = groups.find(g => g.id === group);
      const groupName = groupObject ? groupObject.content : group;
      
      // Set new shift data for the dialog
      setNewShiftData({
        id: `shift${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'AVAILABLE',
        startTime: clickedTime,
        endTime: endTime,
        group: group,
        groupName: groupName,
        formattedStartTime: formatTimeInput(clickedTime),
        formattedEndTime: formatTimeInput(endTime)
      });
      
      // Open the dialog
      setCreateDialogOpen(true);
    }
  };
  
  // Track click information
  const lastClickRef = useRef({
    time: 0,
    item: null
  });
  
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
  
  // Function to handle shift editing (previously handleTaskDoubleClick)
  const handleShiftEdit = (itemId) => {
    console.log('Opening edit dialog for shift:', itemId);
    
    // First try to find the shift in the React state
    const shift = shifts.find(t => t.id === itemId);
    
    if (shift) {
      console.log('Shift data found in state:', shift);
      
      // Convert string timestamps to Date objects
      const startTime = new Date(shift.start);
      const endTime = new Date(shift.end);
      
      // Get group name for display
      const groupObject = groups.find(g => g.id === shift.group);
      const groupName = groupObject ? groupObject.content : shift.group;
      
      // Set edit shift data for the dialog
      setEditShiftData({
        id: shift.id,
        name: shift.name || 'AVAILABLE',
        startTime: startTime,
        endTime: endTime,
        group: shift.group,
        groupName: groupName,
        formattedStartTime: formatTimeInput(startTime),
        formattedEndTime: formatTimeInput(endTime)
      });
      
      // Open the edit dialog
      setEditDialogOpen(true);
    } 
    // If not found in state, try to get it from the dataset
    else if (timelineRef.current && itemsDatasetRef.current) {
      try {
        console.log('Shift not found in state, trying dataset...');
        const datasetItem = itemsDatasetRef.current.get(itemId);
        
        if (datasetItem) {
          console.log('Shift data found in dataset:', datasetItem);
          
          // Convert string timestamps to Date objects
          const startTime = new Date(datasetItem.start);
          const endTime = new Date(datasetItem.end);
          
          // Try to extract the name from the content field
          let name = 'AVAILABLE';
          if (datasetItem.content && typeof datasetItem.content === 'string') {
            const contentParts = datasetItem.content.split('|');
            name = contentParts[0]?.trim() || 'AVAILABLE';
          }
          
          // Get group name for display
          const groupObject = groups.find(g => g.id === datasetItem.group);
          const groupName = groupObject ? groupObject.content : datasetItem.group;
          
          // Set edit shift data using the dataset item
          setEditShiftData({
            id: datasetItem.id,
            name: name,
            startTime: startTime,
            endTime: endTime,
            group: datasetItem.group,
            groupName: groupName,
            formattedStartTime: formatTimeInput(startTime),
            formattedEndTime: formatTimeInput(endTime)
          });
          
          // Open the edit dialog
          setEditDialogOpen(true);
        } else {
          console.log('Shift not found in dataset either:', itemId);
        }
      } catch (error) {
        console.error('Error accessing timeline dataset:', error);
      }
    } else {
      console.log('Timeline or dataset refs not available yet');
    }
  };

  // Function to add a shift from dialog data
  const addShiftFromDialog = () => {
    // Create a new shift
    const newShift = {
      id: newShiftData.id,
      group: newShiftData.group,
      content: `${newShiftData.name} | ${formatTimeDisplay(newShiftData.startTime)}-${formatTimeDisplay(newShiftData.endTime)}`,
      start: formatDateForTimeline(newShiftData.startTime),
      end: formatDateForTimeline(newShiftData.endTime),
      className: 'shift-item',
      name: newShiftData.name, // Store the original name for later updates
    };
    
    console.log('Adding new shift from dialog:', newShift);
    setShifts(prevShifts => [...prevShifts, newShift]);
    
    // Close the dialog
    setCreateDialogOpen(false);
  };
  
  // Function to update a shift from edit dialog data
  const updateShiftFromDialog = () => {
    setShifts(prevShifts => {
      return prevShifts.map(shift => {
        if (shift.id === editShiftData.id) {
          // Create an updated shift object
          return {
            ...shift,
            content: `${editShiftData.name} | ${formatTimeDisplay(editShiftData.startTime)}-${formatTimeDisplay(editShiftData.endTime)}`,
            start: formatDateForTimeline(editShiftData.startTime),
            end: formatDateForTimeline(editShiftData.endTime),
            group: editShiftData.group,
            name: editShiftData.name
          };
        }
        return shift;
      });
    });
    
    // Close the dialog
    setEditDialogOpen(false);
  };
  
  // Function to delete a shift
  const deleteShift = () => {
    setShifts(prevShifts => prevShifts.filter(shift => shift.id !== editShiftData.id));
    
    // Close the dialog
    setEditDialogOpen(false);
  };

  // Handle shift updates (when moved or resized)
  const handleTimeChange = (event) => {
    console.log('Shift updated:', event);
    
    if (!event || !event.id) return;
    
    setShifts(prevShifts => {
      return prevShifts.map(shift => {
        if (shift.id === event.id) {
          // Make sure we're using the correct date format for display
          const startTime = formatTimeDisplay(event.start);
          const endTime = formatTimeDisplay(event.end);
          const timeDisplay = `${startTime}-${endTime}`;
          
          console.log(`Updating shift ${shift.id} with new time: ${timeDisplay}`);
          
          // Create a new shift object with updated properties
          return {
            ...shift,
            start: event.start,
            end: event.end,
            group: event.group || shift.group,
            content: `${shift.name} | ${timeDisplay}`
          };
        }
        return shift;
      });
    });
  };

  // Handle changes to shift name input for new shift
  const handleNameChange = (e) => {
    setNewShiftData(prev => ({
      ...prev,
      name: e.target.value
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
    setEditShiftData(prev => ({
      ...prev,
      name: e.target.value
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
      
      // Optionally log all events for debugging
      const logAllEvents = (eventName) => {
        ref.on(eventName, (props) => {
          console.log(`EVENT ${eventName}:`, props);
        });
      };
      
      // Log these specific events to diagnose double click issues
      logAllEvents('doubleClick');
      logAllEvents('itemselect');
      logAllEvents('itemover');
      logAllEvents('itemout');
    }
  };
  
  const formatDateHeader = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
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