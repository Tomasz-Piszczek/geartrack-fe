import React, {useEffect, useState} from 'react';
import {HiSave} from 'react-icons/hi';
import {ChevronDown, Plus, X, Trash2} from 'lucide-react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {payrollApi, type PayrollDeductionDto, type PayrollRecordDto} from '../../api/payroll';
import { biServiceApi } from '../../api/bi-service';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Autocomplete from '../../components/common/Autocomplete';
import {toast} from '../../lib/toast';

const PayrollPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [payrollData, setPayrollData] = useState<PayrollRecordDto[]>([]);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showEditDeductionModal, setShowEditDeductionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecordDto | null>(null);
  const [selectedDeduction, setSelectedDeduction] = useState<PayrollDeductionDto | null>(null);
  const [deductionForm, setDeductionForm] = useState({
    category: '',
    note: '',
    amount: 0
  });
  const [editDeductionForm, setEditDeductionForm] = useState({
    category: '',
    note: '',
    amount: 0
  });
  const [expandedDeductions, setExpandedDeductions] = useState<Record<string, boolean>>({});
  const [hoveredDeduction, setHoveredDeduction] = useState<string | null>(null);
  const [hoveredSummary, setHoveredSummary] = useState<string | null>(null);
  const [editingHours, setEditingHours] = useState<Record<string, string>>({});

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

  const years = [];
  for (let year = 2025; year <= 2026; year++) {
    years.push(year);
  }

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['payroll', selectedYear, selectedMonth],
    queryFn: () => payrollApi.getPayrollRecords(selectedYear, selectedMonth),
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['payroll-categories'],
    queryFn: () => payrollApi.getCategories(),
  });

  const saveMutation = useMutation({
    mutationFn: (records: PayrollRecordDto[]) => payrollApi.savePayrollRecords(records, selectedYear, selectedMonth),
    onSuccess: () => {
      toast.success('Wypłaty zostały zapisane');
      refetch();
      refetchCategories();
    },
    onError: () => {
      toast.error('Błąd podczas zapisywania wypłat');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (category: string) => payrollApi.deleteCategory(category),
    onSuccess: () => {
      toast.success('Kategoria została usunięta');
      refetch();
      refetchCategories();
    },
    onError: () => {
      toast.error('Błąd podczas usuwania kategorii');
    },
  });


  useEffect(() => {
    const fetchHoursFromBiAnalytics = async () => {
      if (!records) return;

      const employeeNamesToFetch = records
        .filter(record => (!record.hoursWorked || record.hoursWorked === 0) && record.employeeName)
        .map(record => record.employeeName);

      let hoursMap: Record<string, number> = {};

      if (employeeNamesToFetch.length > 0) {
        try {
          const hoursDataList = await biServiceApi.getEmployeeHours(employeeNamesToFetch, selectedYear, selectedMonth);
          hoursMap = hoursDataList.reduce((acc, hoursData) => {
            acc[hoursData.employeeName] = hoursData.hours;
            return acc;
          }, {} as Record<string, number>);
        } catch (error) {
          console.error('Failed to fetch hours for employees:', error);
        }
      }

      const updatedRecords = records.map(record => {
        const deductionsTotal = record.payrollDeductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
        const hoursWorked = hoursMap[record.employeeName] || record.hoursWorked || 0;

        return {
          ...record,
          hoursWorked,
          deductions: deductionsTotal,
          cashAmount: calculateCashAmount({ ...record, hoursWorked })
        };
      });

      setPayrollData(updatedRecords);
    };

    fetchHoursFromBiAnalytics();
  }, [records, selectedYear, selectedMonth]);

  const calculateCashAmount = (record: PayrollRecordDto): number => {
    const deductionsTotal = record.payrollDeductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const total = (record.hoursWorked * record.hourlyRate) + record.bonus + record.sickLeavePay - deductionsTotal - record.bankTransfer;
    return Math.max(0, total);
  };

  const parseTimeToDecimal = (timeString: string): number => {
    if (!timeString || timeString.trim() === '') return 0;

    const parts = timeString.split(':');

    // If just a number without colon, treat it as hours
    if (parts.length === 1) {
      const hours = parseInt(parts[0], 10) || 0;
      return hours;
    }

    // If HH:MM format
    if (parts.length === 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      return hours + (minutes / 60);
    }

    return 0;
  };

  const formatDecimalToTime = (decimal: number): string => {
    const totalMinutes = Math.round(decimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  const updateRecord = (index: number, field: keyof PayrollRecordDto, value: number | string) => {
    const updated = [...payrollData];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].deductions = updated[index].payrollDeductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    updated[index].cashAmount = calculateCashAmount(updated[index]);
    setPayrollData(updated);
  };

  const handleSave = () => {
    saveMutation.mutate(payrollData);
  };

  const openDeductionModal = (record: PayrollRecordDto) => {
    setSelectedRecord(record);
    setDeductionForm({
      category: '',
      note: '',
      amount: 0
    });
    setShowDeductionModal(true);
  };

  const closeDeductionModal = () => {
    setShowDeductionModal(false);
    setSelectedRecord(null);
    setDeductionForm({
      category: '',
      note: '',
      amount: 0
    });
  };

  const handleCreateDeduction = () => {
    if (!selectedRecord) return;

    const newDeduction: PayrollDeductionDto = {
      id: Date.now().toString(), // Temporary ID
      category: deductionForm.category,
      note: deductionForm.note,
      amount: deductionForm.amount
    };

    const updatedData = payrollData.map(record => {
      if (record.employeeId === selectedRecord.employeeId) {
        const updatedDeductions = [...(record.payrollDeductions || []), newDeduction];
        const deductionsTotal = updatedDeductions.reduce((sum, d) => sum + d.amount, 0);
        return {
          ...record,
          payrollDeductions: updatedDeductions,
          deductions: deductionsTotal,
          cashAmount: calculateCashAmount({...record, deductions: deductionsTotal})
        };
      }
      return record;
    });

    setPayrollData(updatedData);
    saveMutation.mutate(updatedData);
    toast.success('Obciążenie zostało dodane');
    closeDeductionModal();
  };

  const handleDeleteDeduction = (deductionId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to obciążenie?')) {
      const updatedData = payrollData.map(record => {
        const updatedDeductions = (record.payrollDeductions || []).filter(d => d.id !== deductionId);
        const deductionsTotal = updatedDeductions.reduce((sum, d) => sum + d.amount, 0);
        return {
          ...record,
          payrollDeductions: updatedDeductions,
          deductions: deductionsTotal,
          cashAmount: calculateCashAmount({...record, deductions: deductionsTotal})
        };
      });

      setPayrollData(updatedData);
      saveMutation.mutate(updatedData);
      toast.success('Obciążenie zostało usunięte');
    }
  };

  const toggleDeductionsExpanded = (employeeId: string) => {
    setExpandedDeductions(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const openEditDeductionModal = (deduction: PayrollDeductionDto) => {
    if (!deduction.id) return;
    setSelectedDeduction(deduction);
    setEditDeductionForm({
      category: deduction.category,
      note: deduction.note || '',
      amount: deduction.amount
    });
    setShowEditDeductionModal(true);
  };

  const closeEditDeductionModal = () => {
    setShowEditDeductionModal(false);
    setSelectedDeduction(null);
    setEditDeductionForm({
      category: '',
      note: '',
      amount: 0
    });
  };

  const handleUpdateDeduction = () => {
    if (!selectedDeduction) return;

    // Update deduction in local state
    const updatedData = payrollData.map(record => {
      const updatedDeductions = (record.payrollDeductions || []).map(d =>
        d.id === selectedDeduction.id ? {
          ...d,
          category: editDeductionForm.category,
          note: editDeductionForm.note,
          amount: editDeductionForm.amount
        } : d
      );
      const deductionsTotal = updatedDeductions.reduce((sum, d) => sum + d.amount, 0);
      return {
        ...record,
        payrollDeductions: updatedDeductions,
        deductions: deductionsTotal,
        cashAmount: calculateCashAmount({...record, deductions: deductionsTotal})
      };
    });

    setPayrollData(updatedData);
    saveMutation.mutate(updatedData);
    toast.success('Obciążenie zostało zaktualizowane');
    closeEditDeductionModal();
  };

  const handleDeleteCategory = (category: string) => {
    if (window.confirm(
      `Czy na pewno chcesz usunąć kategorię "${category}"?\n\n` +
      `To spowoduje usunięcie wszystkich obciążeń z tą kategorią`
    )) {
      deleteCategoryMutation.mutate(category);
      setShowCategoryModal(false);
    }
  };

  const totalCash = payrollData.reduce((sum, record) => sum + record.cashAmount, 0);
  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label || '';
  
  // Prepare categories for autocomplete
  const categoryOptions = categories.map(category => ({
    value: category,
    label: category,
  }));

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wypłaty</h1>
        </div>
      </div>

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Rok</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-3 border border-lighter-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green"
            style={{backgroundColor: '#343434', color: '#FFFFFF'}}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Miesiąc</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-3 border border-lighter-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green"
            style={{backgroundColor: '#343434', color: '#FFFFFF'}}
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
        <Button
          color="gray"
          onClick={() => setShowCategoryModal(true)}
        >
          Kategorie Obciążeń
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="bg-section-grey rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-section-grey-light border-b border-lighter-border">
                <tr>
                  <th className="px-4 py-3 text-white font-medium text-center">Pracownik</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Stawka PLN/h</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Liczba godzin</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Premia</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Chorobowe</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Obciążenia</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Na konto</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Gotówka</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((record, index) => (
                  <tr key={record.employeeId} className="border-b border-lighter-border hover:bg-section-grey-light/50">
                    <td className="px-4 py-3 text-white text-center">{record.employeeName}</td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.hourlyRate || ''}
                        onChange={(e) => updateRecord(index, 'hourlyRate', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="w-24 mx-auto"
                        style={{backgroundColor: '#343434'}}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="text"
                        value={editingHours[record.employeeId] !== undefined
                          ? editingHours[record.employeeId]
                          : (record.hoursWorked > 0 ? formatDecimalToTime(record.hoursWorked) : '')}
                        onChange={(e) => {
                          setEditingHours(prev => ({
                            ...prev,
                            [record.employeeId]: e.target.value
                          }));
                        }}
                        onBlur={(e) => {
                          const decimal = parseTimeToDecimal(e.target.value);
                          updateRecord(index, 'hoursWorked', decimal);
                          setEditingHours(prev => {
                            const newState = {...prev};
                            delete newState[record.employeeId];
                            return newState;
                          });
                        }}
                        placeholder="0:00"
                        className="w-24 mx-auto"
                        style={{backgroundColor: '#343434'}}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.bonus || ''}
                        onChange={(e) => updateRecord(index, 'bonus', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="w-24 mx-auto"
                        style={{backgroundColor: '#343434'}}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.sickLeavePay || ''}
                        onChange={(e) => updateRecord(index, 'sickLeavePay', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="w-24 mx-auto"
                        style={{backgroundColor: '#343434'}}
                      />
                    </td>
                    <td className="px-4 py-3 relative">
                      <div className="w-50 relative mx-auto">
                        {record.payrollDeductions && record.payrollDeductions.length > 0 ? (
                          <>
                            <button 
                              onClick={() => toggleDeductionsExpanded(record.employeeId)}
                              className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 border border-gray-700"
                              style={{
                                backgroundColor: hoveredSummary === record.employeeId ? '#4a4a4a' : '#343434'
                              }}
                              onMouseEnter={() => setHoveredSummary(record.employeeId)}
                              onMouseLeave={() => setHoveredSummary(null)}
                            >
                              <span className="text-amber-400 font-semibold">
                                -{record.payrollDeductions.reduce((sum, d) => sum + d.amount, 0)} PLN
                              </span>
                              <ChevronDown 
                                size={18} 
                                className={`text-gray-400 transition-transform duration-200 ${expandedDeductions[record.employeeId] ? 'rotate-180' : ''}`} 
                              />
                            </button>
                            
                            {expandedDeductions[record.employeeId] && (
                              <div className="absolute top-full left-0 right-0 z-10 mt-1 backdrop-blur-sm rounded-lg p-2 space-y-1 border border-gray-700 shadow-lg" style={{backgroundColor: '#343434'}}>
                                {record.payrollDeductions.map((deduction) => (
                                  <div 
                                    key={deduction.id} 
                                    className="flex items-center rounded-lg px-2 py-1 group cursor-pointer transition-colors"
                                    style={{
                                      backgroundColor: hoveredDeduction === deduction.id ? '#4a4a4a' : '#343434'
                                    }}
                                    onMouseEnter={() => setHoveredDeduction(deduction.id!)}
                                    onMouseLeave={() => setHoveredDeduction(null)}
                                    onClick={() => openEditDeductionModal(deduction)}
                                  >
                                    <span className="text-gray-300 text-sm text-center flex-1 truncate">{deduction.category}</span>
                                    <span className="text-amber-400 text-sm text-center w-12">-{deduction.amount}</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDeduction(deduction.id!);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all w-5 flex justify-center"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                                
                                <button 
                                  onClick={() => openDeductionModal(record)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-600 hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all duration-200 text-sm text-gray-400 mt-2"
                                  style={{backgroundColor: '#343434'}}
                                >
                                  <Plus size={16} />
                                  Dodaj obciążenie
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => openDeductionModal(record)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-600 hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all duration-200 text-sm text-gray-400"
                            style={{backgroundColor: '#343434'}}
                          >
                            <Plus size={16} />
                            Dodaj obciążenie
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.bankTransfer || ''}
                        onChange={(e) => updateRecord(index, 'bankTransfer', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="w-24 mx-auto"
                        style={{backgroundColor: '#343434'}}
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium text-center">
                      {record.cashAmount.toFixed(2)} PLN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-lighter-border bg-section-grey-light p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                 <span>Suma gotówki na miesiąc {selectedMonthName}: {totalCash.toFixed(2)} PLN</span>
              </div>
              <Button
                color="primary"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                <HiSave className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal show={showDeductionModal} onClose={closeDeductionModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Dodaj obciążenie</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="space-y-4">
            <div>
              <Autocomplete
                label="Kategoria"
                options={categoryOptions}
                value={deductionForm.category}
                onChange={(value) => setDeductionForm({...deductionForm, category: value.toUpperCase()})}
                placeholder="Wprowadź kategorię..."
                className=""
                allowCustom={true}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notatka
              </label>
              <textarea
                value={deductionForm.note}
                onChange={(e) => setDeductionForm({...deductionForm, note: e.target.value})}
                placeholder="Wprowadź notatkę..."
                rows={3}
                className="w-full p-3 border border-lighter-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
                style={{backgroundColor: '#343434', color: '#FFFFFF'}}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kwota
              </label>
              <Input
                type="number"
                step="0.01"
                value={deductionForm.amount || ''}
                onChange={(e) => setDeductionForm({...deductionForm, amount: Number(e.target.value) || 0})}
                placeholder="Wprowadź kwotę..."
                className=""
                style={{backgroundColor: '#343434'}}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleCreateDeduction}
          >
            Dodaj obciążenie
          </Button>
          <Button color="gray" onClick={closeDeductionModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditDeductionModal} onClose={closeEditDeductionModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Edytuj obciążenie</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="space-y-4">
            <div>
              <Autocomplete
                label="Kategoria"
                options={categoryOptions}
                value={editDeductionForm.category}
                onChange={(value) => setEditDeductionForm({...editDeductionForm, category: value.toUpperCase()})}
                placeholder="Wprowadź kategorię..."
                className=""
                allowCustom={true}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notatka
              </label>
              <textarea
                value={editDeductionForm.note}
                onChange={(e) => setEditDeductionForm({...editDeductionForm, note: e.target.value})}
                placeholder="Wprowadź notatkę..."
                rows={3}
                className="w-full p-3 border border-lighter-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
                style={{backgroundColor: '#343434', color: '#FFFFFF'}}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kwota
              </label>
              <Input
                type="number"
                step="0.01"
                value={editDeductionForm.amount || ''}
                onChange={(e) => setEditDeductionForm({...editDeductionForm, amount: Number(e.target.value) || 0})}
                placeholder="Wprowadź kwotę..."
                className=""
                style={{backgroundColor: '#343434'}}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleUpdateDeduction}
          >
            Zaktualizuj obciążenie
          </Button>
          <Button color="gray" onClick={closeEditDeductionModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Kategorie Obciążeń</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Brak kategorii</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 rounded-lg border border-lighter-border hover:bg-section-grey-light transition-colors"
                  style={{backgroundColor: '#343434'}}
                >
                  <span className="text-white font-medium">{category}</span>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button color="gray" onClick={() => setShowCategoryModal(false)}>
            Zamknij
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollPage;