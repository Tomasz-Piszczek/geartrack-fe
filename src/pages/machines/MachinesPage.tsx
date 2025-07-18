import React, { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiUserAdd } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { machinesApi } from '../../api/machines';
import { employeesApi } from '../../api/employees';
import type { MachineDto } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';

interface MachineFormData {
  name: string;
  factoryNumber: string;
}

const MachinesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineDto | null>(null);
  const [assigningMachine, setAssigningMachine] = useState<MachineDto | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: machines = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.MACHINES],
    queryFn: machinesApi.getAll,
  });

  const { data: employees = [] } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: employeesApi.getAll,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MachineFormData>();

  const createMutation = useMutation({
    mutationFn: machinesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Machine created successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create machine');
    },
  });

  const updateMutation = useMutation({
    mutationFn: machinesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Machine updated successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update machine');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: machinesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Machine deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete machine');
    },
  });

  const assignMutation = useMutation({
    mutationFn: machinesApi.assign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Machine assigned successfully');
      handleCloseAssignModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign machine');
    },
  });

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.factoryNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (machine?: MachineDto) => {
    setEditingMachine(machine || null);
    if (machine) {
      reset({
        name: machine.name,
        factoryNumber: machine.factoryNumber,
      });
    } else {
      reset({
        name: '',
        factoryNumber: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMachine(null);
    reset();
  };

  const handleOpenAssignModal = (machine: MachineDto) => {
    setAssigningMachine(machine);
    setSelectedEmployeeId(machine.employeeId || '');
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssigningMachine(null);
    setSelectedEmployeeId('');
  };

  const onSubmit = (data: MachineFormData) => {
    if (editingMachine) {
      updateMutation.mutate({
        ...editingMachine,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAssign = () => {
    if (assigningMachine && selectedEmployeeId) {
      assignMutation.mutate({
        machineId: assigningMachine.uuid!,
        employeeId: selectedEmployeeId,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Machines</h1>
          <p className="text-surface-grey-dark">Manage your machine inventory</p>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
          className="bg-dark-green hover:bg-dark-green/80"
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Add Machine
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="bg-section-grey"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell className="bg-section-grey-dark text-white">Name</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Factory Number</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Assigned To</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Status</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center text-white">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : filteredMachines.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center text-surface-grey-dark">
                  No machines found
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredMachines.map((machine) => (
                <Table.Row key={machine.uuid} className="hover:bg-section-grey-light">
                  <Table.Cell className="text-white">{machine.name}</Table.Cell>
                  <Table.Cell className="text-white">{machine.factoryNumber}</Table.Cell>
                  <Table.Cell className="text-white">
                    {machine.employeeName || 'Unassigned'}
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`badge ${machine.employeeId ? 'badge-success' : 'badge-info'}`}>
                      {machine.employeeId ? 'Assigned' : 'Available'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() => handleOpenAssignModal(machine)}
                      >
                        <HiUserAdd className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() => handleOpenModal(machine)}
                      >
                        <HiPencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete(machine.uuid!)}
                      >
                        <HiTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Create/Edit Machine Modal */}
      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingMachine ? 'Edit Machine' : 'Add New Machine'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Name"
              {...register('name', { required: VALIDATION.REQUIRED })}
              error={errors.name?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="factoryNumber"
              label="Factory Number"
              {...register('factoryNumber', { required: VALIDATION.REQUIRED })}
              error={errors.factoryNumber?.message}
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
                {editingMachine ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              editingMachine ? 'Update Machine' : 'Create Machine'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Machine Modal */}
      <Modal show={showAssignModal} onClose={handleCloseAssignModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Assign Machine: {assigningMachine?.name}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <Select
            id="employee"
            label="Select Employee"
            value={selectedEmployeeId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEmployeeId(e.target.value)}
            className="bg-section-grey-light"
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.uuid} value={employee.uuid}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </Select>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleAssign}
            disabled={assignMutation.isPending || !selectedEmployeeId}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {assignMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Assigning...
              </div>
            ) : (
              'Assign Machine'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseAssignModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MachinesPage;