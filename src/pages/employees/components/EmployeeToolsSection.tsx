import React, { useState, useEffect } from 'react';
import { HiPlus, HiTrash, HiSearch, HiPrinter, HiCog } from 'react-icons/hi';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Card from '../../../components/common/Card';
import Modal from '../../../components/common/Modal';
import Table from '../../../components/common/Table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../../api/employees';
import { toolsApi } from '../../../api/tools';
import { QUERY_KEYS } from '../../../constants';
import type { AssignToolDto } from '../../../types/index';
import { ToolCondition } from '../../../types';
import { toast } from '../../../lib/toast';

interface AssignToolFormData {
  toolId: string;
  quantity: number;
  condition: ToolCondition;
  assignedAt: string;
}

interface RemoveToolFormData {
  quantity: number;
}

interface EmployeeToolsSectionProps {
  employeeId: string;
  employeeName: string;
}

const EmployeeToolsSection: React.FC<EmployeeToolsSectionProps> = ({ employeeId, employeeName }) => {
  const [showAssignToolModal, setShowAssignToolModal] = useState(false);
  const [showRemoveToolModal, setShowRemoveToolModal] = useState(false);
  const [selectedToolForRemoval, setSelectedToolForRemoval] = useState<typeof employeeTools[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const queryClient = useQueryClient();

  const { data: availableTools = [] } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });

  const { data: employeeTools = [], isLoading: isLoadingTools } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, employeeId, 'tools'],
    queryFn: () => employeesApi.getAssignedTools(employeeId),
    enabled: !!employeeId,
  });

  const {
    register: registerTool,
    handleSubmit: handleSubmitTool,
    formState: { errors: toolErrors },
    reset: resetTool,
  } = useForm<AssignToolFormData>();

  const {
    register: registerRemove,
    handleSubmit: handleSubmitRemove,
    formState: { errors: removeErrors },
    reset: resetRemove,
  } = useForm<RemoveToolFormData>();

  const assignToolMutation = useMutation({
    mutationFn: ({ toolId, employeeId, assignment }: { toolId: string; employeeId: string; assignment: AssignToolDto }) =>
      toolsApi.assign(toolId, employeeId, assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES, employeeId, 'tools'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS, 'quantities'] });
      toast.success('Narzędzie zostało przypisane');
      handleCloseAssignToolModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign tool');
    },
  });

  const unassignToolMutation = useMutation({
    mutationFn: ({ toolId, employeeId, quantity }: { toolId: string; employeeId: string; quantity: number }) =>
      toolsApi.unassign(toolId, employeeId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES, employeeId, 'tools'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS, 'quantities'] });
      toast.success('Narzędzie zostało usunięte');
      handleCloseRemoveToolModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove tool');
    },
  });

  const markAsUsedMutation = useMutation({
    mutationFn: (employeeToolId: string) => toolsApi.markAsUsed(employeeToolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES, employeeId, 'tools'] });
      toast.success('Narzędzie oznaczone jako zużyte');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się oznaczyć narzędzia jako zużytego');
    },
  });

  const filteredEmployeeTools = employeeTools
    .filter(assignment =>
      (assignment.toolName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (assignment.toolFactoryNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.assignedAt || '').getTime();
      const dateB = new Date(b.assignedAt || '').getTime();
      return dateB - dateA;
    });

  const totalPages = Math.ceil(filteredEmployeeTools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTools = filteredEmployeeTools.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleOpenAssignToolModal = () => {
    resetTool({ toolId: '', quantity: 1, condition: ToolCondition.GOOD, assignedAt: new Date().toISOString().split('T')[0] });
    setShowAssignToolModal(true);
  };

  const handleCloseAssignToolModal = () => {
    setShowAssignToolModal(false);
    resetTool();
  };

  const handleOpenRemoveToolModal = (toolAssignment: typeof employeeTools[0]) => {
    setSelectedToolForRemoval(toolAssignment);
    resetRemove({ quantity: 1 });
    setShowRemoveToolModal(true);
  };

  const handleCloseRemoveToolModal = () => {
    setShowRemoveToolModal(false);
    setSelectedToolForRemoval(null);
    resetRemove();
  };

  const handleMarkAsUsed = (employeeToolId: string) => {
    markAsUsedMutation.mutate(employeeToolId);
  };

  const onSubmitToolAssignment = (data: AssignToolFormData) => {
    assignToolMutation.mutate({ toolId: data.toolId, employeeId, assignment: { quantity: data.quantity, condition: data.condition, assignedAt: data.assignedAt } });
  };

  const onSubmitToolRemoval = (data: RemoveToolFormData) => {
    if (selectedToolForRemoval) {
      unassignToolMutation.mutate({
        toolId: selectedToolForRemoval.toolId!,
        employeeId,
        quantity: data.quantity
      });
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const aggregateToolsByNameAndDate = () => {
    const toolMap = new Map<string, { quantity: number, date: string }>();
    employeeTools.filter(a => !a.usedAt).forEach(a => {
      const key = `${a.toolName || 'Unknown'}_${a.assignedAt || ''}`;
      const existing = toolMap.get(key);
      if (existing) existing.quantity += a.quantity;
      else toolMap.set(key, { quantity: a.quantity, date: a.assignedAt || '' });
    });
    return Array.from(toolMap.entries())
      .map(([key, data]) => ({ name: key.split('_')[0], quantity: data.quantity, date: data.date }))
      .sort((a, b) => a.name === b.name ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.name.localeCompare(b.name));
  };

  const handlePrintToolList = () => {
    const aggregatedTools = aggregateToolsByNameAndDate();
    const styles = `@media print{body{margin:0;padding:20px;font-family:Arial,sans-serif}}body{font-family:Arial;margin:0;padding:20px;background:#fff;color:#000}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #000;padding:12px;text-align:left}th{background:#f5f5f5;font-weight:bold;font-size:16px}td{font-size:14px}.quantity,.date{text-align:center;font-weight:bold}`;
    const rows = aggregatedTools.map(t => `<tr><td>${t.name}</td><td class="quantity">${t.quantity}</td><td class="date">${new Date(t.date).toLocaleDateString('pl-PL')}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Lista Narzędzi</title><style>${styles}</style></head><body><table><thead><tr><th>Nazwa</th><th>Ilość</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()};</script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="lg:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Przypisane narzędzia</h2>
          <p className="text-surface-grey-dark">
            Przypisane narzędzia: {filteredEmployeeTools.length}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            color="gray"
            onClick={handlePrintToolList}
            className="bg-blue-900 hover:bg-blue-800 text-blue-300"
          >
            <HiPrinter className="w-4 h-4 mr-2" />
            Drukuj listę narzędzi
          </Button>
          <Button
            color="primary"
            onClick={handleOpenAssignToolModal}
          >
            <HiPlus className="w-4 h-4 mr-2" />
            Przypisz narzędzie
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Szukaj przypisanych narzędzi..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="bg-section-grey"
          />
        </div>
      </div>

      {isLoadingTools ? (
        <div className="flex justify-center items-center h-32">
          <div className="spinner"></div>
        </div>
      ) : filteredEmployeeTools.length === 0 ? (
        <Card className="text-center py-12">
          <HiCog className="w-16 h-16 mx-auto mb-4 opacity-50 text-surface-grey-dark" />
          <p className="text-lg text-surface-grey-dark">Brak przypisanych narzędzi</p>
          <p className="text-sm text-surface-grey">Śledź użycie i stan poprzez przypisanie narzędzi</p>
        </Card>
      ) : (
        <>
          <div className="table-wrapper">
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Nazwa</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Ilość</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Stan</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Wydano</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Zużyto</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Akcje</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {paginatedTools.map((assignment) => (
                  <Table.Row key={`${assignment.uuid}-${assignment.assignedAt}`} className="hover:bg-section-grey-light">
                    <Table.Cell className="text-white text-center">
                      {assignment.toolName}
                      {assignment.toolFactoryNumber ? ` #${assignment.toolFactoryNumber}` : ''}
                    </Table.Cell>
                    <Table.Cell className="text-white text-center">{assignment.quantity}</Table.Cell>
                    <Table.Cell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.condition === ToolCondition.NEW ? 'bg-green-900 text-green-300' :
                        assignment.condition === ToolCondition.GOOD ? 'bg-blue-900 text-blue-300' :
                        assignment.condition === ToolCondition.POOR ? 'bg-red-900 text-red-300' :
                        'bg-gray-900 text-gray-300'
                      }`}>
                        {assignment.condition}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-white text-center">{formatDate(assignment.assignedAt || '')}</Table.Cell>
                    <Table.Cell className="text-white text-center">
                      {assignment.usedAt ? formatDate(assignment.usedAt) : '-'}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <div className="flex gap-2 justify-center">
                        {!assignment.usedAt && (
                          <Button
                            size="sm"
                            color="gray"
                            onClick={() => handleMarkAsUsed(assignment.uuid!)}
                            className="bg-blue-900 hover:bg-blue-800 text-blue-300"
                          >
                            Zużyto
                          </Button>
                        )}
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => handleOpenRemoveToolModal(assignment)}
                          className="bg-red-900 hover:bg-red-800 text-red-300"
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                size="sm"
                color="gray"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Poprzednia
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    color={currentPage === page ? "primary" : "gray"}
                    onClick={() => handlePageChange(page)}
                    className={currentPage === page ? "bg-dark-green" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                color="gray"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Następna
              </Button>
            </div>
          )}
        </>
      )}

      {/* Assign Tool Modal */}
      <Modal show={showAssignToolModal} onClose={handleCloseAssignToolModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Przypisz narzędzie do {employeeName}
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
                {availableTools.map((tool) => (
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
                <option value={ToolCondition.NEW}>{ToolCondition.NEW}</option>
                <option value={ToolCondition.GOOD}>{ToolCondition.GOOD}</option>
                <option value={ToolCondition.POOR}>{ToolCondition.POOR}</option>
              </select>
              {toolErrors.condition && (
                <p className="mt-1 text-sm text-red-400">{toolErrors.condition.message}</p>
              )}
            </div>

            <Input
              id="assignedAt"
              label="Data przypisania"
              type="date"
              {...registerTool('assignedAt', { required: 'Assignment date is required' })}
              error={toolErrors.assignedAt?.message}
              className="bg-section-grey-light"
            />
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

      {/* Remove Tool Modal */}
      <Modal show={showRemoveToolModal} onClose={handleCloseRemoveToolModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Usuń narzędzie od {employeeName}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="mb-4">
            <p className="text-white">
              Narzędzie: <span className="font-medium">{selectedToolForRemoval?.toolName}</span>
            </p>
            <p className="text-surface-grey text-sm">
              Aktualnie przypisane: {selectedToolForRemoval?.quantity} sztuk
            </p>
          </div>
          <form onSubmit={handleSubmitRemove(onSubmitToolRemoval)} className="space-y-4">
            <Input
              id="quantity"
              label="Ilość do usunięcia"
              type="number"
              min="1"
              max={selectedToolForRemoval?.quantity || 1}
              {...registerRemove('quantity', {
                required: 'Quantity is required',
                min: { value: 1, message: 'Quantity must be at least 1' },
                max: { value: selectedToolForRemoval?.quantity || 1, message: `Cannot remove more than ${selectedToolForRemoval?.quantity}` }
              })}
              error={removeErrors.quantity?.message}
              className="bg-section-grey-light"
            />
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitRemove(onSubmitToolRemoval)}
            disabled={unassignToolMutation.isPending}
            className="bg-red-900 hover:bg-red-800"
          >
            {unassignToolMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                Usuwanie...
              </div>
            ) : (
              'Usuń narzędzie'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseRemoveToolModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeToolsSection;
