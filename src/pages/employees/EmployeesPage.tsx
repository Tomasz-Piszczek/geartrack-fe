import React, { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiUser, HiCurrencyDollar } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../api/employees';
import type { EmployeeDto } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Modal from '../../components/common/Modal';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

const EmployeesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: employeesApi.getAll,
  });

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

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Employees</h1>
          <p className="text-surface-grey-dark">Manage your team members</p>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
          className="bg-dark-green hover:bg-dark-green/80"
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="bg-section-grey"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center text-surface-grey-dark py-12">
          <HiUser className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No employees found</p>
          <p className="text-sm">Add your first employee to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.uuid} className="card hover:shadow-lg transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-dark-green flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">
                    {getInitials(employee.firstName, employee.lastName)}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  {employee.firstName} {employee.lastName}
                </h3>
                
                <div className="flex items-center gap-2 text-surface-grey-dark mb-4">
                  <HiCurrencyDollar className="w-4 h-4" />
                  <span>${employee.hourlyRate}/hour</span>
                </div>

                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => handleOpenModal(employee)}
                    className="flex-1"
                  >
                    <HiPencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="failure"
                    onClick={() => handleDelete(employee.uuid!)}
                    className="flex-1"
                  >
                    <HiTrash className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="firstName"
              label="First Name"
              {...register('firstName', { required: VALIDATION.REQUIRED })}
              error={errors.firstName?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="lastName"
              label="Last Name"
              {...register('lastName', { required: VALIDATION.REQUIRED })}
              error={errors.lastName?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="hourlyRate"
              label="Hourly Rate ($)"
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
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                {editingEmployee ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              editingEmployee ? 'Update Employee' : 'Create Employee'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeesPage;