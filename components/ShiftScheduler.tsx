import React from 'react';
// ensure the CSS is correctly linked
import '/src/app/ShiftScheduler.css'; 

const ShiftBlock = ({ hour }) => {
  return (
    <div className="shift-block">Open Shift</div>
  );
};

const ShiftScheduler = () => {
    const hours = Array.from({ length: 17 }, (_, i) => {
        let hour = 6 + i;
        let period = hour >= 12 ? "PM" : "AM";
        // convert to 12-hour format
        let formattedHour = hour > 12 ? hour - 12 : hour; 
        return `${formattedHour}:00 ${period}`;
      });
      
  const buses = Array.from({ length: 15 }, (_, i) => `Bus ${i + 1}`); // 15 buses

  return (
    <div className="scheduler-container">
      <div className="bus-column">
        {/* Empty div for the top-left corner */}
        <div className="time-header"></div> 
        {buses.map(bus => (
          <div key={bus} className="bus-label">{bus}</div>
        ))}
      </div>
      <div className="scheduler">
        <div className="header">
          {hours.map(hour => (
            <div key={hour} className="time-header">{hour}</div>
          ))}
        </div>
        <div className="shifts-container">
          {buses.map(bus => (
            <div key={bus} className="shift-row">
              {hours.map(hour => (
                <ShiftBlock key={`${bus}-${hour}`} hour={hour} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShiftScheduler;
