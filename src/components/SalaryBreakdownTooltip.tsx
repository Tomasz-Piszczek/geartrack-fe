import React, { useState, useRef } from 'react';
import type { PayrollRecordDto, DailyUrlopDto } from '../api/payroll';

interface SalaryBreakdownTooltipProps {
  record: PayrollRecordDto;
  dailyUrlopy?: DailyUrlopDto[];
}

const HIDE_DELAY_MS = 300;

export const SalaryBreakdownTooltip: React.FC<SalaryBreakdownTooltipProps> = ({
  record,
  dailyUrlopy
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Calculate worked hours total
  const workedHoursTotal = record.hoursWorked * record.hourlyRate;

  // Group urlopy by type and calculate totals
  const urlopyByType = (dailyUrlopy || []).reduce((acc, urlop) => {
    if (!acc[urlop.urlopName]) {
      acc[urlop.urlopName] = { hours: 0, rate: urlop.rate };
    }
    acc[urlop.urlopName].hours += urlop.hours;
    return acc;
  }, {} as Record<string, { hours: number; rate: number }>);

  // Calculate urlopy totals
  const urlopyTotals = Object.entries(urlopyByType).map(([name, data]) => ({
    name: name.replace(/_/g, ' '),
    hours: data.hours,
    rate: data.rate,
    total: data.hours * record.hourlyRate * data.rate
  }));

  // Calculate deductions total
  const deductionsTotal = record.payrollDeductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

  // Calculate grand total
  const urlopyGrandTotal = urlopyTotals.reduce((sum, u) => sum + u.total, 0);
  const grandTotal = workedHoursTotal + urlopyGrandTotal + record.bonus + record.sickLeavePay - deductionsTotal;

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
          backgroundColor: '#17a2b8',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        PLN
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
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '320px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>
            Rozliczenie wynagrodzenia
          </div>

          {/* Worked hours */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#333' }}>
            <span>Godziny przepracowane:</span>
            <span>{record.hoursWorked}h x {record.hourlyRate} PLN/h = <strong>{workedHoursTotal.toFixed(2)} PLN</strong></span>
          </div>

          {/* Urlopy */}
          {urlopyTotals.map((urlop, index) => (
            <div
              key={index}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#17a2b8' }}
            >
              <span>{urlop.name}:</span>
              <span>{urlop.hours}h x {record.hourlyRate} PLN/h x {Math.round(urlop.rate * 100)}% = <strong>{urlop.total.toFixed(2)} PLN</strong></span>
            </div>
          ))}

          {/* Sick leave */}
          {record.sickLeavePay > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#6f42c1' }}>
              <span>Chorobowe:</span>
              <span>+<strong>{record.sickLeavePay.toFixed(2)} PLN</strong></span>
            </div>
          )}

          {/* Bonus */}
          {record.bonus > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#28a745' }}>
              <span>Premia:</span>
              <span>+<strong>{record.bonus.toFixed(2)} PLN</strong></span>
            </div>
          )}

          {/* Deductions */}
          {deductionsTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#dc3545' }}>
              <span>Potracenia:</span>
              <span>-<strong>{deductionsTotal.toFixed(2)} PLN</strong></span>
            </div>
          )}

          {/* Grand total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#333', borderTop: '2px solid #333', marginTop: '8px' }}>
            <span>SUMA:</span>
            <span>{grandTotal.toFixed(2)} PLN</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryBreakdownTooltip;
