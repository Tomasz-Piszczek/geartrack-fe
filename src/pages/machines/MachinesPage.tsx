import React, { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiUserAdd, HiDocumentText, HiInformationCircle, HiPrinter } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { machinesApi } from '../../api/machines';
import { employeesApi } from '../../api/employees';
import type { MachineDto, CreateMachineInspectionDto, MachineInspectionDto } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { useMachineInspections } from '../../context/MachineInspectionContext';

const getStatusLabel = (status: string | undefined): string => {
  switch (status) {
    case 'SCHEDULED': return 'Oczekuje';
    case 'COMPLETED': return 'Wykonano';
    default: return 'Nieznany';
  }
};

interface MachineFormData {
  name: string;
  factoryNumber: string;
}

interface InspectionFormData {
  inspectionDate: string;
  notes: string;
  performedBy: string;
}

const MachinesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showInspectionHistoryModal, setShowInspectionHistoryModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineDto | null>(null);
  const [assigningMachine, setAssigningMachine] = useState<MachineDto | null>(null);
  const [inspectingMachine, setInspectingMachine] = useState<MachineDto | null>(null);
  const [editingInspection, setEditingInspection] = useState<MachineInspectionDto | null>(null);
  const [viewingMachine, setViewingMachine] = useState<MachineDto | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { getMachineStatus } = useMachineInspections();

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
      toast.success('Maszyna została utworzona');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create machine');
    },
  });

  const updateMutation = useMutation({
    mutationFn: machinesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Maszyna została zaktualizowana');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update machine');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: machinesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Maszyna została usunięta');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete machine');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ machineId, employeeId }: { machineId: string; employeeId: string }) => 
      machinesApi.assign(machineId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Maszyna została przypisana');
      handleCloseAssignModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign machine');
    },
  });

  const inspectionMutation = useMutation({
    mutationFn: ({ machineId, inspection }: { machineId: string; inspection: CreateMachineInspectionDto }) =>
      machinesApi.createInspection(machineId, inspection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      toast.success('Inspekcja dodana pomyślnie');
      handleCloseInspectionModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się dodać inspekcji');
    },
  });

  const completeInspectionMutation = useMutation({
    mutationFn: (inspection: MachineInspectionDto) =>
      machinesApi.updateInspection(inspection.uuid!, {
        inspectionDate: inspection.inspectionDate,
        notes: inspection.notes,
        status: 'COMPLETED',
        performedBy: inspection.performedBy!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES, viewingMachine?.uuid, 'inspections'] });
      toast.success('Inspekcja zakończona');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się zakończyć inspekcji');
    },
  });

  const updateInspectionMutation = useMutation({
    mutationFn: ({ inspectionId, data }: { inspectionId: string; data: CreateMachineInspectionDto }) =>
      machinesApi.updateInspection(inspectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES, viewingMachine?.uuid, 'inspections'] });
      toast.success('Inspekcja zaktualizowana');
      handleCloseInspectionModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się zaktualizować inspekcji');
    },
  });

  const deleteInspectionMutation = useMutation({
    mutationFn: machinesApi.deleteInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MACHINES, viewingMachine?.uuid, 'inspections'] });
      toast.success('Inspekcja usunięta');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się usunąć inspekcji');
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

  const handleOpenInspectionModal = (machine: MachineDto, inspection?: MachineInspectionDto) => {
    // Close history modal if open (when editing from history)
    setShowInspectionHistoryModal(false);
    setInspectingMachine(machine);
    setEditingInspection(inspection || null);
    if (inspection) {
      resetInspection({
        inspectionDate: inspection.inspectionDate,
        notes: inspection.notes || '',
        performedBy: inspection.performedBy || '',
      });
    } else {
      resetInspection({
        inspectionDate: new Date().toISOString().split('T')[0],
        notes: '',
        performedBy: '',
      });
    }
    setShowInspectionModal(true);
  };

  const handleCloseInspectionModal = () => {
    const wasEditing = editingInspection !== null;
    const machineToReopen = inspectingMachine;

    setShowInspectionModal(false);
    setInspectingMachine(null);
    setEditingInspection(null);
    resetInspection();

    // Re-open history modal if we were editing from it
    if (wasEditing && machineToReopen) {
      setViewingMachine(machineToReopen);
      setShowInspectionHistoryModal(true);
    }
  };

  const handleOpenInspectionHistoryModal = (machine: MachineDto) => {
    setViewingMachine(machine);
    setShowInspectionHistoryModal(true);
  };

  const handleCloseInspectionHistoryModal = () => {
    setShowInspectionHistoryModal(false);
    setViewingMachine(null);
  };

  const handlePrintInspectionNotes = (inspection: MachineInspectionDto) => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #000;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>${inspection.notes || ''}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
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
    if (editingInspection) {
      updateInspectionMutation.mutate({
        inspectionId: editingInspection.uuid!,
        data: {
          inspectionDate: data.inspectionDate,
          notes: data.notes || undefined,
          status: editingInspection.status,
          performedBy: data.performedBy,
        }
      });
    } else if (inspectingMachine) {
      inspectionMutation.mutate({
        machineId: inspectingMachine.uuid!,
        inspection: {
          inspectionDate: data.inspectionDate,
          notes: data.notes || undefined,
          status: 'SCHEDULED',
          performedBy: data.performedBy,
        }
      });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę inspekcję?')) {
      deleteInspectionMutation.mutate(inspectionId);
    }
  };

  const handleDelete = (id: string) => {
    const confirmMessage = 'Czy na pewno chcesz usunąć tę maszynę?\n\nUwaga: To usunie przypisanie maszyny od pracownika i usunie całą historię inspekcji. Tej akcji nie można cofnąć.';
    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Maszyny</h1>
          <p className="text-surface-grey-dark">Zarządzaj inwentarzem maszyn</p>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Dodaj maszynę
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Szukaj maszyn..."
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
              <Table.HeadCell className="bg-section-grey-dark text-white">Nazwa</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Numer fabryczny</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Przypisana do</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Następna inspekcja</Table.HeadCell>
              <Table.HeadCell className="bg-section-grey-dark text-white">Akcje</Table.HeadCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center text-white">
                  Ładowanie...
                </Table.Cell>
              </Table.Row>
            ) : filteredMachines.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center text-surface-grey-dark">
                  Nie znaleziono maszyn
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredMachines.map((machine) => {
                const status = getMachineStatus(machine.uuid!);
                return (
                <Table.Row key={machine.uuid} className="hover:bg-section-grey-light cursor-pointer" onClick={() => handleOpenInspectionHistoryModal(machine)}>
                  <Table.Cell className="text-white">
                    <div className="flex items-center gap-2">
                      {machine.name}
                      {status === 'overdue' && (
                        <HiInformationCircle className="w-5 h-5 text-red-500" title="Inspekcja przeterminowana" />
                      )}
                      {status === 'due-soon' && (
                        <HiInformationCircle className="w-5 h-5 text-orange-500" title="Inspekcja wkrótce" />
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-white">{machine.factoryNumber}</Table.Cell>
                  <Table.Cell className="text-white">
                    {machine.employeeName || 'Nieprzypisana'}
                  </Table.Cell>
                  <Table.Cell className="text-white">
                    {machine.nextInspectionDate ? 
                      new Date(machine.nextInspectionDate).toLocaleDateString() : 
                      'Nie zaplanowano'
                    }
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInspectionModal(machine);
                        }}
                        title="Dodaj inspekcję"
                      >
                        <HiDocumentText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(machine);
                        }}
                        title="Przypisz pracownika"
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
                        title="Edytuj maszynę"
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
                        title="Usuń maszynę"
                      >
                        <HiTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );})
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Create/Edit Machine Modal */}
      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingMachine ? 'Edytuj maszynę' : 'Dodaj nową maszynę'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Nazwa"
              {...register('name', { required: VALIDATION.REQUIRED })}
              error={errors.name?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="factoryNumber"
              label="Numer fabryczny"
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
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                {editingMachine ? 'Aktualizowanie...' : 'Tworzenie...'}
              </div>
            ) : (
              editingMachine ? 'Aktualizuj maszynę' : 'Utwórz maszynę'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Machine Modal */}
      <Modal show={showAssignModal} onClose={handleCloseAssignModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Przypisz maszynę: {assigningMachine?.name}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <Select
            id="employee"
            label="Wybierz pracownika"
            value={selectedEmployeeId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEmployeeId(e.target.value)}
            className="bg-section-grey-light"
          >
            <option value="">Wybierz pracownika</option>
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
          >
            {assignMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Przypisywanie...
              </div>
            ) : (
              'Przypisz maszynę'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseAssignModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Inspection Modal */}
      <Modal show={showInspectionModal} onClose={handleCloseInspectionModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingInspection ? 'Edytuj inspekcję' : 'Dodaj inspekcję'} - {inspectingMachine?.name}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleInspectionSubmit(onInspectionSubmit)} className="space-y-4">
            <Input
              id="inspectionDate"
              label="Data inspekcji"
              type="date"
              {...registerInspection('inspectionDate', { required: VALIDATION.REQUIRED })}
              error={inspectionErrors.inspectionDate?.message}
              className="bg-section-grey-light"
            />

            <div>
              <label htmlFor="performedBy" className="block text-sm font-medium text-white mb-2">
                Wykonał
              </label>
              <input
                id="performedBy"
                list="employees-list"
                {...registerInspection('performedBy', { required: VALIDATION.REQUIRED })}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-dark-green"
                placeholder="Wybierz lub wpisz imię i nazwisko..."
              />
              <datalist id="employees-list">
                {employees.map((employee) => (
                  <option key={employee.uuid} value={`${employee.firstName} ${employee.lastName}`} />
                ))}
              </datalist>
              {inspectionErrors.performedBy && (
                <p className="mt-1 text-sm text-red-400">{inspectionErrors.performedBy.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
                Notatki
              </label>
              <textarea
                id="notes"
                rows={4}
                {...registerInspection('notes')}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
                placeholder="Dodatkowe notatki lub uwagi..."
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
            disabled={inspectionMutation.isPending || updateInspectionMutation.isPending}
          >
            {inspectionMutation.isPending || updateInspectionMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                {editingInspection ? 'Aktualizowanie...' : 'Dodawanie...'}
              </div>
            ) : (
              editingInspection ? 'Zapisz zmiany' : 'Dodaj inspekcję'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseInspectionModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Inspection History Modal */}
      <Modal show={showInspectionHistoryModal} onClose={handleCloseInspectionHistoryModal} size="5xl" className="!max-w-7xl">
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Historia inspekcji - {viewingMachine?.name}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey max-h-[70vh] overflow-y-auto">
          {isLoadingInspections ? (
            <div className="text-center text-white py-4">Ładowanie historii inspekcji...</div>
          ) : inspectionHistory.length === 0 ? (
            <div className="text-center text-surface-grey-dark py-8">
              <HiDocumentText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nie znaleziono inspekcji</p>
              <p className="text-sm text-surface-grey">Ta maszyna nie ma jeszcze historii inspekcji</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Data</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Wykonał</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Status</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Notatki</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Akcje</Table.HeadCell>
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
                        {inspection.performedBy || '-'}
                      </Table.Cell>
                      <Table.Cell className="text-white">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          inspection.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                          inspection.status === 'SCHEDULED' ? 'bg-blue-900 text-blue-300' :
                          'bg-gray-900 text-gray-300'
                        }`}>
                          {getStatusLabel(inspection.status)}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-white">
                        {inspection.notes ? (
                          <div className="max-w-md">
                            <p className="whitespace-pre-wrap break-words text-sm">
                              {inspection.notes}
                            </p>
                          </div>
                        ) : '-'}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          {inspection.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              color="primary"
                              onClick={() => completeInspectionMutation.mutate(inspection)}
                              disabled={completeInspectionMutation.isPending}
                            >
                              Zakończ
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="primary"
                            onClick={() => handlePrintInspectionNotes(inspection)}
                            title="Drukuj notatki"
                          >
                            <HiPrinter className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="gray"
                            onClick={() => handleOpenInspectionModal(viewingMachine!, inspection)}
                            title="Edytuj inspekcję"
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleDeleteInspection(inspection.uuid!)}
                            disabled={deleteInspectionMutation.isPending}
                            title="Usuń inspekcję"
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button color="gray" onClick={handleCloseInspectionHistoryModal}>
            Zamknij
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MachinesPage;