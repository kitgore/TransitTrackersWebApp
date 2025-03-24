'use client';

import { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

const GanttTimeline = ({ items = [], groups = [], options = {}, className = '' }) => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const itemsDatasetRef = useRef(null);
  const groupsDatasetRef = useRef(null);

  // Debug logging function
  const logDebug = (title, data) => {
    console.log(`🔍 ${title}:`, data);
  };

  // Create timeline on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    logDebug('Creating timeline with container', containerRef.current);
    
    // Create DataSets
    itemsDatasetRef.current = new DataSet();
    groupsDatasetRef.current = new DataSet();
    
    // Default options
    const defaultOptions = {
      stack: true,
      editable: {
        add: true,
        updateTime: true,
        updateGroup: true,
        remove: true
      },
      timeAxis: { scale: 'hour', step: 1 },
      zoomMin: 1000 * 60 * 60,
      zoomMax: 1000 * 60 * 60 * 24 * 31,
      showCurrentTime: true,
      format: {
        minorLabels: {
          minute: 'h:mma',
          hour: 'ha'
        },
        majorLabels: {
          hour: 'ddd D MMM',
          day: 'ddd D MMM'
        }
      },
      height: '100%',
      autoResize: true,
      stack: true,
      groupEditable: true,
      horizontalScroll: true,
      zoomable: false
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Create timeline
      timelineRef.current = new Timeline(
        containerRef.current,
        itemsDatasetRef.current,
        groupsDatasetRef.current,
        mergedOptions
      );
      
      // Set initial window
      if (options.min && options.max) {
        timelineRef.current.setWindow(options.min, options.max, { animation: false });
      }
      
      logDebug('Timeline created successfully', timelineRef.current);
    } catch (error) {
      console.error('Error initializing timeline:', error);
    }
    
    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, []);

  // Update items when they change
  useEffect(() => {
    if (!timelineRef.current || !itemsDatasetRef.current) return;
    
    logDebug('Items received', items);
    
    try {
      // Log current items before updating
      const currentItems = itemsDatasetRef.current.get();
      logDebug('Current items before update', currentItems);
      
      // Clear and add all items
      itemsDatasetRef.current.clear();
      
      // Log each item as we add it
      items.forEach((item, index) => {
        logDebug(`Adding item ${index}`, item);
        try {
          itemsDatasetRef.current.add(item);
        } catch (err) {
          console.error(`Error adding item ${index}:`, err, item);
        }
      });
      
      // Log items after update
      const updatedItems = itemsDatasetRef.current.get();
      logDebug('Items after update', updatedItems);
      
    } catch (error) {
      console.error('Error updating items:', error);
    }
  }, [items]);

  // Update groups when they change
  useEffect(() => {
    if (!timelineRef.current || !groupsDatasetRef.current) return;
    
    logDebug('Groups received', groups);
    
    try {
      // Clear and add all groups
      groupsDatasetRef.current.clear();
      groupsDatasetRef.current.add(groups);
      
      logDebug('Groups after update', groupsDatasetRef.current.get());
    } catch (error) {
      console.error('Error updating groups:', error);
    }
  }, [groups]);

  // Update options when they change
  useEffect(() => {
    if (!timelineRef.current) return;
    
    logDebug('Options received', options);
    
    try {
      // Set options
      timelineRef.current.setOptions(options);
      
      // Explicitly set window if provided
      if (options.min && options.max) {
        timelineRef.current.setWindow(options.min, options.max, { animation: false });
      }
    } catch (error) {
      console.error('Error updating options:', error);
    }
  }, [options]);

  return (
    <div 
      ref={containerRef} 
      className={`gantt-timeline-container ${className}`} 
      style={{ width: '100%', height: '500px' }}
    />
  );
};

export default GanttTimeline;