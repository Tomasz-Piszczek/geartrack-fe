import React, { useState, useMemo } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiChevronDown, HiChevronRight, HiCheck, HiX } from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toolsApi } from '../../api/tools';
import { toolGroupsApi } from '../../api/toolGroups';
import type { ToolDto, ToolGroupDto } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface ToolFormData {
  name: string;
  factoryNumber?: string;
  quantity: number;
  value: number;
  groupId?: string;
}

const ToolsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolDto | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });

  const { data: toolGroups = [] } = useQuery({
    queryKey: [QUERY_KEYS.TOOL_GROUPS],
    queryFn: toolGroupsApi.getAll,
  });

  const { data: toolAssignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS, selectedTool?.uuid, 'assignments'],
    queryFn: () => toolsApi.getEmployeesAssignedToTool(selectedTool!.uuid!),
    enabled: !!selectedTool?.uuid,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ToolFormData>();

  const selectedGroupId = watch('groupId');

  const createMutation = useMutation({
    mutationFn: toolsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Narzędzie zostało utworzone');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tool');
    },
  });

  const updateMutation = useMutation({
    mutationFn: toolsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Narzędzie zostało zaktualizowane');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tool');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: toolsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Narzędzie zostało usunięte');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tool');
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: toolGroupsApi.create,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOL_GROUPS] });
      toast.success('Grupa została utworzona');
      setShowNewGroupInput(false);
      setNewGroupName('');
      setValue('groupId', newGroup.uuid);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create group');
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: toolGroupsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOL_GROUPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Nazwa grupy została zaktualizowana');
      setEditingGroupId(null);
      setEditingGroupName('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update group');
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: toolGroupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOL_GROUPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Grupa została usunięta');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete group');
    },
  });

  const filteredTools = tools.filter(tool => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    const toolName = tool.name?.toLowerCase() || '';
    const factoryNumber = tool.factoryNumber?.toLowerCase() || '';
    return toolName.includes(search) || factoryNumber.includes(search);
  });

  const groupedTools = useMemo(() => {
    const groups = new Map<string, { group: ToolGroupDto | null; tools: ToolDto[] }>();

    toolGroups.forEach(group => {
      groups.set(group.uuid!, { group, tools: [] });
    });

    groups.set('ungrouped', { group: null, tools: [] });

    filteredTools.forEach(tool => {
      const key = tool.groupId || 'ungrouped';
      if (groups.has(key)) {
        groups.get(key)!.tools.push(tool);
      } else {
        groups.get('ungrouped')!.tools.push(tool);
      }
    });

    return groups;
  }, [filteredTools, toolGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleOpenModal = (tool?: ToolDto) => {
    setEditingTool(tool || null);
    if (tool) {
      reset({
        name: tool.name,
        factoryNumber: tool.factoryNumber,
        quantity: tool.quantity,
        value: tool.value,
        groupId: tool.groupId || '',
      });
    } else {
      reset({
        name: '',
        factoryNumber: '',
        quantity: 0,
        value: 0,
        groupId: '',
      });
    }
    setShowNewGroupInput(false);
    setNewGroupName('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTool(null);
    setShowNewGroupInput(false);
    setNewGroupName('');
    reset();
  };

  const onSubmit = (data: ToolFormData) => {
    const toolData = {
      ...data,
      groupId: data.groupId || undefined,
    };
    if (editingTool) {
      updateMutation.mutate({
        ...editingTool,
        ...toolData,
      });
    } else {
      createMutation.mutate(toolData);
    }
  };

  const handleDelete = (id: string) => {
    const confirmMessage = 'Czy na pewno chcesz usunąć to narzędzie?\n\nUwaga: To usunie narzędzie od wszystkich pracowników, którzy obecnie mają je przypisane i nie można tego cofnąć.';
    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAssignmentModal = (tool: ToolDto) => {
    setSelectedTool(tool);
    setShowAssignmentModal(true);
  };

  const handleCloseAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedTool(null);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroupMutation.mutate({ name: newGroupName.trim() });
    }
  };

  const handleStartEditGroup = (group: ToolGroupDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(group.uuid!);
    setEditingGroupName(group.name);
  };

  const handleSaveGroupName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingGroupName.trim() && editingGroupId) {
      updateGroupMutation.mutate({ uuid: editingGroupId, name: editingGroupName.trim() });
    }
  };

  const handleCancelEditGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Czy na pewno chcesz usunąć tę grupę? Narzędzia w tej grupie zostaną przeniesione do "Bez grupy".')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Narzędzia</h1>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Dodaj narzędzie
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Szukaj narzędzi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-section-grey"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-white py-8">Ładowanie...</div>
        ) : (
          Array.from(groupedTools.entries()).map(([groupId, { group, tools: groupTools }]) => {
            if (groupTools.length === 0 && groupId === 'ungrouped') return null;

            return (
              <div key={groupId} className="rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 bg-section-grey-dark cursor-pointer hover:bg-section-grey-light transition-colors"
                  onClick={() => toggleGroup(groupId)}
                >
                  {expandedGroups.has(groupId) ? (
                    <HiChevronDown className="w-5 h-5 text-white flex-shrink-0" />
                  ) : (
                    <HiChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                  )}

                  {editingGroupId === groupId ? (
                    <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        className="bg-section-grey-light text-white rounded px-2 py-1 flex-1"
                        autoFocus
                      />
                      <Button size="sm" color="primary" onClick={handleSaveGroupName}>
                        <HiCheck className="w-4 h-4" />
                      </Button>
                      <Button size="sm" color="gray" onClick={handleCancelEditGroup}>
                        <HiX className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-white font-medium flex-1">
                        {group?.name || 'Bez grupy'}
                      </span>
                      <span className="text-surface-grey-dark">({groupTools.length})</span>
                      {group && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            color="gray"
                            onClick={(e) => handleStartEditGroup(group, e)}
                          >
                            <HiPencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={(e) => handleDeleteGroup(group.uuid!, e)}
                          >
                            <HiTrash className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {expandedGroups.has(groupId) && groupTools.length > 0 && (
                  <div className="table-wrapper">
                    <Table hoverable>
                      <Table.Head>
                        <Table.HeadCell className="bg-section-grey text-white">Nazwa</Table.HeadCell>
                        <Table.HeadCell className="bg-section-grey text-white">Numer fabryczny</Table.HeadCell>
                        <Table.HeadCell className="bg-section-grey text-white">Dostępne</Table.HeadCell>
                        <Table.HeadCell className="bg-section-grey text-white">Wartość</Table.HeadCell>
                        <Table.HeadCell className="bg-section-grey text-white">Akcje</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {groupTools.map((tool) => (
                          <Table.Row key={tool.uuid} className="hover:bg-section-grey-light cursor-pointer" onClick={() => handleOpenAssignmentModal(tool)}>
                            <Table.Cell className="text-white">{tool.name}</Table.Cell>
                            <Table.Cell className="text-white">{tool.factoryNumber || '-'}</Table.Cell>
                            <Table.Cell className="text-white">{tool.availableQuantity || 0}</Table.Cell>
                            <Table.Cell className="text-white">{tool.value.toFixed(2)}zł</Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  color="gray"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal(tool);
                                  }}
                                >
                                  <HiPencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  color="failure"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(tool.uuid!);
                                  }}
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

                {expandedGroups.has(groupId) && groupTools.length === 0 && (
                  <div className="bg-section-grey p-4 text-center text-surface-grey-dark">
                    Brak narzędzi w tej grupie
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingTool ? 'Edytuj narzędzie' : 'Dodaj nowe narzędzie'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-1">Grupa</label>
              {showNewGroupInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nazwa nowej grupy"
                    className="flex-1 bg-section-grey-light text-white rounded-lg p-2.5 border border-lighter-border"
                  />
                  <Button
                    type="button"
                    color="primary"
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending}
                    loading={createGroupMutation.isPending}
                  >
                    <HiCheck className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    color="gray"
                    onClick={() => {
                      setShowNewGroupInput(false);
                      setNewGroupName('');
                    }}
                  >
                    <HiX className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    {...register('groupId')}
                    className="flex-1 bg-section-grey-light text-white rounded-lg p-2.5 border border-lighter-border"
                  >
                    <option value="">Bez grupy</option>
                    {toolGroups.map((group) => (
                      <option key={group.uuid} value={group.uuid}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    color="gray"
                    onClick={() => setShowNewGroupInput(true)}
                  >
                    <HiPlus className="w-4 h-4 mr-1" />
                    Dodaj nową grupę
                  </Button>
                </div>
              )}
            </div>

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
              {...register('factoryNumber')}
              error={errors.factoryNumber?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="quantity"
              label="Ilość"
              type="number"
              {...register('quantity', {
                required: VALIDATION.REQUIRED,
                min: { value: 0, message: VALIDATION.POSITIVE_NUMBER }
              })}
              error={errors.quantity?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="value"
              label="Wartość (zł)"
              type="number"
              step="0.01"
              {...register('value', {
                required: VALIDATION.REQUIRED,
                min: { value: 0, message: VALIDATION.POSITIVE_NUMBER }
              })}
              error={errors.value?.message}
              className="bg-section-grey-light"
            />
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={() => {
              handleSubmit(onSubmit)();
            }}
            disabled={createMutation.isPending || updateMutation.isPending}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editingTool ? 'Aktualizuj narzędzie' : 'Utwórz narzędzie'}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssignmentModal} onClose={handleCloseAssignmentModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Pracownicy przypisani do "{selectedTool?.name}"
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          {isAssignmentsLoading ? (
            <div className="text-center text-white py-4">Ładowanie przypisań...</div>
          ) : toolAssignments.length === 0 ? (
            <div className="text-center text-surface-grey-dark py-8">
              Brak pracowników przypisanych do tego narzędzia
            </div>
          ) : (
            <div className="table-wrapper">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Pracownik</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Data przypisania</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Ilość</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white">Stan</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {toolAssignments.map((assignment, index) => (
                    <Table.Row key={`${assignment.uuid}-${index}`} className="hover:bg-section-grey-light">
                      <Table.Cell className="text-white">{assignment.employeeName || 'Unknown Employee'}</Table.Cell>
                      <Table.Cell className="text-white">
                        {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : '-'}
                      </Table.Cell>
                      <Table.Cell className="text-white">{assignment.quantity}</Table.Cell>
                      <Table.Cell className="text-white">{assignment.condition}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button color="gray" onClick={handleCloseAssignmentModal}>
            Zamknij
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ToolsPage;
