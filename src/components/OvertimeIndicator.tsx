import React, { useState } from 'react';
import type { DailyHoursDto } from '../api/bi-service';

interface OvertimeIndicatorProps {
  dailyHours: DailyHoursDto[];
}

const OVERTIME_THRESHOLD = 10;

const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h:${minutes.toString().padStart(2, '0')}m`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const OvertimeIndicator: React.FC<OvertimeIndicatorProps> = ({ dailyHours }) => {
  const [isHovered, setIsHovered] = useState(false);

  const overtimeDays = dailyHours.filter(day => day.hours > OVERTIME_THRESHOLD);
  const hasOvertime = overtimeDays.length > 0;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: hasOvertime ? '#dc3545' : '#6c757d',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        i
      </div>

      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            whiteSpace: 'nowrap',
          }}
        >
          {dailyHours.map((day, index) => (
            <div
              key={index}
              style={{
                padding: '2px 0',
                fontSize: '14px',
                color: day.hours > OVERTIME_THRESHOLD ? '#dc3545' : '#333',
                fontWeight: day.hours > OVERTIME_THRESHOLD ? 'bold' : 'normal'
              }}
            >
              {formatDate(day.date)}: {formatHours(day.hours)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
