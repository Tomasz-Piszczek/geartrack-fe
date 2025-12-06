import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiUser, HiCurrencyDollar, HiCog } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import DropdownActions from '../../components/common/DropdownActions';
import Pagination from '../../components/common/Pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../api/employees';
import { toolsApi } from '../../api/tools';
import type { EmployeeDto, PaginationParams, ToolCondition } from '../../types';
import { ToolCondition as ToolConditionValues } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Modal from '../../components/common/Modal';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

interface AssignToolFormData {
  toolId: string;
  quantity: number;
  condition: ToolCondition;
}

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showAssignToolModal, setShowAssignToolModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [selectedEmployeeForTool, setSelectedEmployeeForTool] = useState<EmployeeDto | null>(null);
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

  const { data: tools = [] } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormData>();

  const {
    register: registerTool,
    handleSubmit: handleSubmitTool,
    formState: { errors: toolErrors },
    reset: resetTool,
  } = useForm<AssignToolFormData>();

  const createMutation = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee created successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });

  const assignToolMutation = useMutation({
    mutationFn: toolsApi.assign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS, 'quantities'] });
      toast.success('Tool assigned successfully');
      handleCloseAssignToolModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign tool');
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

  const handleOpenAssignToolModal = (employee: EmployeeDto) => {
    setSelectedEmployeeForTool(employee);
    resetTool({
      toolId: '',
      quantity: 1,
      condition: ToolConditionValues.GOOD,
    });
    setShowAssignToolModal(true);
  };

  const handleCloseAssignToolModal = () => {
    setShowAssignToolModal(false);
    setSelectedEmployeeForTool(null);
    resetTool();
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

  const onSubmitToolAssignment = (data: AssignToolFormData) => {
    if (selectedEmployeeForTool) {
      assignToolMutation.mutate({
        employeeId: selectedEmployeeForTool.uuid!,
        toolId: data.toolId,
        quantity: data.quantity,
        condition: data.condition,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego pracownika?')) {
      deleteMutation.mutate(id);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pracownicy</h1>
          <p className="text-surface-grey-dark">Zarządzaj członkami swojego zespołu</p>
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
              className="card hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/employees/${employee.uuid}`)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-dark-green flex items-center justify-center mb-4 group-hover:bg-dark-green/80 transition-colors">
                  <span className="text-white font-bold text-lg">
                    {getInitials(employee.firstName, employee.lastName)}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-dark-green transition-colors">
                  {employee.firstName} {employee.lastName}
                </h3>
                
                <div className="flex items-center gap-2 text-surface-grey-dark mb-4">
                  <HiCurrencyDollar className="w-4 h-4" />
                  <span>{employee.hourlyRate} PLN/h</span>
                </div>

                <div className="flex justify-between items-center w-full">
                  <Button
                    size="sm"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssignToolModal(employee);
                    }}
                  >
                    <HiCog className="w-4 h-4 mr-1" />
                    Przypisz narzędzie
                  </Button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownActions
                      actions={[
                        {
                          label: 'Zobacz szczegóły',
                          icon: HiUser,
                          onClick: () => navigate(`/employees/${employee.uuid}`),
                        },
                        {
                          label: 'Edytuj',
                          icon: HiPencil,
                          onClick: () => handleOpenModal(employee),
                        },
                        {
                          label: 'Usuń',
                          icon: HiTrash,
                          onClick: () => handleDelete(employee.uuid!),
                          destructive: true,
                        },
                      ]}
                    />
                  </div>
                </div>
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
              editingEmployee ? 'Aktualizuj pracownika' : 'Utwórz pracownika'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssignToolModal} onClose={handleCloseAssignToolModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Przypisz narzędzie do {selectedEmployeeForTool?.firstName} {selectedEmployeeForTool?.lastName}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmitTool(onSubmitToolAssignment)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Narzędzie
              </label>
              <select
                {...registerTool('toolId', { required: 'Tool is required' })}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
              >
                <option value="">Wybierz narzędzie</option>
                {tools.map((tool) => (
                  <option key={tool.uuid} value={tool.uuid}>
                    {tool.name}{tool.factoryNumber ? ` - ${tool.factoryNumber}` : ''} (Dostępne: {tool.availableQuantity || 0})
                  </option>
                ))}
              </select>
              {toolErrors.toolId && (
                <p className="mt-1 text-sm text-red-400">{toolErrors.toolId.message}</p>
              )}
            </div>

            <Input
              id="quantity"
              label="Ilość"
              type="number"
              min="1"
              {...registerTool('quantity', { 
                required: 'Quantity is required',
                min: { value: 1, message: 'Quantity must be at least 1' }
              })}
              error={toolErrors.quantity?.message}
              className="bg-section-grey-light"
            />

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Stan
              </label>
              <select
                {...registerTool('condition', { required: 'Condition is required' })}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
              >
                <option value={ToolConditionValues.NEW}>{ToolConditionValues.NEW}</option>
                <option value={ToolConditionValues.GOOD}>{ToolConditionValues.GOOD}</option>
                <option value={ToolConditionValues.POOR}>{ToolConditionValues.POOR}</option>
              </select>
              {toolErrors.condition && (
                <p className="mt-1 text-sm text-red-400">{toolErrors.condition.message}</p>
              )}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitTool(onSubmitToolAssignment)}
            disabled={assignToolMutation.isPending}
          >
            {assignToolMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Przypisywanie...
              </div>
            ) : (
              'Przypisz narzędzie'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseAssignToolModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeesPage;