'use client';

import { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

const GanttTimeline = ({ 
  items = [], 
  groups = [], 
  options = {}, 
  className = '',
  onTimeChange,
  getTimelineRef
}) => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const itemsDatasetRef = useRef(null);
  const groupsDatasetRef = useRef(null);

  // Debug logging function with timestamps
  const logDebug = (title, data) => {
    // console.log(`⏰ ${new Date().toLocaleTimeString()} | 🔍 ${title}:`, data);
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
      
      // Register ALL possible timeline events to see which ones fire
      if (onTimeChange) {
        console.log('🔌 Registering ALL timeline events');
        
        // These events happen when items are moved/changed
        timelineRef.current.on('itemover', (props) => logDebug('📌 EVENT: itemover fired', props));
        timelineRef.current.on('itemout', (props) => logDebug('📌 EVENT: itemout fired', props));
        timelineRef.current.on('itemselect', (props) => logDebug('📌 EVENT: itemselect fired', props));
        timelineRef.current.on('timechange', (props) => logDebug('📌 EVENT: timechange fired', props));
        timelineRef.current.on('timechanged', (props) => logDebug('📌 EVENT: timechanged fired', props));
        
        timelineRef.current.on('click', (props) => logDebug('📌 EVENT: click fired', props));
        timelineRef.current.on('doubleClick', (props) => logDebug('📌 EVENT: doubleClick fired', props));
        timelineRef.current.on('contextmenu', (props) => logDebug('📌 EVENT: contextmenu fired', props));
        
        // Important! This is the main event for drag operations
        timelineRef.current.on('rangechange', (props) => logDebug('📌 EVENT: rangechange fired', props));
        timelineRef.current.on('rangechanged', (props) => logDebug('📌 EVENT: rangechanged fired', props));
        
        // Primary events for item operations
        timelineRef.current.on('drop', (props) => logDebug('📌 EVENT: drop fired', props));
        
        // These are the item manipulation events
        timelineRef.current.on('itemdrag', (props) => {
          logDebug('📌 EVENT: itemdrag fired', props);
        });
        
        timelineRef.current.on('itemdrop', (props) => {
          logDebug('📌 EVENT: itemdrop fired', props);
          if (props && props.item) {
            const updatedItem = itemsDatasetRef.current.get(props.item);
            if (updatedItem) {
              logDebug('Calling onTimeChange with item after drop', updatedItem);
              onTimeChange({
                id: updatedItem.id,
                start: updatedItem.start,
                end: updatedItem.end,
                group: updatedItem.group
              });
            }
          }
        });
        
        // The main move events
        timelineRef.current.on('itemMove', (props) => {
          logDebug('📌 EVENT: itemMove fired', props);
          if (props && props.item) {
            const updatedItem = itemsDatasetRef.current.get(props.item);
            if (updatedItem) {
              logDebug('Calling onTimeChange with item from itemMove', updatedItem);
              onTimeChange({
                id: updatedItem.id,
                start: updatedItem.start,
                end: updatedItem.end,
                group: updatedItem.group
              });
            }
          }
        });
        
        timelineRef.current.on('itemMoved', (props) => {
          logDebug('📌 EVENT: itemMoved fired', props);
          if (props && props.item) {
            const updatedItem = itemsDatasetRef.current.get(props.item);
            if (updatedItem) {
              logDebug('Calling onTimeChange with item from itemMoved', updatedItem);
              onTimeChange({
                id: updatedItem.id,
                start: updatedItem.start,
                end: updatedItem.end,
                group: updatedItem.group
              });
            }
          }
        });
        
        // For resizing operations
        timelineRef.current.on('itemAdd', (props) => {
          logDebug('📌 EVENT: itemAdd fired', props);
        });
        
        timelineRef.current.on('itemUpdate', (props) => {
          logDebug('📌 EVENT: itemUpdate fired', props);
          if (props && props.item) {
            const updatedItem = itemsDatasetRef.current.get(props.item);
            if (updatedItem) {
              logDebug('Calling onTimeChange with item from itemUpdate', updatedItem);
              onTimeChange({
                id: updatedItem.id,
                start: updatedItem.start,
                end: updatedItem.end,
                group: updatedItem.group
              });
            }
          }
        });
        
        timelineRef.current.on('itemUpdated', (props) => {
          logDebug('📌 EVENT: itemUpdated fired', props);
          if (props && props.item) {
            const updatedItem = itemsDatasetRef.current.get(props.item);
            if (updatedItem) {
              logDebug('Calling onTimeChange with item from itemUpdated', updatedItem);
              onTimeChange({
                id: updatedItem.id,
                start: updatedItem.start,
                end: updatedItem.end,
                group: updatedItem.group
              });
            }
          }
        });
      }
      
      // Make the timeline reference available to the parent component
      if (getTimelineRef) {
        // Pass the timeline reference AND the datasets to the parent
        getTimelineRef(timelineRef.current, itemsDatasetRef.current, groupsDatasetRef.current);
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

  // Listen for direct changes to the DataSet
  useEffect(() => {
    if (!itemsDatasetRef.current || !onTimeChange) return;
    
    const onChange = (event, properties) => {
      logDebug('📊 DataSet CHANGED event', { event, properties });
      
      // When items are directly updated in the dataset
      if (properties.items && properties.items.length > 0) {
        properties.items.forEach(itemId => {
          const updatedItem = itemsDatasetRef.current.get(itemId);
          if (updatedItem) {
            logDebug('DataSet item changed', updatedItem);
            onTimeChange({
              id: updatedItem.id,
              start: updatedItem.start,
              end: updatedItem.end,
              group: updatedItem.group
            });
          }
        });
      }
    };
    
    // Listen for changes directly on the DataSet
    itemsDatasetRef.current.on('update', onChange);
    
    return () => {
      if (itemsDatasetRef.current) {
        itemsDatasetRef.current.off('update', onChange);
      }
    };
  }, [onTimeChange]);

  // Update items when they change
  useEffect(() => {
    if (!timelineRef.current || !itemsDatasetRef.current) return;
    
    console.log('🔄 Items received for update:', JSON.stringify(items, null, 2));
    
    try {
      // Validate items before adding
      const validatedItems = items.map(item => {
        console.log('🔍 Validating item:', {
          id: item.id,
          start: item.start,
          end: item.end,
          startType: typeof item.start,
          endType: typeof item.end
        });
        
        // Ensure dates are in correct format
        return {
          ...item,
          start: item.start instanceof Date ? item.start.toISOString() : item.start,
          end: item.end instanceof Date ? item.end.toISOString() : item.end
        };
      });
      
      // Clear and add all items
      itemsDatasetRef.current.clear();
      itemsDatasetRef.current.add(validatedItems);
      
      console.log('✅ Items after validation:', JSON.stringify(validatedItems, null, 2));
    } catch (error) {
      console.error('❌ Error updating items:', error);
      console.error('Problematic items:', JSON.stringify(items, null, 2));
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