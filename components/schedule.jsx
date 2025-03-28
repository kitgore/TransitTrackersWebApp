'use client';

import { useState, useEffect, useRef } from 'react';
import GanttTimeline from '@/components/vis-timeline'; // Adjust path as needed
import { Button } from '@/components/ui/button'; // Assuming this exists

export default function GanttChartPage() {
  // Reference to timeline for event handling
  const timelineRef = useRef(null);
  
  // Get today's date for creating the sample data
  const today = new Date();
  
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
  
  // Create a task with proper format
  const createTask = (name, startTime, endTime, group) => {
    const timeDisplay = `${formatTimeDisplay(startTime)}-${formatTimeDisplay(endTime)}`;
    return {
      id: `task${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      group: group,
      content: `${name} | ${timeDisplay}`,
      start: startTime,
      end: endTime,
      className: 'task-item',
      name: name, // Store the original name for later updates
    };
  };

  // Define the task groups (rows in the Gantt chart)
  const [groups] = useState([
    { id: 'Task 0', content: 'AXE 2' },
    { id: 'Task 1', content: 'AXE 3' },
    { id: 'Task 2', content: 'AXE 4' },
    { id: 'Task 3', content: 'Jacks 1' },
    { id: 'Task 4', content: 'Jacks 2' },
    { id: 'Task 5', content: 'Jacks 3' },
    { id: 'Task 6', content: 'Clean/Fuel' },
    { id: 'Task 7', content: 'Louie 1' },
    { id: 'Task 8', content: 'Louie 2' },
    { id: 'Task 9', content: 'Louie 3' },
    { id: 'Task 10', content: 'Louie 4' }
  ]);

  const colors = { bg: '#18181b', border: '#18181b' };
  
  // State for tasks - start with empty array
  const [tasks, setTasks] = useState([]);
  
  // Initialize tasks with consistent date format after component mounts
  useEffect(() => {
    // Sample tasks with specific start and end times
    const initialTasks = [
      // Task 0 - Morning to afternoon
      createTask('Benjamin Griepp', createDateAtHour(8), createDateAtHour(11, 30), 'Task 0'),
      createTask('Drake Stanton', createDateAtHour(12), createDateAtHour(15), 'Task 0'),
      createTask('Lauren Bushman', createDateAtHour(15, 30), createDateAtHour(18), 'Task 0'),
      
      // Task 1 - Spread throughout the day
      createTask('Alonso Jimenez', createDateAtHour(8), createDateAtHour(10), 'Task 1'),
      createTask('Michael Jones', createDateAtHour(10, 30), createDateAtHour(13), 'Task 1'),
      createTask('Sophia Park', createDateAtHour(13, 30), createDateAtHour(18), 'Task 1'),
      
      // Task 2 - Alternating short and long tasks
      createTask('Jane Smith', createDateAtHour(8), createDateAtHour(9, 30), 'Task 2'),
      createTask('David Wilson', createDateAtHour(10), createDateAtHour(13, 30), 'Task 2'),
      createTask('Linda Thompson', createDateAtHour(14), createDateAtHour(18), 'Task 2'),
      
      // Task 3 - Multiple shorter tasks
      createTask('Alex Johnson', createDateAtHour(8), createDateAtHour(10), 'Task 3'),
      createTask('Thomas Brown', createDateAtHour(10, 15), createDateAtHour(12), 'Task 3'),
      createTask('Jessica Lee', createDateAtHour(12, 15), createDateAtHour(14, 45), 'Task 3'),
      createTask('Andrew Clark', createDateAtHour(15), createDateAtHour(18), 'Task 3'),
      
      // Task 4 - Distributed throughout the day
      createTask('Sarah Williams', createDateAtHour(8), createDateAtHour(9, 45), 'Task 4'),
      createTask('Olivia Green', createDateAtHour(10), createDateAtHour(13), 'Task 4'),
      createTask('Noah Adams', createDateAtHour(13, 15), createDateAtHour(16, 30), 'Task 4'),
      createTask('Maria Garcia', createDateAtHour(16, 45), createDateAtHour(18), 'Task 4'),
      
      // Task 5 - Mix of task durations
      createTask('William Baker', createDateAtHour(8), createDateAtHour(11), 'Task 5'),
      createTask('Emma White', createDateAtHour(11, 15), createDateAtHour(14, 30), 'Task 5'),
      createTask('James Robinson', createDateAtHour(15), createDateAtHour(18), 'Task 5'),
      
      // Task 6 - Even distribution
      createTask('Ava Harris', createDateAtHour(8), createDateAtHour(10, 45), 'Task 6'),
      createTask('Mason Clark', createDateAtHour(11), createDateAtHour(14), 'Task 6'),
      createTask('Sophia Lewis', createDateAtHour(14, 15), createDateAtHour(18), 'Task 6'),
      
      // Task 7 - Varied task lengths
      createTask('Ethan Walker', createDateAtHour(8), createDateAtHour(9), 'Task 7'),
      createTask('Charlotte Young', createDateAtHour(9, 15), createDateAtHour(12, 30), 'Task 7'),
      createTask('Liam Miller', createDateAtHour(13), createDateAtHour(16), 'Task 7'),
      createTask('Amelia Moore', createDateAtHour(16, 15), createDateAtHour(18), 'Task 7'),
      
      // Task 8 - Two long tasks
      createTask('Aiden Jackson', createDateAtHour(8), createDateAtHour(13), 'Task 8'),
      createTask('Isabella Allen', createDateAtHour(13, 30), createDateAtHour(18), 'Task 8'),
      
      // Task 9 - Multiple short tasks
      createTask('Lucas Thomas', createDateAtHour(8), createDateAtHour(9, 30), 'Task 9'),
      createTask('Mia King', createDateAtHour(9, 45), createDateAtHour(11, 30), 'Task 9'),
      createTask('Harper Scott', createDateAtHour(11, 45), createDateAtHour(13, 15), 'Task 9'),
      createTask('Jacob Wright', createDateAtHour(13, 30), createDateAtHour(15), 'Task 9'),
      createTask('Abigail Turner', createDateAtHour(15, 15), createDateAtHour(16, 30), 'Task 9'),
      createTask('Benjamin Hill', createDateAtHour(16, 45), createDateAtHour(18), 'Task 9'),
      
      // Task 10 - Three equal blocks
      createTask('Ella Evans', createDateAtHour(8), createDateAtHour(11, 20), 'Task 10'),
      createTask('Logan Carter', createDateAtHour(11, 30), createDateAtHour(14, 45), 'Task 10'),
      createTask('Grace Murphy', createDateAtHour(15), createDateAtHour(18), 'Task 10'),
    ];
    
    console.log('Setting initial tasks with consistent format:', initialTasks);
    setTasks(initialTasks);
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

  // Function to add a new random task
  const addTask = () => {
    // Random task duration between 1-3 hours
    const durationHours = Math.floor(Math.random() * 3) + 1;
    
    // Random start time between 8am and 5pm
    const startHour = Math.floor(Math.random() * 10) + 8;
    const startDate = new Date(today);
    startDate.setHours(startHour, 0, 0, 0);
    
    // Calculate end time
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + durationHours);
    
    // Format dates consistently
    const startTime = formatDateForTimeline(startDate);
    const endTime = formatDateForTimeline(endDate);
    
    // Random group (task row)
    const groupIndex = Math.floor(Math.random() * groups.length);
    const group = groups[groupIndex].id;
    
    // Random names list
    const names = [
      "Emily Taylor", "Michael Brown", "Jessica Lee", "David Wilson", 
      "Jennifer Martinez", "Daniel Anderson", "Sarah Johnson", "James Rodriguez",
      "Lisa Garcia", "Robert Smith", "Amanda Davis", "Christopher Jackson"
    ];
    
    // Choose a random name
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    // Create task with proper name and time display
    const newTask = createTask(randomName, startTime, endTime, group);
    
    console.log('Adding new task with consistent format:', newTask);
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Handle task updates (when moved or resized)
  const handleTimeChange = (event) => {
    console.log('Task updated:', event);
    
    if (!event || !event.id) return;
    
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === event.id) {
          // Make sure we're using the correct date format for display
          const startTime = formatTimeDisplay(event.start);
          const endTime = formatTimeDisplay(event.end);
          const timeDisplay = `${startTime}-${endTime}`;
          
          console.log(`Updating task ${task.id} with new time: ${timeDisplay}`);
          
          // Create a new task object with updated properties
          return {
            ...task,
            start: event.start,
            end: event.end,
            group: event.group || task.group,
            content: `${task.name} | ${timeDisplay}`
          };
        }
        return task;
      });
    });
  };

  // Get timeline reference after it's mounted
  const getTimelineRef = (ref) => {
    timelineRef.current = ref;
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
      
      {/* <div className="mb-4 flex space-x-2">
        <Button onClick={addTask}>Add Random Task</Button>
      </div> */}
      
      <div className="border rounded-lg overflow-hidden">
        <GanttTimeline
          items={tasks}
          groups={groups}
          options={options}
          className="h-[600px]"
          onTimeChange={handleTimeChange}
          getTimelineRef={getTimelineRef}
        />
      </div>
      
      <div className="mt-4 space-y-2">
        {/* <p className="text-sm text-gray-500">
          Drag tasks to move them, drag edges to resize, or use the button to add new tasks.
        </p> */}
        <p className="text-sm text-blue-500">
          Current task count: {tasks.length}
        </p>
      </div>
      
      <style jsx global>{`
        .task-item {
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