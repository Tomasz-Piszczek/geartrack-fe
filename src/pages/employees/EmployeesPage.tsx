import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiSearch, HiUser, HiAcademicCap } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../api/employees';
import type { EmployeeDto, PaginationParams } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useUrlopy } from '../../context/UrlopContext';
import { useBadaniaSzkolenia } from '../../context/BadaniaSzkolenieContext';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}


const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { urlopy } = useUrlopy();
  const { getUpcomingByEmployeeId, badaniaSzkolenia } = useBadaniaSzkolenia();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const queryClient = useQueryClient();

  const paginationParams: PaginationParams = {
    page: currentPage - 1,
    size: pageSize,
    sortBy: 'firstName',
    sortDirection: 'asc',
    search: searchTerm,
  };

  const { data: employeesResponse, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, paginationParams],
    queryFn: () => employeesApi.getAll(paginationParams),
  });

  const employees = employeesResponse?.content || [];
  const totalElements = employeesResponse?.totalElements || 0;


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormData>();


  const createMutation = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee created successfully');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: employeesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee updated successfully');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });



  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = (employee?: EmployeeDto) => {
    setEditingEmployee(employee || null);
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        hourlyRate: employee.hourlyRate,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        hourlyRate: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    reset();
  };


  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateMutation.mutate({
        ...editingEmployee,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };



  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const hasPendingUrlopy = (employeeId: string) => {
    return urlopy.some(u => u.employeeId === employeeId && u.status === 'PENDING');
  };

  const hasExpiredBadania = (employeeId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return badaniaSzkolenia.some(b => {
      const badanieDate = new Date(b.date);
      badanieDate.setHours(0, 0, 0, 0);
      return b.employeeId === employeeId && b.status === 'OCZEKUJACY' && badanieDate < today;
    });
  };

  const hasExpiringSoonBadania = (employeeId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return badaniaSzkolenia.some(b => {
      const badanieDate = new Date(b.date);
      badanieDate.setHours(0, 0, 0, 0);
      return b.employeeId === employeeId && b.status === 'OCZEKUJACY' && badanieDate >= today && badanieDate <= sevenDaysFromNow;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pracownicy</h1>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Dodaj pracownika
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Szukaj pracowników..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-section-grey"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center text-surface-grey-dark py-12">
          <HiUser className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Nie znaleziono pracowników</p>
          <p className="text-sm">Dodaj pierwszego pracownika, aby zacząć</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((employee) => (
            <Card
              key={employee.uuid}
              className="card hover:shadow-lg transition-all cursor-pointer group relative"
              onClick={() => navigate(`/employees/${employee.uuid}`)}
            >
              {isAdmin() && (
                <div className="absolute top-3 right-3 flex gap-1">
                  {hasPendingUrlopy(employee.uuid!) && (
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full animate-pulse">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                  {hasExpiredBadania(employee.uuid!) && (
                    <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full animate-pulse">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                  {hasExpiringSoonBadania(employee.uuid!) && (
                    <div className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-full animate-pulse">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-dark-green flex items-center justify-center mb-4 group-hover:bg-dark-green/80 transition-colors">
                  <span className="text-white font-bold text-lg">
                    {getInitials(employee.firstName, employee.lastName)}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-dark-green transition-colors">
                  {employee.firstName} {employee.lastName}
                </h3>

                {(() => {
                  const upcoming = getUpcomingByEmployeeId(employee.uuid!);
                  return upcoming ? (
                    <div className="mt-4 p-3 bg-section-grey-dark rounded-lg w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <HiAcademicCap className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-surface-grey font-medium">Nadchodzące szkolenie:</p>
                      </div>
                      <p className="text-sm text-white font-semibold">{upcoming.category}</p>
                      <p className="text-xs text-surface-grey-dark mt-1">{formatDate(upcoming.date)}</p>
                    </div>
                  ) : null;
                })()}

              </div>
            </Card>
          ))}
        </div>
      )}

      {totalElements > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalElements={totalElements}
            perPage={pageSize}
            onPageChange={handlePageChange}
            onPerPageChange={handlePageSizeChange}
            adjustablePage={true}
          />
        </div>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingEmployee ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="firstName"
              label="Imię"
              {...register('firstName', { required: VALIDATION.REQUIRED })}
              error={errors.firstName?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="lastName"
              label="Nazwisko"
              {...register('lastName', { required: VALIDATION.REQUIRED })}
              error={errors.lastName?.message}
              className="bg-section-grey-light"
            />

            {isAdmin() && (
              <Input
                id="hourlyRate"
                label="Stawka godzinowa (zł)"
                type="number"
                step="0.01"
                {...register('hourlyRate', { 
                  required: VALIDATION.REQUIRED,
                  min: { value: 0, message: VALIDATION.POSITIVE_NUMBER }
                })}
                error={errors.hourlyRate?.message}
                className="bg-section-grey-light"
              />
            )}
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                {editingEmployee ? 'Aktualizowanie...' : 'Tworzenie...'}
              </div>
            ) : (
              editingEmployee ? 'Aktualizuj' : 'Utwórz'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeesPage;