import React, { useState, useEffect } from 'react';
import { HiSave } from 'react-icons/hi';
import { useQuery, useMutation } from '@tanstack/react-query';
import { payrollApi, type PayrollRecordDto } from '../../api/payroll';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { toast } from '../../lib/toast';

const PayrollPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [payrollData, setPayrollData] = useState<PayrollRecordDto[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const saveMutation = useMutation({
    mutationFn: (records: PayrollRecordDto[]) => payrollApi.savePayrollRecords(records, selectedYear, selectedMonth),
    onSuccess: () => {
      toast.success('Wypłaty zostały zapisane');
      refetch();
    },
    onError: () => {
      toast.error('Błąd podczas zapisywania wypłat');
    },
  });

  useEffect(() => {
    if (records) {
      setPayrollData(records);
    }
  }, [records]);

  const calculateCashAmount = (record: PayrollRecordDto): number => {
    const total = (record.hoursWorked * record.hourlyRate) + record.bonus + record.sickLeavePay - record.deductions - record.bankTransfer;
    return Math.max(0, total);
  };

  const updateRecord = (index: number, field: keyof PayrollRecordDto, value: number | string) => {
    const updated = [...payrollData];
    updated[index] = { ...updated[index], [field]: value };
    if (field !== 'deductionsNote') {
      updated[index].cashAmount = calculateCashAmount(updated[index]);
    }
    setPayrollData(updated);
  };

  const handleSave = () => {
    saveMutation.mutate(payrollData);
  };

  const openNoteModal = (index: number) => {
    setCurrentNoteIndex(index);
    setNoteValue(payrollData[index]?.deductionsNote || '');
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setCurrentNoteIndex(null);
    setNoteValue('');
  };

  const saveNote = () => {
    if (currentNoteIndex !== null) {
      updateRecord(currentNoteIndex, 'deductionsNote', noteValue);
    }
    closeNoteModal();
  };

  const totalCash = payrollData.reduce((sum, record) => sum + record.cashAmount, 0);
  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wypłaty</h1>
          <p className="text-surface-grey-dark">Zarządzaj wypłatami pracowników</p>
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

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Rok</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
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
            className="p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
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
                  <th className="px-4 py-3 text-white font-medium">Pracownik</th>
                  <th className="px-4 py-3 text-white font-medium">Stawka PLN/h</th>
                  <th className="px-4 py-3 text-white font-medium">Liczba godzin</th>
                  <th className="px-4 py-3 text-white font-medium">Premia</th>
                  <th className="px-4 py-3 text-white font-medium">Chorobowe</th>
                  <th className="px-4 py-3 text-white font-medium">Obciążenia</th>
                  <th className="px-4 py-3 text-white font-medium">Na konto</th>
                  <th className="px-4 py-3 text-white font-medium">Gotówka</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((record, index) => (
                  <tr key={record.employeeId} className="border-b border-lighter-border hover:bg-section-grey-light/50">
                    <td className="px-4 py-3 text-white">{record.employeeName}</td>
                    <td className="px-4 py-3 text-white">{record.hourlyRate}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.5"
                        value={record.hoursWorked || ''}
                        onChange={(e) => updateRecord(index, 'hoursWorked', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="bg-section-grey-light w-24"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.bonus || ''}
                        onChange={(e) => updateRecord(index, 'bonus', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="bg-section-grey-light w-24"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.sickLeavePay || ''}
                        onChange={(e) => updateRecord(index, 'sickLeavePay', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="bg-section-grey-light w-24"
                      />
                    </td>
                    <td className="px-4 py-3 relative">
                      <div
                        onDoubleClick={() => openNoteModal(index)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                      >
                        <Input
                          type="number"
                          step="0.01"
                          value={record.deductions || ''}
                          onChange={(e) => updateRecord(index, 'deductions', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                          className="bg-section-grey-light w-24"
                        />
                        {hoveredIndex === index && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                            {record.deductionsNote || 'Naciśnij dwukrotnie by dodać notatkę'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={record.bankTransfer || ''}
                        onChange={(e) => updateRecord(index, 'bankTransfer', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                        className="bg-section-grey-light w-24"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {record.cashAmount.toFixed(2)} PLN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-lighter-border bg-section-grey-light p-4">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                 <span>Suma gotówki na miesiąc {selectedMonthName}: {totalCash.toFixed(2)} PLN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal show={showNoteModal} onClose={closeNoteModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Notatka do obciążeń</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notatka
              </label>
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Wprowadź notatkę..."
                rows={4}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white placeholder-surface-grey-dark focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={saveNote}
          >
            Zapisz notatkę
          </Button>
          <Button color="gray" onClick={closeNoteModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollPage;