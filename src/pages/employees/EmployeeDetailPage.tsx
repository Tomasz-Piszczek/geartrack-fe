import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiCurrencyDollar, HiPencil, HiPlus } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../api/employees';
import { QUERY_KEYS, ROUTES, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import { useAuth } from '../../context/AuthContext';
import EmployeeToolsSection from './components/EmployeeToolsSection';
import EmployeeUrlopSection, { type EmployeeUrlopSectionRef } from './components/EmployeeUrlopSection';
import EmployeeBadaniaSzkoleniaSection, { type EmployeeBadaniaSzkoleniaSectionRef } from './components/EmployeeBadaniaSzkoleniaSection';
import EmployeeDeductionsSection from './components/EmployeeDeductionsSection';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const urlopSectionRef = useRef<EmployeeUrlopSectionRef>(null);
  const badaniaSzkoleniaSectionRef = useRef<EmployeeBadaniaSzkoleniaSectionRef>(null);

  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, id],
    queryFn: () => employeesApi.getById(id!),
    enabled: !!id,
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EmployeeFormData>();

  const updateEmployeeMutation = useMutation({
    mutationFn: employeesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee updated successfully');
      handleCloseEditModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });

  const handleOpenEditModal = () => {
    if (employee) {
      resetEdit({
        firstName: employee.firstName,
        lastName: employee.lastName,
        hourlyRate: employee.hourlyRate,
      });
    }
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetEdit();
  };

  const onSubmitEdit = (data: EmployeeFormData) => {
    if (employee) {
      updateEmployeeMutation.mutate({
        ...employee,
        ...data,
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
              <div className="flex items-center gap-2 text-surface-grey-dark mb-6">
                <HiCurrencyDollar className="w-5 h-5" />
                <span className="text-lg">{employee.hourlyRate} PLN/h</span>
              </div>
            )}

            <div className="w-full space-y-3">
              <Button
                color="gray"
                onClick={handleOpenEditModal}
                className="bg-green-900 hover:bg-green-800 text-green-300 w-full"
              >
                <HiPencil className="w-4 h-4 mr-2" />
                Edytuj Pracownika
              </Button>
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

      {/* Edit Employee Modal */}
      <Modal show={showEditModal} onClose={handleCloseEditModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Edytuj pracownika
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <Input
              id="firstName"
              label="Imię"
              {...registerEdit('firstName', { required: VALIDATION.REQUIRED })}
              error={editErrors.firstName?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="lastName"
              label="Nazwisko"
              {...registerEdit('lastName', { required: VALIDATION.REQUIRED })}
              error={editErrors.lastName?.message}
              className="bg-section-grey-light"
            />

            {isAdmin() && (
              <Input
                id="hourlyRate"
                label="Stawka godzinowa (zł)"
                type="number"
                step="0.01"
                {...registerEdit('hourlyRate', {
                  required: VALIDATION.REQUIRED,
                  min: { value: 0, message: VALIDATION.POSITIVE_NUMBER }
                })}
                error={editErrors.hourlyRate?.message}
                className="bg-section-grey-light"
              />
            )}
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitEdit(onSubmitEdit)}
            disabled={updateEmployeeMutation.isPending}
          >
            {updateEmployeeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Aktualizowanie...
              </div>
            ) : (
              'Aktualizuj'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseEditModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeDetailPage;
