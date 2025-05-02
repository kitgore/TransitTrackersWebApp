'use client';

import { useState, useEffect } from 'react';
import { useBaseSchedule, SHIFT_STATUS } from './base-schedule';
import { 
  createTemplate, 
  getAllTemplates, 
  updateTemplate, 
  deleteTemplate
} from '@/src/firebase/templateService';
import { fetchRoles, fetchUsers, fetchVehicles } from '@/src/firebase/shiftService';
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
import { Textarea } from '@/components/ui/textarea';

export default function TemplateManager() {
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
    shifts,
    setShifts,
    options,
    setOptions,
    getTimelineRef,
    formatTimeInput,
    isShiftAvailable,
    getRoleNameById,
    getRoleDisplayName,
    formatTimeForTitle
  } = useBaseSchedule();

  // State for templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for users and vehicles
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  // State for dialog control
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    description: '',
    shifts: []
  });
  
  // State for editing an existing template
  const [editTemplateData, setEditTemplateData] = useState(null);

  // State for shift dialogs
  const [createShiftDialogOpen, setCreateShiftDialogOpen] = useState(false);
  const [editShiftDialogOpen, setEditShiftDialogOpen] = useState(false);
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
    vehicleName: null
  });
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
    vehicleName: null
  });

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Load roles from Firebase
  useEffect(() => {
    const loadRoles = async () => {
      console.log('=== Loading Roles ===');
      try {
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

  // Load users from Firebase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    
    loadUsers();
  }, []);

  // Load vehicles from Firebase
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const fetchedVehicles = await fetchVehicles();
        setVehicles(fetchedVehicles);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };
    
    loadVehicles();
  }, []);

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
    const startDate = convertTimestampToDate(shift.start);
    const endDate = convertTimestampToDate(shift.end);

    // Convert UTC dates to local timezone
    const localStartDate = startDate ? new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000)) : new Date();
    const localEndDate = endDate ? new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)) : new Date(localStartDate.getTime() + 3 * 60 * 60 * 1000);

    return {
      ...shift,
      start: localStartDate,
      end: localEndDate,
      startTimeISO: localStartDate.toISOString(),
      endTimeISO: localEndDate.toISOString(),
    };
  };

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        console.log('=== Loading Templates ===');
        const fetchedTemplates = await getAllTemplates();
        console.log('Fetched templates:', fetchedTemplates);
        
        // Format shifts in each template
        const formattedTemplates = fetchedTemplates.map(template => {
          console.log('Processing template:', template);
          try {
            const formattedShifts = template.shifts.map(shift => {
              console.log('Processing shift:', shift);
              return formatShiftForTimeline(shift);
            });
            return {
              ...template,
              shifts: formattedShifts
            };
          } catch (error) {
            console.error('Error formatting template:', template, error);
            return null;
          }
        }).filter(template => template !== null); // Remove any templates that failed to format
        
        console.log('Formatted templates:', formattedTemplates);
        setTemplates(formattedTemplates);
        
        // If there are templates and none is selected, select the first one
        if (formattedTemplates.length > 0 && !selectedTemplate) {
          console.log('Selecting first template:', formattedTemplates[0]);
          setSelectedTemplate(formattedTemplates[0]);
          setEditTemplateData(formattedTemplates[0]);
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
  }, []);

  // Update options for timeline
  useEffect(() => {
    console.log('=== Updating Timeline Options ===');
    console.log('Timeline ref exists:', !!timelineRef.current);
    console.log('Current roles:', roles);
    
    if (timelineRef.current && roles.length > 0) {
      // Get the current date in local timezone
      const localDate = new Date();
      const localMin = new Date(localDate);
      localMin.setHours(5, 0, 0, 0); // 5 AM local time
      
      const localMax = new Date(localDate);
      localMax.setHours(24, 0, 0, 0); // 12 AM local time
      
      const newOptions = {
        ...options,
        min: localMin,
        max: localMax,
        start: localMin,
        end: localMax,
        zoomMin: 1000 * 60 * 60, // 1 hour
        zoomMax: 1000 * 60 * 60 * 24, // 24 hours
        showCurrentTime: true,
        showMajorLabels: false,
        showMinorLabels: true,
        format: {
          minorLabels: {
            hour: 'hA',
            minute: 'hA'
          }
        },
        timeAxis: {
          scale: 'hour',
          step: 1
        },
        stack: false,
        verticalScroll: true,
        horizontalScroll: true,
        moveable: true,
        zoomable: true,
        selectable: true,
        multiselect: false,
        orientation: {
          axis: 'top',
          item: 'top'
        },
        margin: {
          axis: 0,
          item: {
            horizontal: 0,
            vertical: 0
          }
        },
        groupHeightMode: 'fixed',
        groupOrder: 'content',
        groupTemplate: function(group) {
          return group ? group.content : '';
        }
      };
      
      console.log('Setting new options:', newOptions);
      setOptions(newOptions);
      timelineRef.current.setOptions(newOptions);
    }
  }, [timelineRef.current, roles, currentDate]);

  // Handle background click to create new shift
  const handleBackgroundClick = (clickEvent) => {
    console.log('=== handleBackgroundClick ===');
    console.log('Click event:', clickEvent);
    console.log('Timeline ref:', timelineRef.current);
    console.log('Roles:', roles);
    
    if (clickEvent.what === 'background' && clickEvent.group && clickEvent.time) {
      console.log('✅ Valid background click detected');
      
      // Check if roles are loaded
      if (roles.length === 0 || roles[0].id === 'default') {
        console.log('❌ Roles not loaded yet, cannot create shift');
        alert('Please wait for roles to load before creating a shift');
        return;
      }
      
      // Get the clicked time and group
      const clickedTime = new Date(clickEvent.time);
      const role = clickEvent.group;
      
      console.log('Processing click:', {
        clickedTime,
        role,
        rolesLoaded: roles.length > 0
      });
      
      // Round time to the nearest half hour for better UX
      const minutes = clickedTime.getMinutes();
      clickedTime.setMinutes(minutes < 30 ? 0 : 30);
      clickedTime.setSeconds(0);
      clickedTime.setMilliseconds(0);
      
      // Calculate end time (start time + 3 hours)
      const endTime = new Date(clickedTime.getTime() + 3 * 60 * 60 * 1000);
      
      // Get role name for display
      const roleName = getRoleNameById(role);
      
      console.log('Setting new shift data:', {
        startTime: clickedTime,
        endTime,
        role,
        roleName
      });
      
      // Set new shift data
      setNewShiftData({
        id: `shift${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: SHIFT_STATUS.AVAILABLE,
        startTime: clickedTime,
        endTime: endTime,
        role: role,
        roleName: roleName,
        formattedStartTime: formatTimeInput(clickedTime),
        formattedEndTime: formatTimeInput(endTime),
        status: SHIFT_STATUS.AVAILABLE
      });
      
      console.log('Opening create dialog');
      setCreateShiftDialogOpen(true);
    } else {
      console.log('❌ Invalid background click:', {
        what: clickEvent.what,
        hasGroup: !!clickEvent.group,
        hasTime: !!clickEvent.time
      });
    }
  };

  // Handle shift time changes
  const handleTimeChange = async (event) => {
    console.log('=== handleTimeChange ===');
    console.log('Event:', event);
    
    if (!event || !event.id) return;
    
    // Create updated shift object with the correct format
    const updatedShift = {
      id: event.id,
      content: event.name || SHIFT_STATUS.AVAILABLE,
      start: new Date(event.start),
      end: new Date(event.end),
      group: event.group,
      className: event.status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
      name: event.name || SHIFT_STATUS.AVAILABLE,
      status: event.status || SHIFT_STATUS.AVAILABLE,
      userId: event.userId || null,
      role: event.group,
      startTimeISO: new Date(event.start).toISOString(),
      endTimeISO: new Date(event.end).toISOString(),
      startTimeFormatted: formatTimeInput(new Date(event.start)),
      endTimeFormatted: formatTimeInput(new Date(event.end)),
      roleName: getRoleNameById(event.group),
      vehicleId: event.vehicleId || null,
      vehicleName: event.vehicleName || null
    };
    
    console.log('Updated shift:', updatedShift);
    
    if (isEditing && editTemplateData) {
      const updatedTemplate = {
        ...editTemplateData,
        shifts: editTemplateData.shifts.map(shift => 
          shift.id === event.id ? updatedShift : shift
        )
      };
      
      try {
        await updateTemplate(editTemplateData.id, updatedTemplate);
        setEditTemplateData(updatedTemplate);
        setTemplates(prev => prev.map(t => 
          t.id === editTemplateData.id ? updatedTemplate : t
        ));
      } catch (error) {
        console.error('Error updating template:', error);
        alert('Failed to save changes. Please try again.');
        return;
      }
    } else {
      setNewTemplateData(prev => ({
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === event.id ? updatedShift : shift
        )
      }));
    }
  };

  // Set up event listeners for timeline
  useEffect(() => {
    if (!timelineRef.current) return;

    console.log('Setting up timeline event listeners');
    
    // Remove any existing handlers first to avoid duplicates
    timelineRef.current.off('click');
    
    // Handle clicks
    const handleClick = (event) => {
      console.log('Timeline click:', event);
      
      // If we clicked on the background
      if (event.what === 'background') {
        handleBackgroundClick(event);
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
  }, [handleBackgroundClick, timelineRef]);

  // Handle start time changes in create dialog
  const handleStartTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newStartTime = new Date(newShiftData.startTime || new Date());
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

  // Handle end time changes in create dialog
  const handleEndTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newEndTime = new Date(newShiftData.startTime || new Date());
    newEndTime.setHours(hours, minutes, 0, 0);

    setNewShiftData(prev => ({
      ...prev,
      endTime: newEndTime,
      formattedEndTime: timeStr
    }));
  };

  // Handle start time changes in edit dialog
  const handleEditStartTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newStartTime = new Date(editShiftData.startTime || new Date());
    newStartTime.setHours(hours, minutes, 0, 0);

    setEditShiftData(prev => ({
      ...prev,
      startTime: newStartTime,
      formattedStartTime: timeStr
    }));
  };

  // Handle end time changes in edit dialog
  const handleEditEndTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    // Parse the time string and create a new date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newEndTime = new Date(editShiftData.startTime || new Date());
    newEndTime.setHours(hours, minutes, 0, 0);

    setEditShiftData(prev => ({
      ...prev,
      endTime: newEndTime,
      formattedEndTime: timeStr
    }));
  };

  // Handle user selection in create dialog
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

  // Handle vehicle selection in create dialog
  const handleVehicleSelect = (e) => {
    const vehicleId = e.target.value || null;
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    
    setNewShiftData(prev => ({
      ...prev,
      vehicleId: vehicleId,
      vehicleName: selectedVehicle?.name || null
    }));
  };

  // Add new shift from dialog
  const addShiftFromDialog = async () => {
    // Ensure all required fields have valid values
    const newShift = {
      id: newShiftData.id || `shift-${Date.now()}`,
      content: newShiftData.name || SHIFT_STATUS.AVAILABLE,
      start: newShiftData.startTime || new Date(),
      end: newShiftData.endTime || new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Default 3 hours
      group: newShiftData.role || roles[0]?.id || 'default',
      className: newShiftData.status === SHIFT_STATUS.AVAILABLE ? 'shift-item available-shift' : 'shift-item',
      name: newShiftData.name || SHIFT_STATUS.AVAILABLE,
      status: newShiftData.status || SHIFT_STATUS.AVAILABLE,
      userId: newShiftData.userId || null,
      role: newShiftData.role || roles[0]?.id || 'default',
      startTimeISO: (newShiftData.startTime || new Date()).toISOString(),
      endTimeISO: (newShiftData.endTime || new Date(new Date().getTime() + 3 * 60 * 60 * 1000)).toISOString(),
      startTimeFormatted: newShiftData.formattedStartTime || formatTimeInput(new Date()),
      endTimeFormatted: newShiftData.formattedEndTime || formatTimeInput(new Date(new Date().getTime() + 3 * 60 * 60 * 1000)),
      roleName: newShiftData.roleName || getRoleNameById(roles[0]?.id) || 'Default Role',
      vehicleId: newShiftData.vehicleId || null,
      vehicleName: newShiftData.vehicleName || null
    };

    if (isEditing && editTemplateData) {
      const updatedTemplate = {
        ...editTemplateData,
        shifts: [...editTemplateData.shifts, newShift]
      };
      
      try {
        // Ensure we're only sending the necessary fields to Firestore
        const templateToSave = {
          name: updatedTemplate.name,
          description: updatedTemplate.description || '',
          shifts: updatedTemplate.shifts.map(shift => ({
            id: shift.id,
            name: shift.name,
            role: shift.role,
            roleName: shift.roleName,
            startTime: shift.startTimeISO,
            endTime: shift.endTimeISO,
            status: shift.status,
            userId: shift.userId,
            vehicleId: shift.vehicleId,
            vehicleName: shift.vehicleName
          }))
        };

        await updateTemplate(editTemplateData.id, templateToSave);
        setEditTemplateData(updatedTemplate);
        setTemplates(prev => prev.map(t => 
          t.id === editTemplateData.id ? updatedTemplate : t
        ));
      } catch (error) {
        console.error('Error updating template:', error);
        alert('Failed to save shift. Please try again.');
        return;
      }
    } else {
      setNewTemplateData(prev => ({
        ...prev,
        shifts: [...prev.shifts, newShift]
      }));
    }

    setCreateShiftDialogOpen(false);
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
      vehicleName: null
    });
  };

  // Update shift from edit dialog
  const updateShiftFromDialog = () => {
    const updatedShift = {
      ...editShiftData,
      startTimeISO: editShiftData.startTime.toISOString(),
      endTimeISO: editShiftData.endTime.toISOString()
    };

    if (isEditing && editTemplateData) {
      setEditTemplateData(prev => ({
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === updatedShift.id ? updatedShift : shift
        )
      }));
    } else {
      setNewTemplateData(prev => ({
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === updatedShift.id ? updatedShift : shift
        )
      }));
    }

    setEditShiftDialogOpen(false);
  };

  // Delete shift
  const deleteShift = () => {
    if (isEditing && editTemplateData) {
      setEditTemplateData(prev => ({
        ...prev,
        shifts: prev.shifts.filter(shift => shift.id !== editShiftData.id)
      }));
    } else {
      setNewTemplateData(prev => ({
        ...prev,
        shifts: prev.shifts.filter(shift => shift.id !== editShiftData.id)
      }));
    }

    setEditShiftDialogOpen(false);
  };

  // Create new template
  const handleCreateTemplate = async () => {
    try {
      const newTemplate = await createTemplate(newTemplateData);
      const formattedTemplate = {
        ...newTemplate,
        shifts: newTemplate.shifts.map(formatShiftForTimeline)
      };
      setTemplates(prev => [...prev, formattedTemplate]);
      setSelectedTemplate(formattedTemplate);
      setEditTemplateData(formattedTemplate);
      setIsEditing(true);
      setCreateDialogOpen(false);
      setNewTemplateData({
        name: '',
        description: '',
        shifts: []
      });
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    }
  };

  // Update template
  const handleUpdateTemplate = async () => {
    if (!editTemplateData?.id) return;
    
    try {
      await updateTemplate(editTemplateData.id, editTemplateData);
      setTemplates(prev => 
        prev.map(template => 
          template.id === editTemplateData.id ? editTemplateData : template
        )
      );
      setEditDialogOpen(false);
      setIsEditing(false);
      setEditTemplateData(null);
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template. Please try again.');
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      await deleteTemplate(templateToDelete.id);
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      if (selectedTemplate?.id === templateToDelete.id) {
        setSelectedTemplate(null);
        setEditTemplateData(null);
        setIsEditing(false);
      }
      setDeleteDialogOpen(false);
      setDeleteConfirmationText('');
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  // Load template for editing
  const handleEditTemplate = (template) => {
    setEditTemplateData(template);
    setIsEditing(true);
    setEditDialogOpen(true);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    if (template) {
      setEditTemplateData(template);
      setIsEditing(true);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Schedule Templates</h1>
        <div className="flex gap-4 items-center">
          {templates.length > 0 ? (
            <div className="flex gap-2 items-center">
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="border rounded-md p-2 min-w-[200px]"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setTemplateToDelete(selectedTemplate);
                    setDeleteDialogOpen(true);
                  }}
                >
                  Delete Template
                </Button>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No templates available</p>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            Create New Template
          </Button>
        </div>
      </div>

      {/* Template Editor */}
      {selectedTemplate ? (
        <div className="border rounded-lg overflow-hidden h-[80vh]">
          <GanttTimeline
            items={editTemplateData?.shifts || []}
            groups={roles}
            options={options}
            className="h-full"
            onTimeChange={handleTimeChange}
            onBackgroundClick={handleBackgroundClick}
            getTimelineRef={(ref, itemsDs, groupsDs) => {
              console.log('=== GanttTimeline getTimelineRef ===');
              console.log('Props:', {
                items: editTemplateData?.shifts || [],
                groups: roles,
                options: options,
                onBackgroundClick: !!handleBackgroundClick
              });
              return getTimelineRef(ref, itemsDs, groupsDs);
            }}
          />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden h-[80vh] flex items-center justify-center">
          <p className="text-lg">
            {templates.length > 0 
              ? "Please select a template to begin" 
              : "Create a new template to begin"}
          </p>
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new schedule template that can be used as a starting point for schedules
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newTemplateData.name}
                onChange={(e) => setNewTemplateData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newTemplateData.description}
                onChange={(e) => setNewTemplateData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                await handleCreateTemplate();
                setCreateDialogOpen(false);
              }}
              disabled={!newTemplateData.name}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify the template details and shifts
            </DialogDescription>
          </DialogHeader>
          
          {editTemplateData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Name
                </Label>
                <Input
                  id="editName"
                  value={editTemplateData.name}
                  onChange={(e) => setEditTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDescription" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="editDescription"
                  value={editTemplateData.description}
                  onChange={(e) => setEditTemplateData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setIsEditing(false);
              setEditTemplateData(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTemplate}
              disabled={!editTemplateData?.name || editTemplateData.shifts.length === 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shift Dialog */}
      <Dialog open={createShiftDialogOpen} onOpenChange={setCreateShiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Shift</DialogTitle>
            <DialogDescription>
              Create a new shift for {newShiftData.roleName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="user" className="text-right">
                Driver
              </Label>
              <select
                id="user"
                value={newShiftData.userId || ''}
                onChange={handleUserSelect}
                className="col-span-3 border rounded-md p-2"
              >
                <option value="">Select a driver</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle" className="text-right">
                Vehicle
              </Label>
              <select
                id="vehicle"
                value={newShiftData.vehicleId || ''}
                onChange={handleVehicleSelect}
                className="col-span-3 border rounded-md p-2"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateShiftDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addShiftFromDialog}>Add Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={editShiftDialogOpen} onOpenChange={setEditShiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              {editShiftData.roleName && editShiftData.startTime && editShiftData.endTime
                ? `Update shift details for ${getRoleDisplayName(editShiftData)} at ${formatTimeForTitle(editShiftData.startTime)} to ${formatTimeForTitle(editShiftData.endTime)}`
                : 'Update shift details'}
            </DialogDescription>
          </DialogHeader>
          
          {editShiftData.id && (
            <div className="grid gap-4 py-4">
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
          )}
          
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={deleteShift}>
              Delete Shift
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditShiftDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateShiftFromDialog}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
              <br />
              Type the template name "{templateToDelete?.name}" to confirm deletion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deleteConfirmation" className="text-right">
                Template Name
              </Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="col-span-3"
                placeholder="Type the template name to confirm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmationText('');
              setTemplateToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={deleteConfirmationText !== templateToDelete?.name}
            >
              Delete Template
            </Button>
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