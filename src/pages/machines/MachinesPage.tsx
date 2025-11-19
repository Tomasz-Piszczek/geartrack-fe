import React, { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiUserAdd, HiDocumentText } from 'react-icons/hi';
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

interface InspectionFormData {
  inspectionDate: string;
  notes: string;
}

const MachinesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showInspectionHistoryModal, setShowInspectionHistoryModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineDto | null>(null);
  const [assigningMachine, setAssigningMachine] = useState<MachineDto | null>(null);
  const [inspectingMachine, setInspectingMachine] = useState<MachineDto | null>(null);
  const [viewingMachine, setViewingMachine] = useState<MachineDto | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: machines = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.MACHINES],
    queryFn: machinesApi.getAllNonPaginated,
  });

  const { data: employees = [] } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: employeesApi.getAllNonPaginated,
  });

  const { data: inspectionHistory = [], isLoading: isLoadingInspections } = useQuery({
    queryKey: [QUERY_KEYS.MACHINES, viewingMachine?.uuid, 'inspections'],
    queryFn: () => machinesApi.getMachineInspectionHistory(viewingMachine!.uuid!),
    enabled: !!viewingMachine?.uuid,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MachineFormData>();

  const {
    register: registerInspection,
    handleSubmit: handleInspectionSubmit,
    formState: { errors: inspectionErrors },
    reset: resetInspection,
  } = useForm<InspectionFormData>();

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

  const inspectionMutation = useMutation({
    mutationFn: machinesApi.createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Inspection added successfully');
      handleCloseInspectionModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add inspection');
    },
  });

  const filteredMachines = Array.isArray(machines) ? machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.factoryNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

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

  const handleOpenInspectionModal = (machine: MachineDto) => {
    setInspectingMachine(machine);
    resetInspection({
      inspectionDate: new Date().toISOString().split('T')[0], // Today's date
      notes: '',
    });
    setShowInspectionModal(true);
  };

  const handleCloseInspectionModal = () => {
    setShowInspectionModal(false);
    setInspectingMachine(null);
    resetInspection();
  };

  const handleOpenInspectionHistoryModal = (machine: MachineDto) => {
    setViewingMachine(machine);
    setShowInspectionHistoryModal(true);
  };

  const handleCloseInspectionHistoryModal = () => {
    setShowInspectionHistoryModal(false);
    setViewingMachine(null);
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

  const onInspectionSubmit = (data: InspectionFormData) => {
    if (inspectingMachine) {
      inspectionMutation.mutate({
        machineId: inspectingMachine.uuid!,
        inspectionDate: data.inspectionDate,
        notes: data.notes || undefined,
        status: 'SCHEDULED',
      });
    }
  };

  const handleDelete = (id: string) => {
    const confirmMessage = 'Are you sure you want to delete this machine?\n\nWarning: This will remove the machine assignment from the employee and delete all inspection history. This action cannot be undone.';
    if (window.confirm(confirmMessage)) {
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
            <Table.Row>
              <Table.HeadCell className="bg-section-grey-dark text-white">Name</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Factory Number</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Assigned To</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Next Inspection</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Actions</Table.HeadCell>
            </Table.Row>
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
                <Table.Row key={machine.uuid} className="hover:bg-section-grey-light cursor-pointer" onClick={() => handleOpenInspectionHistoryModal(machine)}>
                  <Table.Cell className="text-white">{machine.name}</Table.Cell>
                  <Table.Cell className="text-white">{machine.factoryNumber}</Table.Cell>
                  <Table.Cell className="text-white">
                    {machine.employeeName || 'Unassigned'}
                  </Table.Cell>
                  <Table.Cell className="text-white">
                    {machine.nextInspectionDate ? 
                      new Date(machine.nextInspectionDate).toLocaleDateString() : 
                      'Not scheduled'
                    }
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInspectionModal(machine);
                        }}
                        title="Add Inspection"
                      >
                        <HiDocumentText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(machine);
                        }}
                        title="Assign Employee"
                      >
                        <HiUserAdd className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(machine);
                        }}
                        title="Edit Machine"
                      >
                        <HiPencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(machine.uuid!);
                        }}
                        title="Delete Machine"
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

      {/* Add Inspection Modal */}
      <Modal show={showInspectionModal} onClose={handleCloseInspectionModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Add Inspection for: {inspectingMachine?.name}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleInspectionSubmit(onInspectionSubmit)} className="space-y-4">
            <Input
              id="inspectionDate"
              label="Inspection Date"
              type="date"
              {...registerInspection('inspectionDate', { required: VALIDATION.REQUIRED })}
              error={inspectionErrors.inspectionDate?.message}
              className="bg-section-grey-light"
            />

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                {...registerInspection('notes')}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
                placeholder="Any additional notes or findings..."
              />
              {inspectionErrors.notes && (
                <p className="mt-1 text-sm text-red-400">{inspectionErrors.notes.message}</p>
              )}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleInspectionSubmit(onInspectionSubmit)}
            disabled={inspectionMutation.isPending}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {inspectionMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Adding...
              </div>
            ) : (
              'Add Inspection'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseInspectionModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Inspection History Modal */}
      <Modal show={showInspectionHistoryModal} onClose={handleCloseInspectionHistoryModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Inspection History - {viewingMachine?.name}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          {isLoadingInspections ? (
            <div className="text-center text-white py-4">Loading inspection history...</div>
          ) : inspectionHistory.length === 0 ? (
            <div className="text-center text-surface-grey-dark py-8">
              <HiDocumentText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No inspections found</p>
              <p className="text-sm text-surface-grey">This machine has no inspection history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-section-grey-light p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Total Inspections</h4>
                  <p className="text-2xl font-bold text-dark-green">{inspectionHistory.length}</p>
                </div>
                <div className="bg-section-grey-light p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Last Inspection</h4>
                  <p className="text-white">
                    {inspectionHistory.length > 0 
                      ? new Date(inspectionHistory[0].inspectionDate).toLocaleDateString() 
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              
              <div className="table-wrapper max-h-96 overflow-y-auto">
                <Table hoverable>
                  <Table.Head>
                    <Table.HeadCell className="bg-section-grey-dark text-white">Date</Table.HeadCell>
                    <Table.HeadCell className="bg-section-grey-dark text-white">Status</Table.HeadCell>
                    <Table.HeadCell className="bg-section-grey-dark text-white">Notes</Table.HeadCell>
                  </Table.Head>
                  <Table.Body>
                    {inspectionHistory
                      .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
                      .map((inspection) => (
                      <Table.Row key={inspection.uuid} className="hover:bg-section-grey-light">
                        <Table.Cell className="text-white">
                          {new Date(inspection.inspectionDate).toLocaleDateString()}
                        </Table.Cell>
                        <Table.Cell className="text-white">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            inspection.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                            inspection.status === 'SCHEDULED' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-900 text-gray-300'
                          }`}>
                            {inspection.status || 'Unknown'}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-white max-w-xs truncate">
                          {inspection.notes || '-'}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button color="gray" onClick={handleCloseInspectionHistoryModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MachinesPage;