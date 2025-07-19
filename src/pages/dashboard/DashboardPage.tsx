import React, { useState } from 'react';
import { HiCog, HiDesktopComputer, HiUsers, HiCollection } from 'react-icons/hi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../api/employees';
import { machinesApi } from '../../api/machines';
import { toolsApi } from '../../api/tools';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

interface MachineFormData {
  name: string;
  factoryNumber: string;
}

interface ToolFormData {
  name: string;
  factoryNumber: string;
  size: string;
  quantity: number;
  value: number;
}

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const { data: employees = [] } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: employeesApi.getAllNonPaginated,
  });

  const { data: machines = [] } = useQuery({
    queryKey: [QUERY_KEYS.MACHINES],
    queryFn: machinesApi.getAllNonPaginated,
  });

  const { data: tools = [] } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });

  // Form hooks
  const {
    register: registerEmployee,
    handleSubmit: handleSubmitEmployee,
    formState: { errors: employeeErrors },
    reset: resetEmployee,
  } = useForm<EmployeeFormData>();

  const {
    register: registerMachine,
    handleSubmit: handleSubmitMachine,
    formState: { errors: machineErrors },
    reset: resetMachine,
  } = useForm<MachineFormData>();

  const {
    register: registerTool,
    handleSubmit: handleSubmitTool,
    formState: { errors: toolErrors },
    reset: resetTool,
  } = useForm<ToolFormData>();

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee created successfully');
      handleCloseEmployeeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });

  const createMachineMutation = useMutation({
    mutationFn: machinesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Machine created successfully');
      handleCloseMachineModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create machine');
    },
  });

  const createToolMutation = useMutation({
    mutationFn: toolsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Tool created successfully');
      handleCloseToolModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tool');
    },
  });

  // Handler functions
  const handleOpenEmployeeModal = () => {
    resetEmployee({ firstName: '', lastName: '', hourlyRate: 0 });
    setShowEmployeeModal(true);
  };

  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    resetEmployee();
  };

  const handleOpenMachineModal = () => {
    resetMachine({ name: '', factoryNumber: '' });
    setShowMachineModal(true);
  };

  const handleCloseMachineModal = () => {
    setShowMachineModal(false);
    resetMachine();
  };

  const handleOpenToolModal = () => {
    resetTool({ name: '', factoryNumber: '', size: '', quantity: 0, value: 0 });
    setShowToolModal(true);
  };

  const handleCloseToolModal = () => {
    setShowToolModal(false);
    resetTool();
  };

  const onSubmitEmployee = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  const onSubmitMachine = (data: MachineFormData) => {
    createMachineMutation.mutate(data);
  };

  const onSubmitTool = (data: ToolFormData) => {
    createToolMutation.mutate(data);
  };

  const statsCards = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: HiUsers,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Machines',
      value: machines.length,
      icon: HiDesktopComputer,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Tools',
      value: tools.length,
      icon: HiCog,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Assigned Items',
      value: machines.filter(m => m.employeeId).length + tools.reduce((acc, tool) => acc + tool.quantity, 0),
      icon: HiCollection,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-surface-grey-dark">Welcome to GearTrack - Equipment Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <Card key={index} className="bg-section-grey border-lighter-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-grey-dark">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-section-grey border-lighter-border">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-section-grey-light rounded-lg">
              <HiUsers className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-white text-sm">New employee added</p>
                <p className="text-surface-grey-dark text-xs">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-section-grey-light rounded-lg">
              <HiDesktopComputer className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white text-sm">Machine assigned</p>
                <p className="text-surface-grey-dark text-xs">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-section-grey-light rounded-lg">
              <HiCog className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-white text-sm">Tool inventory updated</p>
                <p className="text-surface-grey-dark text-xs">1 day ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-section-grey border-lighter-border">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleOpenEmployeeModal}
              className="w-full p-3 bg-dark-green hover:bg-dark-green/80 rounded-lg text-white text-left transition-colors"
            >
              <HiUsers className="w-5 h-5 inline mr-2" />
              Add New Employee
            </button>
            <button 
              onClick={handleOpenMachineModal}
              className="w-full p-3 bg-dark-green hover:bg-dark-green/80 rounded-lg text-white text-left transition-colors"
            >
              <HiDesktopComputer className="w-5 h-5 inline mr-2" />
              Register New Machine
            </button>
            <button 
              onClick={handleOpenToolModal}
              className="w-full p-3 bg-dark-green hover:bg-dark-green/80 rounded-lg text-white text-left transition-colors"
            >
              <HiCog className="w-5 h-5 inline mr-2" />
              Add Tool to Inventory
            </button>
          </div>
        </Card>
      </div>

      {/* Add Employee Modal */}
      <Modal show={showEmployeeModal} onClose={handleCloseEmployeeModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Add New Employee</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmitEmployee(onSubmitEmployee)} className="space-y-4">
            <Input
              id="firstName"
              label="First Name"
              {...registerEmployee('firstName', { required: VALIDATION.REQUIRED })}
              error={employeeErrors.firstName?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="lastName"
              label="Last Name"
              {...registerEmployee('lastName', { required: VALIDATION.REQUIRED })}
              error={employeeErrors.lastName?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="hourlyRate"
              label="Hourly Rate ($)"
              type="number"
              step="0.01"
              {...registerEmployee('hourlyRate', { 
                required: VALIDATION.REQUIRED,
                min: { value: 0, message: VALIDATION.POSITIVE_NUMBER }
              })}
              error={employeeErrors.hourlyRate?.message}
              className="bg-section-grey-light"
            />
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitEmployee(onSubmitEmployee)}
            disabled={createEmployeeMutation.isPending}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {createEmployeeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Creating...
              </div>
            ) : (
              'Create Employee'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseEmployeeModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Machine Modal */}
      <Modal show={showMachineModal} onClose={handleCloseMachineModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Register New Machine</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmitMachine(onSubmitMachine)} className="space-y-4">
            <Input
              id="name"
              label="Machine Name"
              {...registerMachine('name', { required: VALIDATION.REQUIRED })}
              error={machineErrors.name?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="factoryNumber"
              label="Factory Number"
              {...registerMachine('factoryNumber', { required: VALIDATION.REQUIRED })}
              error={machineErrors.factoryNumber?.message}
              className="bg-section-grey-light"
            />
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitMachine(onSubmitMachine)}
            disabled={createMachineMutation.isPending}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {createMachineMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Creating...
              </div>
            ) : (
              'Register Machine'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseMachineModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Tool Modal */}
      <Modal show={showToolModal} onClose={handleCloseToolModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Add Tool to Inventory</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmitTool(onSubmitTool)} className="space-y-4">
            <Input
              id="name"
              label="Tool Name"
              {...registerTool('name', { required: VALIDATION.REQUIRED })}
              error={toolErrors.name?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="factoryNumber"
              label="Factory Number"
              {...registerTool('factoryNumber', { required: VALIDATION.REQUIRED })}
              error={toolErrors.factoryNumber?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="size"
              label="Size"
              {...registerTool('size')}
              error={toolErrors.size?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="quantity"
              label="Quantity"
              type="number"
              {...registerTool('quantity', { 
                required: VALIDATION.REQUIRED,
                min: { value: 1, message: 'Quantity must be at least 1' }
              })}
              error={toolErrors.quantity?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="value"
              label="Value ($)"
              type="number"
              step="0.01"
              {...registerTool('value', { 
                required: VALIDATION.REQUIRED,
                min: { value: 0, message: VALIDATION.POSITIVE_NUMBER }
              })}
              error={toolErrors.value?.message}
              className="bg-section-grey-light"
            />
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitTool(onSubmitTool)}
            disabled={createToolMutation.isPending}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {createToolMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Adding...
              </div>
            ) : (
              'Add Tool'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseToolModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardPage;