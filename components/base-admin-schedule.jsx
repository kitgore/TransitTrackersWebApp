'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { useBaseSchedule, SHIFT_STATUS, DATE_FORMATS } from './base-schedule';

export default function BaseAdminSchedule({
  shifts = [],
  roles = [],
  users = [],
  vehicles = [],
  currentDate,
  onShiftCreate,
  onShiftUpdate,
  onShiftDelete,
  readOnly = false
}) {
  // Define ordered days of the week
  const ORDERED_DAYS = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

  // Get base functionality from useBaseSchedule hook
  const {
    timelineRef,
    containerRef,
    itemsDatasetRef,
    rolesDatasetRef,
    options,
    setOptions,
    getTimelineRef,
    formatDate,
    formatTimeInput,
    isShiftAvailable,
    formatTimeForTitle,
    getRoleDisplayName,
    setShifts
  } = useBaseSchedule();

  // Get role name by ID using the roles prop
  const getRoleNameById = useCallback((roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.content : roleId;
  }, [roles]);

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
    vehicleId: null,
    vehicleName: null,
    repeatDays: {
      M: false,
      Tu: false,
      W: false,
      Th: false,
      F: false,
      Sa: false,
      Su: false,
    }
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
    vehicleId: null,
    vehicleName: null,
    repeatDays: {
      M: false,
      Tu: false,
      W: false,
      Th: false,
      F: false,
      Sa: false,
      Su: false,
    }
  });

  // Reference to track resize state
  const isResizingRef = useRef(false);
  // Reference to track if we're currently updating
  const isUpdatingRef = useRef(false);

  // Function to toggle repeat day
  const toggleRepeatDay = (day, isEdit = false) => {
    if (isEdit) {
      setEditShiftData(prev => ({
        ...prev,
        repeatDays: {
          ...prev.repeatDays,
          [day]: !prev.repeatDays[day]
        }
      }));
    } else {
      setNewShiftData(prev => ({
        ...prev,
        repeatDays: {
          ...prev.repeatDays,
          [day]: !prev.repeatDays[day]
        }
      }));
    }
  };

  // Function to check if a shift is repeating
  const isShiftRepeating = (shift) => {
    if (!shift.repeatDays) return false;
    return Object.values(shift.repeatDays).some(day => day === true);
  };

  // Function to create shift object
  const createShiftObject = ({
    name,
    startTime,
    endTime,
    role,
    userId,
    vehicleId,
    vehicleName,
    repeatDays
  }) => {
    // Ensure we have proper Date objects
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    
    const timeDisplay = `${formatTimeInput(start)}-${formatTimeInput(end)}`;
    const status = isShiftAvailable(name) ? SHIFT_STATUS.AVAILABLE : SHIFT_STATUS.ASSIGNED;
    const dateISO = formatDate(currentDate, DATE_FORMATS.ISO);
    
    // Get role name - roles should be loaded at this point
    const roleName = getRoleNameById(role);
    
    // Determine the class based on status and repeating
    let className = 'shift-item';
    if (status === SHIFT_STATUS.AVAILABLE) {
      className += ' available-shift';
    }
    if (isShiftRepeating({ repeatDays })) {
      className += ' repeating-shift';
    }
    
    return {
      group: role,
      content: `${name} | ${timeDisplay}`,
      start: start.toISOString(),
      end: end.toISOString(),
      className,
      name,
      status,
      userId,
      role,
      date: dateISO,
      startTimeISO: start.toISOString(),
      endTimeISO: end.toISOString(),
      startTimeFormatted: formatTimeInput(start),
      endTimeFormatted: formatTimeInput(end),
      roleName,
      vehicleId,
      vehicleName,
      repeatDays
    };
  };

  // Function to handle background clicks
  const handleBackgroundClick = useCallback((clickEvent) => {
    if (readOnly) return;
    
    if (clickEvent.what === 'background' && clickEvent.group && clickEvent.time) {
      // Check if roles are loaded
      if (roles.length === 0 || roles[0].id === 'default') {
        alert('Please wait for roles to load before creating a shift');
        return;
      }
      
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
        userId: null,
        vehicleId: null,
        vehicleName: null,
        repeatDays: {
          M: false,
          Tu: false,
          W: false,
          Th: false,
          F: false,
          Sa: false,
          Su: false,
        }
      });
      
      setCreateDialogOpen(true);
    }
  }, [readOnly, roles, getRoleNameById, formatTimeInput]);

  // Function to handle shift editing
  const handleShiftEdit = useCallback((itemId) => {
    if (readOnly) return;
    
    if (timelineRef.current && itemsDatasetRef.current) {
      try {
        
        // First check if we can find the item in the vis-timeline dataset
        const datasetItem = itemsDatasetRef.current.get(itemId);
        
        if (!datasetItem) {
          console.error('Shift not found in timeline dataset:', itemId);
          return;
        }
        
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

        // Get role name for display
        const roleName = getRoleNameById(datasetItem.group);
        
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
          repeatDays: fullShiftData.repeatDays || {
            M: false,
            Tu: false,
            W: false,
            Th: false,
            F: false,
            Sa: false,
            Su: false,
          },
        });
        
        setEditDialogOpen(true);
      } catch (error) {
        console.error('Error accessing timeline dataset:', error);
      }
    }
  }, [shifts, currentDate, formatDate, formatTimeInput, getRoleNameById, isShiftAvailable, readOnly, itemsDatasetRef, timelineRef, roles]);

  // Set up event listeners
  useEffect(() => {
    if (!timelineRef.current) return;

    const handleClick = (event) => {
      if (event.what === 'background') {
        handleBackgroundClick(event);
      }
    };

    const handleDoubleClick = (event) => {
      if (event.item) {
        handleShiftEdit(event.item);
      }
    };

    timelineRef.current.on('click', handleClick);
    timelineRef.current.on('doubleClick', handleDoubleClick);

    return () => {
      if (timelineRef.current) {
        timelineRef.current.off('click');
        timelineRef.current.off('doubleClick');
      }
    };
  }, [handleBackgroundClick, handleShiftEdit, timelineRef]);

  // Function to handle user selection in create dialog
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

  // Function to handle start time changes in create dialog
  const handleStartTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newStartTime = new Date(newShiftData.startTime || currentDate);
    newStartTime.setHours(hours, minutes, 0, 0);

    // Calculate end time (start time + 3 hours)
    const newEndTime = new Date(newStartTime.getTime() + 3 * 60 * 60 * 1000);

    setNewShiftData(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: newEndTime,
      formattedStartTime: timeStr,
      formattedEndTime: formatTimeInput(newEndTime)
    }));
  };

  // Function to handle end time changes in create dialog
  const handleEndTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newEndTime = new Date(newShiftData.startTime || currentDate);
    newEndTime.setHours(hours, minutes, 0, 0);

    setNewShiftData(prev => ({
      ...prev,
      endTime: newEndTime,
      formattedEndTime: timeStr
    }));
  };

  // Function to handle user selection in edit dialog
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

  // Function to handle start time changes in edit dialog
  const handleEditStartTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newStartTime = new Date(editShiftData.startTime || currentDate);
    newStartTime.setHours(hours, minutes, 0, 0);

    setEditShiftData(prev => ({
      ...prev,
      startTime: newStartTime,
      formattedStartTime: timeStr
    }));
  };

  // Function to handle end time changes in edit dialog
  const handleEditEndTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newEndTime = new Date(editShiftData.startTime || currentDate);
    newEndTime.setHours(hours, minutes, 0, 0);

    setEditShiftData(prev => ({
      ...prev,
      endTime: newEndTime,
      formattedEndTime: timeStr
    }));
  };

  // Function to add a new shift from the dialog
  const addShiftFromDialog = async () => {
    try {
      // Create the shift object
      const shift = createShiftObject({
        name: newShiftData.name,
        startTime: newShiftData.startTime,
        endTime: newShiftData.endTime,
        role: newShiftData.role,
        userId: newShiftData.userId,
        vehicleId: newShiftData.vehicleId,
        vehicleName: newShiftData.vehicleName,
        repeatDays: newShiftData.repeatDays,
      });

      // Call the onShiftCreate callback
      await onShiftCreate(shift);
      
      // Close the dialog
      setCreateDialogOpen(false);
      
      // Reset the new shift data
      setNewShiftData({
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
        vehicleId: null,
        vehicleName: null,
        repeatDays: {
          M: false,
          Tu: false,
          W: false,
          Th: false,
          F: false,
          Sa: false,
          Su: false,
        }
      });
    } catch (error) {
      console.error('Error adding shift:', error);
      alert('Failed to add shift. Please try again.');
    }
  };

  // Function to handle shift deletion
  const deleteShift = async () => {
    try {
      if (!editShiftData.id) {
        console.error('No shift ID available for deletion');
        return;
      }

      // Call the onShiftDelete callback
      await onShiftDelete(editShiftData);

      // Close the dialog
      setEditDialogOpen(false);

      // Reset edit shift data
      setEditShiftData({
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
        repeatDays: {
          M: false,
          Tu: false,
          W: false,
          Th: false,
          F: false,
          Sa: false,
          Su: false,
        }
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Failed to delete shift. Please try again.');
    }
  };

  // Function to get current shifts from timeline
  const getCurrentShiftsFromTimeline = useCallback(() => {
    if (!itemsDatasetRef.current) return [];
    return itemsDatasetRef.current.get();
  }, [itemsDatasetRef]);

  // Function to update a shift from edit dialog data
  const updateShiftFromDialog = async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    try {
      const shiftId = editShiftData.id;
      const date = editShiftData.date;
      
      console.log('🔍 Starting shift update. Current editShiftData:', editShiftData);
      
      // Format time values for Firestore
      const startTime = editShiftData.startTime instanceof Date ? editShiftData.startTime : new Date(editShiftData.startTime);
      const endTime = editShiftData.endTime instanceof Date ? editShiftData.endTime : new Date(editShiftData.endTime);
      
      // Get role name for display
      const roleName = getRoleNameById(editShiftData.role);
      
      // Create timeline-specific update
      const timelineUpdate = {
        id: shiftId,
        group: editShiftData.role,
        start: startTime,
        end: endTime,
        content: `${editShiftData.name} | ${formatTimeInput(startTime)}-${formatTimeInput(endTime)}`,
        className: editShiftData.status === SHIFT_STATUS.AVAILABLE 
          ? 'shift-item available-shift' + (isShiftRepeating(editShiftData) ? ' repeating-shift' : '')
          : 'shift-item' + (isShiftRepeating(editShiftData) ? ' repeating-shift' : '')
      };
      
      // Prepare shift data for update with consistent date formats
      const shiftDataForUpdate = {
        id: shiftId,
        date: date,
        name: editShiftData.name,
        startTimeISO: startTime.toISOString(),
        endTimeISO: endTime.toISOString(),
        startTimeFormatted: formatTimeInput(startTime),
        endTimeFormatted: formatTimeInput(endTime),
        role: editShiftData.role,
        group: editShiftData.role,
        roleName: roleName,
        status: editShiftData.status,
        userId: editShiftData.userId,
        vehicleId: editShiftData.vehicleId || null,
        vehicleName: editShiftData.vehicleName || null,
        repeatDays: editShiftData.repeatDays,
        updatedAt: new Date().toISOString(),
        content: timelineUpdate.content,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        className: timelineUpdate.className
      };

      console.log('📦 Prepared update data:', shiftDataForUpdate);
      console.log('🎯 Timeline update data:', timelineUpdate);
      
      // Update Firebase first to ensure data persistence
      console.log('📡 Calling onShiftUpdate with data:', shiftDataForUpdate);
      await onShiftUpdate(shiftDataForUpdate);
      
      // Update React state before timeline to ensure data consistency
      setShifts(prev => prev.map(s => s.id === shiftId ? {
        ...s,
        ...shiftDataForUpdate,
      } : s));
      
      // Update timeline last, after state is consistent
      if (itemsDatasetRef.current) {
        console.log('⚡ Updating timeline with:', timelineUpdate);
        itemsDatasetRef.current.update({
          ...timelineUpdate,
          start: startTime,  // Use Date objects for timeline
          end: endTime
        });
        
        // Verify timeline update
        const updatedItem = itemsDatasetRef.current.get(shiftId);
        if (!updatedItem) {
          console.error('Timeline update failed - item not found after update');
          throw new Error('Timeline update failed');
        }
        
        // Force timeline redraw to ensure visibility
        if (timelineRef.current) {
          timelineRef.current.redraw();
        }
      }
      
      console.log('✅ Shift update completed successfully');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('❌ Error updating shift:', error);
      alert('Failed to update shift. Please try again.');
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // Handle shift updates (when moved or resized)
  const handleTimeChange = async (event) => {
    if (readOnly || !event?.id || isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    console.log('🕒 Timeline shift change event:', event);
    
    // Set resize flag
    isResizingRef.current = true;
    let originalShift;
    
    try {
      // Get current shifts from timeline
      const currentShifts = getCurrentShiftsFromTimeline();
      console.log('📊 Current shifts from timeline:', currentShifts);
      
      // Find the shift that was changed
      originalShift = currentShifts.find(shift => shift.id === event.id);
      
      if (!originalShift) {
        console.log('❌ Original shift not found for update:', event.id);
        return;
      }
      
      // Make sure we have the date
      if (!originalShift.date) {
        console.error('❌ Missing date in shift data');
        return;
      }
      
      console.log('📋 Original shift:', originalShift);
      
      // Make sure we're using the correct date format for display
      const startTime = new Date(event.start);
      const endTime = new Date(event.end);
      
      // Create timeline-specific update
      const timelineUpdate = {
        id: event.id,
        group: event.group || originalShift.group,
        start: startTime,
        end: endTime,
        content: `${originalShift.name} | ${formatTimeInput(startTime)}-${formatTimeInput(endTime)}`,
        className: originalShift.status === SHIFT_STATUS.AVAILABLE 
          ? 'shift-item available-shift' + (isShiftRepeating(originalShift) ? ' repeating-shift' : '')
          : 'shift-item' + (isShiftRepeating(originalShift) ? ' repeating-shift' : '')
      };
      
      // Create an updated shift object
      const updatedShift = {
        ...originalShift,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        role: event.group || originalShift.role,
        group: event.group || originalShift.group,
        content: timelineUpdate.content,
        startTimeISO: startTime.toISOString(),
        endTimeISO: endTime.toISOString(),
        startTimeFormatted: formatTimeInput(startTime),
        endTimeFormatted: formatTimeInput(endTime),
        roleName: getRoleNameById(event.group || originalShift.group),
        className: timelineUpdate.className
      };
      
      console.log('📦 Updated shift data:', updatedShift);
      console.log('🎯 Timeline update data:', timelineUpdate);
      
      // Update timeline first
      if (itemsDatasetRef.current) {
        console.log('⚡ Updating timeline with:', timelineUpdate);
        itemsDatasetRef.current.update(timelineUpdate);
      }
      
      // Call the onShiftUpdate callback
      console.log('📡 Calling onShiftUpdate for timeline change');
      await onShiftUpdate(updatedShift);
      
      // Update React state
      setShifts(prev => prev.map(s => s.id === event.id ? updatedShift : s));
      
      console.log('✅ Timeline shift update completed successfully');
    } catch (error) {
      console.error('❌ Failed to update shift time:', error);
      // Revert local state if the update fails
      if (originalShift && itemsDatasetRef.current) {
        const timelineRevert = {
          id: originalShift.id,
          group: originalShift.group,
          start: new Date(originalShift.start),
          end: new Date(originalShift.end),
          content: originalShift.content,
          className: originalShift.className
        };
        itemsDatasetRef.current.update(timelineRevert);
        setShifts(prev => prev.map(s => s.id === event.id ? originalShift : s));
      }
    } finally {
      // Reset flags
      isUpdatingRef.current = false;
      setTimeout(() => {
        isResizingRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="space-y-4">
      {roles.length > 0 && roles[0].id !== 'default' ? (
        <div className="border rounded-lg overflow-hidden h-[80vh]">
          <GanttTimeline
            items={shifts}
            groups={roles}
            options={{
              ...options,
              editable: !readOnly,
              selectable: !readOnly
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
              <Label htmlFor="vehicle" className="text-right">
                Assign Vehicle
              </Label>
              <div className="col-span-3">
                <select 
                  id="vehicle"
                  value={newShiftData.vehicleId || ''} 
                  onChange={(e) => {
                    const vehicle = vehicles.find(v => v.id === e.target.value);
                    setNewShiftData(prev => ({
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
              </div>
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Repeat Days</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {ORDERED_DAYS.map(day => (
                  <Button
                    key={day}
                    variant={newShiftData.repeatDays[day] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRepeatDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
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
              {editShiftData.roleName && editShiftData.startTime && editShiftData.endTime
                ? `Update shift details for ${getRoleDisplayName(editShiftData)} at ${formatTimeForTitle(editShiftData.startTime)} to ${formatTimeForTitle(editShiftData.endTime)}`
                : 'Update shift details'}
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
                </div>
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Repeat Days</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {ORDERED_DAYS.map(day => (
                    <Button
                      key={day}
                      variant={editShiftData.repeatDays[day] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRepeatDay(day, true)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
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
          background-color:rgb(43, 61, 193);
          border-color: #18181b;
          border-radius: calc(var(--radius) - 2px) !important;
          padding: 4px 8px;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .available-shift {
          background-color: #15803d;
          border-color: #166534;
          color: white;
        }
        .repeating-shift {
          background-color:rgb(0, 0, 0);
          border-color: #1e40af;
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