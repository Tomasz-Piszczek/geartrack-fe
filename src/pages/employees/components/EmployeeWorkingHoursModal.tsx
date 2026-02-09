import React, { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '../../../api/payroll';

interface EmployeeWorkingHoursModalProps {
  show: boolean;
  onClose: () => void;
  employeeName: string;
}

const EmployeeWorkingHoursModal: React.FC<EmployeeWorkingHoursModalProps> = ({
  show,
  onClose,
  employeeName,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [selectedYearMonth, setSelectedYearMonth] = useState<{ year: number; month: number } | null>(null);

  const years = [currentYear, currentYear - 1, currentYear - 2];
  const months = [
    { value: 1, label: 'Styczeń' },
    { value: 2, label: 'Luty' },
    { value: 3, label: 'Marzec' },
    { value: 4, label: 'Kwiecień' },
    { value: 5, label: 'Maj' },
    { value: 6, label: 'Czerwiec' },
    { value: 7, label: 'Lipiec' },
    { value: 8, label: 'Sierpień' },
    { value: 9, label: 'Wrzesień' },
    { value: 10, label: 'Październik' },
    { value: 11, label: 'Listopad' },
    { value: 12, label: 'Grudzień' }
  ];

  const { data: workingHoursData } = useQuery({
    queryKey: ['employee-working-hours', employeeName, selectedYearMonth?.year, selectedYearMonth?.month],
    queryFn: () => selectedYearMonth
      ? payrollApi.getEmployeeWorkingHours(employeeName, selectedYearMonth.year, selectedYearMonth.month)
      : Promise.resolve(null),
    enabled: !!selectedYearMonth && show,
  });

  const toggleYear = (year: number) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const toggleMonth = (year: number, month: number) => {
    const key = `${year}-${month}`;
    const isCurrentlyExpanded = expandedMonths[key];

    setExpandedMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    if (!isCurrentlyExpanded) {
      setSelectedYearMonth({ year, month });
    }
  };

  const formatHours = (decimal: number): string => {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours}h:${minutes}m`;
  };

  const formatTime = (dateTimeString: string): string => {
    return new Date(dateTimeString).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <Modal.Header className="bg-section-grey border-lighter-border">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white" />
          <span className="text-white">Sprawdź godziny - {employeeName}</span>
        </div>
      </Modal.Header>
      <Modal.Body className="bg-section-grey max-h-[70vh] overflow-y-auto">
        <div className="space-y-2">
          {years.map(year => (
            <div key={year} className="bg-section-grey-light rounded-lg overflow-hidden">
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center justify-between p-4 hover:bg-section-grey-light/70 transition-colors"
              >
                <span className="text-white font-semibold text-lg">{year}</span>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform duration-200 ${expandedYears[year] ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedYears[year] && (
                <div className="px-4 pb-4 space-y-2">
                  {months.map(month => {
                    const key = `${year}-${month.value}`;
                    const isExpanded = expandedMonths[key];
                    const isLoading = isExpanded && selectedYearMonth?.year === year && selectedYearMonth?.month === month.value && !workingHoursData;

                    return (
                      <div key={month.value} className="bg-section-grey rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleMonth(year, month.value)}
                          className="w-full flex items-center justify-between p-3 hover:bg-section-grey-light/50 transition-colors"
                        >
                          <span className="text-white">{month.label}</span>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-lighter-border">
                            {isLoading ? (
                              <div className="flex justify-center py-4">
                                <div className="spinner"></div>
                              </div>
                            ) : workingHoursData ? (
                              <div className="mt-3 space-y-3">
                                <div className="bg-section-grey-light rounded-lg p-3">
                                  <div className="text-white font-semibold mb-2">Podsumowanie:</div>
                                  <div className="text-gray-300">
                                    Suma godzin: <span className="text-white font-semibold">{workingHoursData.totalHours}h</span>
                                  </div>
                                </div>

                                {workingHoursData.dailyBreakdown && workingHoursData.dailyBreakdown.length > 0 && (
                                  <div className="bg-section-grey-light rounded-lg p-3">
                                    <div className="text-white font-semibold mb-2">Dzienne godziny:</div>
                                    <div className="space-y-1 max-h-96 overflow-y-auto">
                                      {workingHoursData.dailyBreakdown.map((day, idx) => (
                                        <div
                                          key={idx}
                                          className={`text-sm p-2 rounded ${day.actualHours > 10 ? 'bg-red-900/30 text-red-400' : 'text-gray-300'}`}
                                        >
                                          <div className="flex justify-between items-center">
                                            <span className="font-medium">{formatDate(day.date)}</span>
                                            <span className="text-xs">
                                              {formatHours(day.actualHours)} ({day.roundedHours}h)
                                            </span>
                                          </div>
                                          {day.startTime && day.endTime && (
                                            <div className="text-xs mt-1">
                                              <span className="text-emerald-400">wejście:</span> {formatTime(day.startTime)}
                                              {' '}
                                              <span className="text-amber-400">wyjście:</span> {formatTime(day.endTime)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {workingHoursData.urlopBreakdown && workingHoursData.urlopBreakdown.length > 0 && (
                                  <div className="bg-section-grey-light rounded-lg p-3">
                                    <div className="text-white font-semibold mb-2">Urlopy:</div>
                                    <div className="space-y-1">
                                      {workingHoursData.urlopBreakdown.map((urlop, idx) => (
                                        <div key={idx} className="text-sm text-gray-300 flex justify-between">
                                          <span>{urlop.category}</span>
                                          <span>{urlop.totalHours}h × {urlop.rate}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm py-4 text-center">
                                Brak danych dla tego miesiąca
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-section-grey border-lighter-border">
        <Button color="gray" onClick={onClose}>
          Zamknij
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmployeeWorkingHoursModal;
