import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiCurrencyDollar, HiPlus, HiCalendar } from 'react-icons/hi';
import { Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees';
import { QUERY_KEYS, ROUTES } from '../../constants';
import { toast } from '../../lib/toast';
import { useAuth } from '../../context/AuthContext';
import EmployeeToolsSection from './components/EmployeeToolsSection';
import EmployeeUrlopSection, { type EmployeeUrlopSectionRef } from './components/EmployeeUrlopSection';
import EmployeeBadaniaSzkoleniaSection, { type EmployeeBadaniaSzkoleniaSectionRef } from './components/EmployeeBadaniaSzkoleniaSection';
import EmployeeDeductionsSection from './components/EmployeeDeductionsSection';
import EmployeeWorkingHoursModal from './components/EmployeeWorkingHoursModal';
import type { EmployeeUrlopDaysDto } from '../../types';

interface VacationDaysFormData {
  [key: string]: number;
}

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showVacationDaysModal, setShowVacationDaysModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [vacationDaysForm, setVacationDaysForm] = useState<VacationDaysFormData>({});
  const queryClient = useQueryClient();
  const urlopSectionRef = useRef<EmployeeUrlopSectionRef>(null);
  const badaniaSzkoleniaSectionRef = useRef<EmployeeBadaniaSzkoleniaSectionRef>(null);

  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, id],
    queryFn: () => employeesApi.getById(id!),
    enabled: !!id,
  });

  const { data: vacationSummary, isLoading: isLoadingVacation } = useQuery({
    queryKey: [QUERY_KEYS.VACATION_SUMMARY, id],
    queryFn: () => employeesApi.getVacationSummary(id!),
    enabled: !!id && isAdmin(),
  });

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    if (vacationSummary && !vacationSummary.isConfigured && isAdmin()) {
      const initialForm: VacationDaysFormData = {};
      vacationSummary.missingYears.forEach(year => {
        initialForm[`year_${year}`] = 26;
      });
      setVacationDaysForm(initialForm);
      setShowVacationDaysModal(true);
    }
  }, [vacationSummary, isAdmin]);

  const saveVacationDaysMutation = useMutation({
    mutationFn: (data: EmployeeUrlopDaysDto[]) => employeesApi.saveUrlopDays(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VACATION_SUMMARY, id] });
      toast.success('Dni urlopu zostały zapisane');
      setShowVacationDaysModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się zapisać dni urlopu');
    },
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSaveVacationDays = () => {
    if (!vacationSummary) return;

    const urlopDaysList: EmployeeUrlopDaysDto[] = vacationSummary.missingYears.map(year => ({
      year,
      days: vacationDaysForm[`year_${year}`] || 0,
    }));

    saveVacationDaysMutation.mutate(urlopDaysList);
  };

  const handleVacationDaysChange = (year: number, value: string) => {
    setVacationDaysForm(prev => ({
      ...prev,
      [`year_${year}`]: parseInt(value) || 0,
    }));
  };

  if (isLoadingEmployee) {
    return (
      <div className="fade-in">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="fade-in">
        <div className="text-center text-surface-grey-dark py-12">
          <HiUser className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Employee not found</p>
          <Button
            color="gray"
            onClick={() => navigate(ROUTES.EMPLOYEES)}
            className="mt-4"
          >
            <HiArrowLeft className="w-4 h-4 mr-2" />
            Powrót do pracowników
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button
          color="gray"
          onClick={() => navigate(ROUTES.EMPLOYEES)}
          className="bg-section-grey hover:bg-section-grey-light"
        >
          <HiArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {employee.firstName} {employee.lastName}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-dark-green flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">
                {getInitials(employee.firstName, employee.lastName)}
              </span>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-2">
              {employee.firstName} {employee.lastName}
            </h2>

            {isAdmin() && (
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-surface-grey-dark">
                  <HiCurrencyDollar className="w-5 h-5" />
                  <span className="text-lg">{employee.hourlyRate} PLN/h</span>
                </div>
                {!isLoadingVacation && vacationSummary?.isConfigured && vacationSummary.remainingDays !== null && (
                  <div className="flex items-center gap-2 text-surface-grey-dark">
                    <HiCalendar className="w-5 h-5" />
                    <span className="text-lg">
                      <span className={vacationSummary.remainingDays <= 0 ? 'text-red-400' : vacationSummary.remainingDays <= 5 ? 'text-orange-400' : 'text-green-400'}>
                        {vacationSummary.remainingDays}
                      </span>
                      {' '}dni urlopu
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="w-full space-y-3">
              <Button
                color="primary"
                onClick={() => urlopSectionRef.current?.openAddModal()}
                className="w-full"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Dodaj Urlop
              </Button>
              <Button
                color="primary"
                onClick={() => badaniaSzkoleniaSectionRef.current?.openAddModal()}
                className="w-full"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Dodaj Badanie lub Szkolenie
              </Button>
              <Button
                color="primary"
                onClick={() => setShowWorkingHoursModal(true)}
                className="w-full"
              >
                <Clock className="w-4 h-4 mr-2" />
                Sprawdź godziny
              </Button>
            </div>
          </div>
        </Card>

        <EmployeeToolsSection
          employeeId={employee.uuid!}
          employeeName={`${employee.firstName} ${employee.lastName}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <EmployeeUrlopSection
          ref={urlopSectionRef}
          employeeId={employee.uuid!}
          employeeName={`${employee.firstName} ${employee.lastName}`}
          isAdmin={isAdmin()}
        />

        <EmployeeBadaniaSzkoleniaSection
          ref={badaniaSzkoleniaSectionRef}
          employeeId={employee.uuid!}
          employeeName={`${employee.firstName} ${employee.lastName}`}
          isAdmin={isAdmin()}
        />
      </div>

      <EmployeeDeductionsSection
        employeeId={employee.uuid!}
        isAdmin={isAdmin()}
      />

      <Modal show={showVacationDaysModal} onClose={() => setShowVacationDaysModal(false)}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Uzupełnij dane pracownika</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="space-y-4">
            <p className="text-surface-grey-dark mb-4">
              Podaj liczbę dni urlopu przysługujących pracownikowi w danym roku:
            </p>
            {vacationSummary?.missingYears.map(year => (
              <Input
                key={year}
                id={`vacation_days_${year}`}
                label={`Dni urlopu w roku ${year}`}
                type="number"
                min="0"
                max="365"
                value={vacationDaysForm[`year_${year}`] || ''}
                onChange={(e) => handleVacationDaysChange(year, e.target.value)}
                className="bg-section-grey-light"
              />
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSaveVacationDays}
            disabled={saveVacationDaysMutation.isPending}
          >
            {saveVacationDaysMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Zapisywanie...
              </div>
            ) : (
              'Zapisz'
            )}
          </Button>
          <Button color="gray" onClick={() => setShowVacationDaysModal(false)}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      {employee && (
        <EmployeeWorkingHoursModal
          show={showWorkingHoursModal}
          onClose={() => setShowWorkingHoursModal(false)}
          employeeName={`${employee.firstName} ${employee.lastName}`}
        />
      )}
    </div>
  );
};

export default EmployeeDetailPage;
