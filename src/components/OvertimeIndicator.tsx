import React, { useState, useRef } from 'react';
import type { DailyHoursDto } from '../api/bi-service';

interface OvertimeIndicatorProps {
  dailyHours: DailyHoursDto[];
  roundDailyHours?: (hours: number) => number;
  calculateActualTotalHours?: (dailyHours: DailyHoursDto[]) => number;
  calculateRoundedTotalHours?: (dailyHours: DailyHoursDto[]) => number;
}

const OVERTIME_THRESHOLD = 10;
const HIDE_DELAY_MS = 300;

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

export const OvertimeIndicator: React.FC<OvertimeIndicatorProps> = ({
  dailyHours,
  roundDailyHours,
  calculateActualTotalHours,
  calculateRoundedTotalHours
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const overtimeDays = dailyHours.filter(day => day.hours > OVERTIME_THRESHOLD);
  const hasOvertime = overtimeDays.length > 0;

  const actualTotal = calculateActualTotalHours ? calculateActualTotalHours(dailyHours) : null;
  const roundedTotal = calculateRoundedTotalHours ? calculateRoundedTotalHours(dailyHours) : null;

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      hideTimeoutRef.current = null;
    }, HIDE_DELAY_MS);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
            minWidth: '250px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Szczegółowe godziny:
            </div>
            {dailyHours.map((day, index) => (
              <div
                key={index}
                style={{
                  padding: '2px 0',
                  fontSize: '14px',
                  color: day.hours > OVERTIME_THRESHOLD ? '#dc3545' : '#333',
                  fontWeight: day.hours > OVERTIME_THRESHOLD ? 'bold' : 'normal',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{formatDate(day.date)}:</span>
                <span style={{ marginLeft: '12px' }}>
                  {formatHours(day.hours)}
                  {roundDailyHours && (
                    <span style={{ color: '#666', fontSize: '12px', marginLeft: '4px' }}>
                      ({roundDailyHours(day.hours)}h)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {(actualTotal !== null || roundedTotal !== null) && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
              {actualTotal !== null && (
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                  Suma rzeczywista: {formatHours(actualTotal)}
                </div>
              )}
              {roundedTotal !== null && (
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                  Suma zaokrąglona: {roundedTotal}h
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
