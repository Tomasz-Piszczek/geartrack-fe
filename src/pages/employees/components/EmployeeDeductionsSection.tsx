import React, { useState } from 'react';
import { HiCurrencyDollar } from 'react-icons/hi';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../../components/common/Card';
import { useQuery } from '@tanstack/react-query';
import { payrollApi, type PayrollDeductionDto } from '../../../api/payroll';

interface EmployeeDeductionsSectionProps {
  employeeId: string;
  isAdmin: boolean;
}

const EmployeeDeductionsSection: React.FC<EmployeeDeductionsSectionProps> = ({ employeeId, isAdmin }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  const { data: employeeDeductions = [], isLoading: isLoadingDeductions } = useQuery({
    queryKey: ['payroll-deductions', employeeId],
    queryFn: () => payrollApi.getEmployeeDeductions(employeeId),
    enabled: !!employeeId && isAdmin,
  });

  const groupDeductionsByYearAndCategory = () => {
    const grouped = employeeDeductions.reduce((acc: Record<string, Record<string, PayrollDeductionDto[]>>, deduction) => {
      const year = deduction.createdAt ? new Date(deduction.createdAt).getFullYear().toString() : 'Unknown';
      const category = deduction.category;

      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][category]) {
        acc[year][category] = [];
      }
      acc[year][category].push(deduction);
      return acc;
    }, {});

    return grouped;
  };

  const calculateTotalDeductions = () => {
    return employeeDeductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  };

  const toggleYearExpanded = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const toggleCategoryExpanded = (year: string, category: string) => {
    const key = `${year}-${category}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Obciążenia płacowe</h2>
          <p className="text-surface-grey-dark">
            Historia obciążeń pracownika
          </p>
        </div>
      </div>

      {isLoadingDeductions ? (
        <div className="flex justify-center items-center h-32">
          <div className="spinner"></div>
        </div>
      ) : employeeDeductions.length === 0 ? (
        <Card className="text-center py-12">
          <HiCurrencyDollar className="w-16 h-16 mx-auto mb-4 opacity-50 text-surface-grey-dark" />
          <p className="text-lg text-surface-grey-dark">Brak obciążeń płacowych</p>
          <p className="text-sm text-surface-grey">Obciążenia będą widoczne po dodaniu w wypłatach</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupDeductionsByYearAndCategory())
            .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
            .map(([year, categories]) => {
              const yearTotal = Object.values(categories).flat().reduce((sum, d) => sum + d.amount, 0);
              const yearDeductionsCount = Object.values(categories).flat().length;

              return (
                <Card key={year} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between cursor-pointer p-4 hover:bg-section-grey-light/50 transition-colors"
                    onClick={() => toggleYearExpanded(year)}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{year}</h3>
                      <p className="text-surface-grey text-sm">
                        {yearDeductionsCount} {yearDeductionsCount === 1 ? 'obciążenie' : 'obciążeń'} •
                        Suma: {yearTotal.toFixed(2)} PLN
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold text-lg">
                        -{yearTotal.toFixed(2)} PLN
                      </span>
                      {expandedYears[year] ? (
                        <ChevronUp className="w-5 h-5 text-surface-grey" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-surface-grey" />
                      )}
                    </div>
                  </div>

                  {expandedYears[year] && (
                    <div className="border-t border-lighter-border p-4 space-y-3">
                      {Object.entries(categories).map(([category, deductions]) => (
                        <Card key={`${year}-${category}`} className="overflow-hidden">
                          <div
                            className="flex items-center justify-between cursor-pointer p-4 hover:bg-section-grey-light/50 transition-colors"
                            onClick={() => toggleCategoryExpanded(year, category)}
                          >
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">{category}</h3>
                              <p className="text-surface-grey text-sm">
                                {deductions.length} {deductions.length === 1 ? 'obciążenie' : 'obciążeń'} •
                                Suma: {deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} PLN
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-semibold">
                                -{deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} PLN
                              </span>
                              {expandedCategories[`${year}-${category}`] ? (
                                <ChevronUp className="w-5 h-5 text-surface-grey" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-surface-grey" />
                              )}
                            </div>
                          </div>

                          {expandedCategories[`${year}-${category}`] && (
                            <div className="border-t border-lighter-border">
                              {deductions.map((deduction) => (
                                <div key={deduction.id} className="p-4 border-b border-lighter-border last:border-b-0 hover:bg-section-grey-light/30 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      {deduction.note && (
                                        <p className="text-white font-medium mb-1">{deduction.note}</p>
                                      )}
                                      <p className="text-surface-grey text-sm">
                                        Kategoria: {deduction.category}
                                      </p>
                                      {deduction.createdAt && (
                                        <p className="text-surface-grey text-xs mt-1">
                                          Data utworzenia: {new Date(deduction.createdAt).toLocaleDateString('pl-PL')}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <span className="text-red-400 font-bold text-lg">
                                        -{deduction.amount.toFixed(2)} PLN
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}

          {/* Total Summary */}
          <Card className="bg-section-grey-light border-2 border-red-900/50">
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="text-xl font-bold text-white">Suma wszystkich obciążeń</h3>
                <p className="text-surface-grey">
                  {employeeDeductions.length} {employeeDeductions.length === 1 ? 'obciążenie' : 'obciążeń'} w sumie
                </p>
              </div>
              <div className="text-right">
                <span className="text-red-400 font-bold text-2xl">
                  -{calculateTotalDeductions().toFixed(2)} PLN
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeDeductionsSection;
