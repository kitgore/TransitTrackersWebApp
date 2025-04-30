'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Constants for shift status
export const SHIFT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  PENDING: 'PENDING',
};

// Constants for date formatting
export const DATE_FORMATS = {
  ISO: 'iso',
  DISPLAY: 'display',
};

export function useBaseSchedule() {
  // Reference to timeline for event handling
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  
  // Reference to the timeline's internal datasets
  const itemsDatasetRef = useRef(null);
  const rolesDatasetRef = useRef(null);
  
  // Get today's date for creating the sample data
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // State for roles and users
  const [roles, setRoles] = useState([
    { id: 'default', content: 'Loading Roles...' }
  ]);
  
  // State for users
  const [users, setUsers] = useState([]);
  
  // State for shifts - start with empty array
  const [shifts, setShifts] = useState([]);
  
  // Timeline options with fixed window
  const [options, setOptions] = useState({
    min: new Date(new Date(currentDate).setHours(5, 0, 0, 0)),  // scrollable lower bound
    max: new Date(new Date(currentDate).setHours(24, 0, 0, 0)), // scrollable upper bound
    editable: true,
    selectable: true,
    margin: {
      item: {
        horizontal: 0,
      }
    },
    showMajorLabels: false,
    showMinorLabels: true,
    orientation: 'top',
    timeAxis: { scale: 'hour', step: 1 },
    zoomable: true,
    moveable: true,
    verticalScroll: false,
    format: {
      minorLabels: {
        hour: 'hA',
        minute: 'hA'
      }
    },
    groupHeightMode: 'fixed',
  });

  // ========== Utility Functions ==========
  
  // Format date consistently
  const formatDateForTimeline = (date) => {
    return date.toISOString();
  };
  
  // Create a date at a specific hour
  const createDateAtHour = (hour, minutes = 0) => {
    const date = new Date(currentDate);
    date.setHours(hour, minutes, 0, 0);
    return formatDateForTimeline(date);
  };
  
  // Format time display in HH:MM AM/PM format
  const formatTimeDisplay = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
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
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
    const role = roles.find(r => r.id === roleId);
    return role ? role.content : roleId;
  };

  // Get role name for display
  const getRoleDisplayName = (shift) => {
    if (!shift) return '';
    if (shift.roleName) return shift.roleName;
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

  // Get timeline reference after it's mounted
  const getTimelineRef = (ref, itemsDataset, groupsDataset) => {
    timelineRef.current = ref;
    itemsDatasetRef.current = itemsDataset;
    rolesDatasetRef.current = groupsDataset;

    // Add wheel event listener to prevent vertical scrolling
    if (ref && ref.dom && ref.dom.root) {
      const container = ref.dom.root;
      container.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  };

  return {
    // State
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

    // Utility Functions
    formatDateForTimeline,
    createDateAtHour,
    formatTimeDisplay,
    formatTimeInput,
    parseTimeInput,
    formatDate,
    formatDateHeader,
    isShiftAvailable,
    getRoleNameById,
    getRoleDisplayName,
    formatTimeForTitle,

    // Timeline Functions
    getTimelineRef,

    // Constants
    SHIFT_STATUS,
    DATE_FORMATS
  };
} 