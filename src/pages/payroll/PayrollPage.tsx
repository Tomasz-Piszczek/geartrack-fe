import React, {useEffect, useState} from 'react';
import {HiSave} from 'react-icons/hi';
import {ChevronDown, Plus, X, Trash2, Check, Info, AlertCircle} from 'lucide-react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {payrollApi, type PayrollDeductionDto, type PayrollRecordDto, type DailyBreakdownDto} from '../../api/payroll';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Autocomplete from '../../components/common/Autocomplete';
import {Tooltip} from '../../components/common/Tooltip';
import {toast} from '../../lib/toast';

interface ConflictItem {
  employeeName: string;
  conflictDates: string[];
}

interface ConflictResponse {
  message: string;
  status: number;
  conflicts: ConflictItem[];
}

const URLOP_DISPLAY_NAMES: Record<string, string> = {
  'URLOP_WYPOCZYNKOWY': 'Urlop Wypoczynkowy',
  'URLOP_MACIERZYNSKI': 'Urlop Macierzyński',
  'URLOP_BEZPLATNY': 'Urlop Bezpłatny',
};

const PayrollPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [payrollData, setPayrollData] = useState<PayrollRecordDto[]>([]);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showEditDeductionModal, setShowEditDeductionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictResponse | null>(null);
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
  const [resolvedDiscrepancies, setResolvedDiscrepancies] = useState<Set<string>>(new Set());
  const [resolvedCalculationDiscrepancies, setResolvedCalculationDiscrepancies] = useState<Set<string>>(new Set());
  const [expandedConflicts, setExpandedConflicts] = useState<Record<string, boolean>>({});

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

  const { data: records, isLoading, refetch, error } = useQuery({
    queryKey: ['payroll', selectedYear, selectedMonth],
    queryFn: async () => {
      try {
        return await payrollApi.getPayrollRecords(selectedYear, selectedMonth);
      } catch (err: unknown) {
        const error = err as ConflictResponse;
        if (error.status === 409 && error.message) {
          setConflictData(error);
          setShowConflictModal(true);
          throw err;
        }
        throw err;
      }
    },
    retry: false,
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['payroll-categories'],
    queryFn: () => payrollApi.getCategories(),
  });

  const saveMutation = useMutation({
    mutationFn: (records: PayrollRecordDto[]) => payrollApi.savePayrollRecords(records, selectedYear, selectedMonth),
    onSuccess: () => {
      toast.success('Wypłaty zostały zapisane');
      setResolvedDiscrepancies(new Set());
      setResolvedCalculationDiscrepancies(new Set());
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

  const calculateCashAmount = (record: PayrollRecordDto): number => {
    const deductionsTotal = record.payrollDeductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const total = (record.hoursWorked * record.hourlyRate) + record.bonus + record.sickLeavePay - deductionsTotal - record.bankTransfer;
    return Math.max(0, total);
  };

  useEffect(() => {
    if (!records) return;

    const updatedRecords = records.map(record => {
      const deductionsTotal = record.payrollDeductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
      const calculatedCash = calculateCashAmount(record);
      const savedCash = record.cashAmount;

      // Calculate saved total (cash + bank transfer)
      const savedTotal = (savedCash ?? 0) + (record.bankTransfer || 0);

      // Only show discrepancy if saved total is not 0 and there's a difference
      const hasCalcDiscrepancy = !!(record.payrollRecordId && savedTotal !== 0 && Math.abs(calculatedCash - savedCash) > 0.01);

      // Only show hours discrepancy if lastSavedHours is not 0 and there's a difference
      const hasHoursDiscrepancy = !!(record.hasDiscrepancy && (record.lastSavedHours ?? 0) !== 0);

      return {
        ...record,
        deductions: deductionsTotal,
        hasDiscrepancy: hasHoursDiscrepancy,
        hasCalculationDiscrepancy: hasCalcDiscrepancy,
        savedCashAmount: savedCash,
        calculatedCashAmount: calculatedCash,
        cashAmount: calculatedCash
      };
    });

    setPayrollData(updatedRecords);
  }, [records]);

  const updateRecord = (index: number, field: keyof PayrollRecordDto, value: number | string) => {
    const updated = [...payrollData];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].deductions = updated[index].payrollDeductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    updated[index].cashAmount = calculateCashAmount(updated[index]);
    setPayrollData(updated);
  };

  const handleSave = () => {
    const invalidRecords = payrollData.filter(record => !record.hourlyRate || record.hourlyRate === 0);
    if (invalidRecords.length > 0) {
      const names = invalidRecords.map(r => r.employeeName).join(', ');
      toast.error(`${names} nie może mieć pustej stawki/h`);
      return;
    }

    const unresolvedDiscrepancies = payrollData.filter(record =>
      record.hasDiscrepancy && !resolvedDiscrepancies.has(record.employeeId)
    );
    if (unresolvedDiscrepancies.length > 0) {
      toast.error('Nie można zapisać - rozwiąż konflikty godzin pracy');
      return;
    }

    const unresolvedCalcDiscrepancies = payrollData.filter(record =>
      record.hasCalculationDiscrepancy && !resolvedCalculationDiscrepancies.has(record.employeeId)
    );
    if (unresolvedCalcDiscrepancies.length > 0) {
      toast.error('Nie można zapisać - rozwiąż konflikty obliczeń');
      return;
    }

    saveMutation.mutate(payrollData);
  };

  const togglePaid = (index: number) => {
    const updated = [...payrollData];
    updated[index] = {
      ...updated[index],
      paid: !updated[index].paid
    };
    setPayrollData(updated);
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
      id: Date.now().toString(),
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
          cashAmount: calculateCashAmount({...record, payrollDeductions: updatedDeductions})
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
          cashAmount: calculateCashAmount({...record, payrollDeductions: updatedDeductions})
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
        cashAmount: calculateCashAmount({...record, payrollDeductions: updatedDeductions})
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

  const handleAcceptNewHours = (employeeId: string) => {
    setResolvedDiscrepancies(prev => new Set([...prev, employeeId]));
  };

  const handleAcceptNewCalculation = (employeeId: string) => {
    setResolvedCalculationDiscrepancies(prev => new Set([...prev, employeeId]));
  };

  const formatHours = (decimal: number): string => {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours}h:${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const formatDateOnly = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getUrlopDisplayName = (category: string): string => {
    return URLOP_DISPLAY_NAMES[category] || category;
  };

  const hasOvertime = (dailyBreakdown?: DailyBreakdownDto[]): boolean => {
    return dailyBreakdown?.some(day => day.actualHours > 10) || false;
  };

  const renderWorkingHoursTooltip = (record: PayrollRecordDto) => {
    const totalWorkHours = record.dailyBreakdown?.reduce((sum, day) => sum + day.roundedHours, 0) || 0;

    const hourlyRate = record.hourlyRate || 0;
    const bonus = record.bonus || 0;
    const sickLeavePay = record.sickLeavePay || 0;
    const deductions = record.deductions || 0;

    const workAmount = totalWorkHours * hourlyRate;
    const urlopAmounts = record.urlopBreakdown?.filter(urlop => urlop.totalHours > 0).map(urlop => ({
      name: getUrlopDisplayName(urlop.category),
      hours: urlop.totalHours,
      rate: urlop.rate,
      amount: urlop.totalHours * urlop.rate * hourlyRate
    })) || [];
    const totalUrlopAmount = urlopAmounts.reduce((sum, u) => sum + u.amount, 0);

    const total = workAmount + totalUrlopAmount + bonus + sickLeavePay - deductions;

    return (
      <div className="text-sm text-white max-w-md">
        <div className="font-bold mb-2">Szczegóły godzin pracy:</div>

        <div className="mb-3">
          <div className="font-semibold mb-1">Dzienne godziny:</div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {record.dailyBreakdown?.map((day, idx) => {
              const startTime = day.startTime ? new Date(day.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';
              const endTime = day.endTime ? new Date(day.endTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div
                  key={idx}
                  className={day.actualHours > 10 ? 'text-red-400' : ''}
                >
                  {startTime && endTime ? (
                    <>wejście: {startTime} wyjście: {endTime} - {formatDateOnly(day.date)} ({formatHours(day.actualHours)} - {day.roundedHours}h)</>
                  ) : (
                    <>{day.date} {formatHours(day.actualHours)} ({day.roundedHours}h)</>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {urlopAmounts.length > 0 && (
          <div className="mb-3">
            <div className="font-semibold mb-1">Urlopy:</div>
            {urlopAmounts.map((urlop, idx) => (
              <div key={idx}>
                {urlop.name}: {urlop.hours}h × {urlop.rate}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="font-semibold mb-1">Obliczenia wynagrodzenia:</div>
          <div>Godziny pracy: {totalWorkHours}h × {hourlyRate.toFixed(2)}zł/h = {workAmount.toFixed(2)}zł</div>
          {urlopAmounts.map((urlop, idx) => (
            <div key={idx}>
              {urlop.name}: {urlop.hours}h × {urlop.rate} × {hourlyRate.toFixed(2)}zł/h = {urlop.amount.toFixed(2)}zł
            </div>
          ))}
          {bonus > 0 && <div>Premia: {bonus.toFixed(2)}zł</div>}
          {sickLeavePay > 0 && <div>Chorobowe: {sickLeavePay.toFixed(2)}zł</div>}
          {deductions > 0 && <div className="text-red-400">Obciążenia: -{deductions.toFixed(2)}zł</div>}
          <div className="border-t border-gray-600 mt-1 pt-1 font-bold">
            Suma: {total.toFixed(2)}zł
          </div>
        </div>
      </div>
    );
  };

  const renderDiscrepancyTooltip = (record: PayrollRecordDto) => {
    const filteredUrlopBreakdown = record.urlopBreakdown?.filter(urlop => urlop.totalHours > 0) || [];

    return (
      <div className="text-sm text-white max-w-md">
        <div className="font-bold mb-2 text-amber-400">
          Dane nie zgadzają się z ostatnio zapisanymi wypłatami
        </div>

        <div className="mb-2">
          <div>Ostatnio zapisane godziny: {record.lastSavedHours}h</div>
          <div className="text-gray-400">
            Data modyfikacji: {record.lastModifiedAt && formatDate(record.lastModifiedAt)}
          </div>
        </div>

        <div className="mb-3">
          <div className="font-semibold">Nowe godziny: {record.hoursWorked}h</div>
        </div>

        <div className="mb-3">
          <div className="font-semibold mb-1">Szczegóły:</div>
          <div className="border-t border-gray-600 pt-2">
            <div className="font-semibold mb-1">Dzienne godziny pracy:</div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {record.dailyBreakdown?.map((day, idx) => {
                const startTime = day.startTime ? new Date(day.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';
                const endTime = day.endTime ? new Date(day.endTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div key={idx} className={day.actualHours > 10 ? 'text-red-400' : ''}>
                    {startTime && endTime ? (
                      <>wejście: {startTime} wyjście: {endTime} - {formatDateOnly(day.date)} ({formatHours(day.actualHours)} - {day.roundedHours}h)</>
                    ) : (
                      <>{day.date} {formatHours(day.actualHours)} ({day.roundedHours}h)</>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {filteredUrlopBreakdown.length > 0 && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="font-semibold mb-1">Urlopy:</div>
              {filteredUrlopBreakdown.map((urlop, idx) => (
                <div key={idx}>
                  {getUrlopDisplayName(urlop.category)}: {urlop.totalHours}h × {urlop.rate}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            color="primary"
            onClick={() => handleAcceptNewHours(record.employeeId)}
          >
            Zaakceptuj nowe godziny ({record.hoursWorked}h)
          </Button>
        </div>
      </div>
    );
  };

  const renderCalculationDiscrepancyTooltip = (record: PayrollRecordDto) => {
    const totalWorkHours = record.dailyBreakdown?.reduce((sum, day) => sum + day.roundedHours, 0) || 0;
    const hourlyRate = record.hourlyRate || 0;
    const bonus = record.bonus || 0;
    const sickLeavePay = record.sickLeavePay || 0;
    const deductions = record.deductions || 0;

    const workAmount = totalWorkHours * hourlyRate;
    const urlopAmounts = record.urlopBreakdown?.filter(urlop => urlop.totalHours > 0).map(urlop => ({
      name: getUrlopDisplayName(urlop.category),
      hours: urlop.totalHours,
      rate: urlop.rate,
      amount: urlop.totalHours * urlop.rate * hourlyRate
    })) || [];
    const totalUrlopAmount = urlopAmounts.reduce((sum, u) => sum + u.amount, 0);

    const calculatedTotal = workAmount + totalUrlopAmount + bonus + sickLeavePay - deductions;

    const savedTotal = (record.savedCashAmount ?? 0) + (record.bankTransfer || 0);

    return (
      <div className="text-sm text-white max-w-md">
        <div className="font-bold mb-2 text-amber-400">
          Suma nie zgadza się z ostatnio zapisaną kwotą
        </div>

        <div className="mb-3">
          <div>Suma z bazy danych: {savedTotal.toFixed(2)}zł</div>
          <div className="text-gray-400">
            Data modyfikacji: {record.lastModifiedAt && formatDate(record.lastModifiedAt)}
          </div>
        </div>

        <div className="mb-3">
          <div className="font-semibold">Obliczona suma: {calculatedTotal.toFixed(2)}zł</div>
        </div>

        <div className="mb-3">
          <div className="font-semibold mb-1">Szczegóły obliczeń:</div>
          <div className="border-t border-gray-600 pt-2">
            <div>Godziny pracy: {totalWorkHours}h × {hourlyRate.toFixed(2)}zł/h = {workAmount.toFixed(2)}zł</div>
            {urlopAmounts.map((urlop, idx) => (
              <div key={idx}>
                {urlop.name}: {urlop.hours}h × {urlop.rate} × {hourlyRate.toFixed(2)}zł/h = {urlop.amount.toFixed(2)}zł
              </div>
            ))}
            {bonus > 0 && <div>Premia: {bonus.toFixed(2)}zł</div>}
            {sickLeavePay > 0 && <div>Chorobowe: {sickLeavePay.toFixed(2)}zł</div>}
            {deductions > 0 && <div className="text-red-400">Obciążenia: -{deductions.toFixed(2)}zł</div>}
            <div className="border-t border-gray-600 mt-1 pt-1 font-bold">
              Suma = {workAmount.toFixed(2)} + {totalUrlopAmount.toFixed(2)} + {bonus.toFixed(2)} + {sickLeavePay.toFixed(2)} - {deductions.toFixed(2)} = {calculatedTotal.toFixed(2)}zł
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            color="primary"
            onClick={() => handleAcceptNewCalculation(record.employeeId)}
          >
            Zaakceptuj nowe obliczenia ({calculatedTotal.toFixed(2)}zł)
          </Button>
        </div>
      </div>
    );
  };

  const totalCash = payrollData.reduce((sum, record) => sum + record.cashAmount, 0);
  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label || '';

  const categoryOptions = categories.map(category => ({
    value: category,
    label: category,
  }));

  const hasUnresolvedDiscrepancies = payrollData.some(record =>
    record.hasDiscrepancy && !resolvedDiscrepancies.has(record.employeeId)
  );

  const hasUnresolvedCalculationDiscrepancies = payrollData.some(record =>
    record.hasCalculationDiscrepancy && !resolvedCalculationDiscrepancies.has(record.employeeId)
  );

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
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400">Wystąpił błąd podczas ładowania danych</div>
        </div>
      ) : (
        <div className="bg-section-grey rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-section-grey-light border-b border-lighter-border">
                <tr>
                  <th className="px-4 py-3 text-white font-medium text-center">Pracownik</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Godziny Pracy</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Stawka PLN/h</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Premia</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Chorobowe</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Obciążenia</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Na konto</th>
                  <th className="px-4 py-3 text-white font-medium text-center">Gotówka</th>
                  <th className="px-4 py-3 text-white font-medium text-center w-36">Suma</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((record, index) => {
                  const isDiscrepancy = record.hasDiscrepancy && !resolvedDiscrepancies.has(record.employeeId);
                  const isCalcDiscrepancy = record.hasCalculationDiscrepancy && !resolvedCalculationDiscrepancies.has(record.employeeId);
                  const hasAnyDiscrepancy = isDiscrepancy || isCalcDiscrepancy;

                  return (
                    <tr
                      key={record.employeeId}
                      className={`border-b border-lighter-border hover:bg-section-grey-light/50 ${
                        hasAnyDiscrepancy ? 'animate-pulse-warning' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-white text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isDiscrepancy && (
                            <Tooltip content={renderDiscrepancyTooltip(record)}>
                              <AlertCircle size={18} className="text-amber-500 cursor-pointer" />
                            </Tooltip>
                          )}
                          {isCalcDiscrepancy && (
                            <Tooltip content={renderCalculationDiscrepancyTooltip(record)}>
                              <AlertCircle size={18} className="text-amber-500 cursor-pointer" />
                            </Tooltip>
                          )}
                          {hasAnyDiscrepancy && <span className="text-gray-500">{record.employeeName}</span>}
                          {!hasAnyDiscrepancy && record.employeeName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0h</span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-white">{record.hoursWorked}h</span>
                            <Tooltip content={renderWorkingHoursTooltip(record)}>
                              <Info
                                size={16}
                                className={`cursor-pointer ${hasOvertime(record.dailyBreakdown) ? 'text-red-400' : 'text-gray-400'}`}
                              />
                            </Tooltip>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0.00</span>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={record.hourlyRate || ''}
                            onChange={(e) => updateRecord(index, 'hourlyRate', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                            className="w-24 mx-auto"
                            style={{backgroundColor: '#343434'}}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0.00</span>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={record.bonus || ''}
                            onChange={(e) => updateRecord(index, 'bonus', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                            className="w-24 mx-auto"
                            style={{backgroundColor: '#343434'}}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0.00</span>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={record.sickLeavePay || ''}
                            onChange={(e) => updateRecord(index, 'sickLeavePay', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                            className="w-24 mx-auto"
                            style={{backgroundColor: '#343434'}}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 relative">
                        <div className="w-50 relative mx-auto">
                          {hasAnyDiscrepancy ? (
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-700 rounded-lg text-sm text-gray-600 cursor-not-allowed opacity-50"
                              style={{backgroundColor: '#343434'}}
                            >
                              <Plus size={16} />
                              Dodaj obciążenie
                            </button>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0.00</span>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={record.bankTransfer || ''}
                            onChange={(e) => updateRecord(index, 'bankTransfer', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                            className="w-24 mx-auto"
                            style={{backgroundColor: '#343434'}}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium text-center">
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0.00</span>
                        ) : (
                          record.cashAmount.toFixed(2)
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-white font-medium text-center cursor-pointer hover:bg-section-grey-light/70 transition-colors"
                        onClick={() => !hasAnyDiscrepancy && togglePaid(index)}
                      >
                        {hasAnyDiscrepancy ? (
                          <span className="text-gray-500">0.00 PLN</span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>{(record.bankTransfer + record.cashAmount).toFixed(2)} PLN</span>
                            {record.paid && <Check size={18} className="text-emerald-500" />}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                disabled={saveMutation.isPending || hasUnresolvedDiscrepancies || hasUnresolvedCalculationDiscrepancies}
              >
                <HiSave className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal show={showConflictModal} onClose={() => { setShowConflictModal(false); setExpandedConflicts({}); }}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Konflikty godzin pracy</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="text-white space-y-4">
            <p className="font-semibold">Znaleziono konflikty między godzinami pracy a urlopami:</p>
            {conflictData?.conflicts && conflictData.conflicts.map((conflict: ConflictItem, idx: number) => (
              <div key={idx} className="bg-section-grey-light rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedConflicts(prev => ({
                    ...prev,
                    [conflict.employeeName]: !prev[conflict.employeeName]
                  }))}
                  className="w-full flex items-center justify-between p-3 hover:bg-section-grey-light/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-400">{conflict.employeeName}</span>
                    <span className="text-sm text-gray-400">({conflict.conflictDates.length} dni)</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${expandedConflicts[conflict.employeeName] ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedConflicts[conflict.employeeName] && (
                  <div className="px-3 pb-3 border-t border-lighter-border">
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {conflict.conflictDates.map((date: string, dateIdx: number) => (
                        <div key={dateIdx} className="text-sm text-gray-300 bg-section-grey px-2 py-1 rounded text-center">
                          {formatDateOnly(date)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <p className="text-sm text-gray-400">Rozwiąż konflikty przed wczytaniem danych.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button color="gray" onClick={() => setShowConflictModal(false)}>
            Zamknij
          </Button>
        </Modal.Footer>
      </Modal>

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

      <style>{`
        @keyframes pulse-warning {
          0%, 100% {
            background-color: rgba(255, 152, 0, 0.15);
            box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
          }
          50% {
            background-color: rgba(255, 152, 0, 0.35);
            box-shadow: 0 0 10px 2px rgba(255, 152, 0, 0.3);
          }
        }
        .animate-pulse-warning {
          animation: pulse-warning 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PayrollPage;
