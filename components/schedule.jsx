'use client';

import { useState, useEffect } from 'react';
import GanttTimeline from '@/components/vis-timeline'; // Adjust path as needed
import { Button } from '@/components/ui/button'; // Assuming this exists

export default function GanttChartPage() {
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

  // Define the task groups (rows in the Gantt chart)
  const [groups] = useState([
    { id: 'Task 0', content: 'Task 0' },
    { id: 'Task 1', content: 'Task 1' },
    { id: 'Task 2', content: 'Task 2' },
    { id: 'Task 3', content: 'Task 3' },
    { id: 'Task 4', content: 'Task 4' },
    { id: 'Task 5', content: 'Task 5' },
    { id: 'Task 6', content: 'Task 6' },
    { id: 'Task 7', content: 'Task 7' },
    { id: 'Task 8', content: 'Task 8' },
    { id: 'Task 9', content: 'Task 9' },
    { id: 'Task 10', content: 'Task 10' }
  ]);

  const colors = { bg: '#18181b', border: '#18181b' };
  
  // State for tasks - start with empty array
  const [tasks, setTasks] = useState([]);
  
  // Initialize tasks with consistent date format after component mounts
  useEffect(() => {
    // Sample tasks with specific start and end times
    const initialTasks = [
      {
        id: 'task1',
        group: 'Task 0',
        content: 'Benjamin Griepp | 8:00-11:30',
        start: createDateAtHour(8),
        end: createDateAtHour(11, 30),
        className: 'task-item',
        style: ``
      },
      {
        id: 'task2',
        group: 'Task 1',
        content: 'Item 1',
        start: createDateAtHour(10),
        end: createDateAtHour(16),
        className: 'task-item',
        style: ``
      },
      {
        id: 'task3',
        group: 'Task 2',
        content: 'Item 2',
        start: createDateAtHour(13),
        end: createDateAtHour(15, 30),
        className: 'task-item',
        style: ``
      },
      {
        id: 'task4',
        group: 'Task 3',
        content: 'Item 3',
        start: createDateAtHour(9, 30),
        end: createDateAtHour(12),
        className: 'task-item',
        style: ``
      },
      {
        id: 'task5',
        group: 'Task 4',
        content: 'Item 4',
        start: createDateAtHour(11),
        end: createDateAtHour(14),
        className: 'task-item',
        style: ``
      }
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
    showMajorLabels: true,
    showMinorLabels: true,
    orientation: 'top',
    timeAxis: { scale: 'hour', step: 1 },
    zoomable: false
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
    
    // Create new task with string ID
    const newTask = {
      id: `task${Date.now()}`, // String ID to ensure consistency
      group: group,
      content: `Item ${tasks.length}`,
      start: startTime,
      end: endTime,
      className: 'task-item',
    };
    
    console.log('Adding new task with consistent format:', newTask);
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Hourly Gantt Chart</h1>
      
      <div className="mb-4 flex space-x-2">
        <Button onClick={addTask}>Add Random Task</Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <GanttTimeline
          items={tasks}
          groups={groups}
          options={options}
          className="h-[600px]"
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-500">
          Drag tasks to move them, drag edges to resize, or use the button to add new tasks.
        </p>
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
        }
        .vis-item.vis-selected {
          border-color: #FFA500;
          box-shadow: 0 0 5px rgba(255,165,0,0.5);
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