import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HiArrowLeft, 
  HiPlus, 
  HiTrash, 
  HiUser, 
  HiCurrencyDollar, 
  HiCog, 
  HiSearch,
  HiPrinter,
  HiPencil
} from 'react-icons/hi';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../../api/employees';
import { toolsApi } from '../../api/tools';
import { payrollDeductionsApi, type PayrollDeductionDto } from '../../api/payrollDeductions';
import { QUERY_KEYS, ROUTES, VALIDATION } from '../../constants';
import { ToolCondition } from '../../types';
import { toast } from '../../lib/toast';
import { useAuth } from '../../context/AuthContext';

interface AssignToolFormData {
  toolId: string;
  quantity: number;
  condition: ToolCondition;
  assignedAt: string;
}

interface RemoveToolFormData {
  quantity: number;
}

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showAssignToolModal, setShowAssignToolModal] = useState(false);
  const [showRemoveToolModal, setShowRemoveToolModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedToolForRemoval, setSelectedToolForRemoval] = useState<typeof employeeTools[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, id],
    queryFn: () => employeesApi.getById(id!),
    enabled: !!id,
  });

  const { data: availableTools = [] } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });


  const { data: employeeTools = [], isLoading: isLoadingTools } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, id, 'tools'],
    queryFn: () => employeesApi.getAssignedTools(id!),
    enabled: !!id,
  });

  const { data: employeeDeductions = [], isLoading: isLoadingDeductions } = useQuery({
    queryKey: ['payroll-deductions', id],
    queryFn: () => payrollDeductionsApi.getEmployeeDeductions(id!),
    enabled: !!id && isAdmin(),
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

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EmployeeFormData>();

  const assignToolMutation = useMutation({
    mutationFn: toolsApi.assign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES, id, 'tools'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS, 'quantities'] });
      toast.success('Tool assigned successfully');
      handleCloseAssignToolModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign tool');
    },
  });

  const unassignToolMutation = useMutation({
    mutationFn: toolsApi.unassign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES, id, 'tools'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS, 'quantities'] });
      toast.success('Tool removed successfully');
      handleCloseRemoveToolModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove tool');
    },
  });

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

  const deleteEmployeeMutation = useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      toast.success('Employee deleted successfully');
      navigate(ROUTES.EMPLOYEES);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });

  const filteredEmployeeTools = employeeTools.filter(assignment =>
    (assignment.toolName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (assignment.toolFactoryNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleOpenAssignToolModal = () => {
    const today = new Date().toISOString().split('T')[0];
    resetTool({
      toolId: '',
      quantity: 1,
      condition: ToolCondition.GOOD,
      assignedAt: today,
    });
    setShowAssignToolModal(true);
  };

  const handleCloseAssignToolModal = () => {
    setShowAssignToolModal(false);
    resetTool();
  };

  const handleOpenRemoveToolModal = (toolAssignment: typeof employeeTools[0]) => {
    setSelectedToolForRemoval(toolAssignment);
    resetRemove({
      quantity: 1,
    });
    setShowRemoveToolModal(true);
  };

  const handleCloseRemoveToolModal = () => {
    setShowRemoveToolModal(false);
    setSelectedToolForRemoval(null);
    resetRemove();
  };

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

  const onSubmitToolAssignment = (data: AssignToolFormData) => {
    if (employee) {
      assignToolMutation.mutate({
        employeeId: employee.uuid!,
        toolId: data.toolId,
        quantity: data.quantity,
        condition: data.condition,
        assignedAt: data.assignedAt,
      });
    }
  };

  const onSubmitToolRemoval = (data: RemoveToolFormData) => {
    if (selectedToolForRemoval) {
      unassignToolMutation.mutate({
        employeeId: employee!.uuid!,
        toolId: selectedToolForRemoval.toolId,
        quantity: data.quantity,
        condition: selectedToolForRemoval.condition,
      });
    }
  };

  const onSubmitEdit = (data: EmployeeFormData) => {
    if (employee) {
      updateEmployeeMutation.mutate({
        ...employee,
        ...data,
      });
    }
  };

  const handleDeleteEmployee = () => {
    if (employee && window.confirm(`Czy na pewno chcesz usunąć pracownika ${employee.firstName} ${employee.lastName}?`)) {
      deleteEmployeeMutation.mutate(employee.uuid!);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const groupDeductionsByCategory = () => {
    const grouped = employeeDeductions.reduce((acc: Record<string, PayrollDeductionDto[]>, deduction) => {
      const category = deduction.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(deduction);
      return acc;
    }, {});
    
    return grouped;
  };

  const calculateTotalDeductions = () => {
    return employeeDeductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const aggregateToolsByNameAndDate = () => {
    const toolMap = new Map<string, { quantity: number, date: string }>();
    
    employeeTools.forEach(assignment => {
      const toolName = assignment.toolName || 'Unknown Tool';
      const assignedDate = assignment.assignedAt || '';
      const key = `${toolName}_${assignedDate}`;
      
      const existing = toolMap.get(key);
      if (existing) {
        existing.quantity += assignment.quantity;
      } else {
        toolMap.set(key, {
          quantity: assignment.quantity,
          date: assignedDate
        });
      }
    });
    
    return Array.from(toolMap.entries())
      .map(([key, data]) => {
        const toolName = key.split('_')[0];
        return {
          name: toolName,
          quantity: data.quantity,
          date: data.date
        };
      })
      .sort((a, b) => {
        if (a.name === b.name) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  };

  const handlePrintToolList = () => {
    const aggregatedTools = aggregateToolsByNameAndDate();
    
    const printContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lista Narzędzi</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white; 
            color: black; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
            font-size: 16px; 
          }
          td { 
            font-size: 14px; 
          }
          .quantity { 
            text-align: center; 
            font-weight: bold; 
          }
          .date { 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Ilość</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${aggregatedTools.map(tool => `
              <tr>
                <td>${tool.name}</td>
                <td class="quantity">${tool.quantity}</td>
                <td class="date">${new Date(tool.date).toLocaleDateString('pl-PL')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
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

          </div>
        </Card>

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
                onClick={handleOpenEditModal}
                className="bg-green-900 hover:bg-green-800 text-green-300"
              >
                <HiPencil className="w-4 h-4 mr-2" />
                Edytuj
              </Button>
              <Button
                color="gray"
                onClick={handleDeleteEmployee}
                className="bg-red-900 hover:bg-red-800 text-red-300"
                disabled={deleteEmployeeMutation.isPending}
              >
                <HiTrash className="w-4 h-4 mr-2" />
                {deleteEmployeeMutation.isPending ? 'Usuwanie...' : 'Usuń'}
              </Button>
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
            <div className="space-y-4">
              {filteredEmployeeTools.map((assignment) => (
                <Card key={`${assignment.toolId}-${assignment.assignedAt}`} className="hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-dark-green flex items-center justify-center">
                          <HiCog className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {assignment.toolName}
                            {assignment.toolFactoryNumber ? ` #${assignment.toolFactoryNumber}` : ''}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-surface-grey">Ilość</p>
                          <p className="text-white font-medium">{assignment.quantity}</p>
                        </div>
                        <div>
                          <p className="text-surface-grey">Cena</p>
                          <p className="text-white font-medium">{assignment.toolPrice?.toFixed(2) || '0.00'}zł</p>
                        </div>
                        <div>
                          <p className="text-surface-grey">Stan</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            assignment.condition === ToolCondition.NEW ? 'bg-green-900 text-green-300' :
                            assignment.condition === ToolCondition.GOOD ? 'bg-blue-900 text-blue-300' :
                            assignment.condition === ToolCondition.POOR ? 'bg-red-900 text-red-300' :
                            'bg-gray-900 text-gray-300'
                          }`}>
                            {assignment.condition}
                          </span>
                        </div>
                        <div>
                          <p className="text-surface-grey">Przypisano</p>
                          <p className="text-white font-medium">{formatDate(assignment.assignedAt || '')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        color="gray"
                        size="sm"
                        onClick={() => handleOpenRemoveToolModal(assignment)}
                        className="bg-red-900 hover:bg-red-800 text-red-300"
                      >
                        <HiTrash className="w-4 h-4 mr-1" />
                        Usuń
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin() && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Obciążenia płacowe</h2>
              <p className="text-surface-grey-dark">
                Historia obciążeń pracownika
              </p>
            </div>
          </div>

          {isLoadingDeductions ? (
            <div className="flex justify-center items-center h-32">
              <div className="spinner"></div>
            </div>
          ) : employeeDeductions.length === 0 ? (
            <Card className="text-center py-12">
              <HiCurrencyDollar className="w-16 h-16 mx-auto mb-4 opacity-50 text-surface-grey-dark" />
              <p className="text-lg text-surface-grey-dark">Brak obciążeń płacowych</p>
              <p className="text-sm text-surface-grey">Obciążenia będą widoczne po dodaniu w wypłatach</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupDeductionsByCategory()).map(([category, deductions]) => (
                <Card key={category} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between cursor-pointer p-4 hover:bg-section-grey-light/50 transition-colors"
                    onClick={() => toggleCategoryExpanded(category)}
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{category}</h3>
                      <p className="text-surface-grey text-sm">
                        {deductions.length} {deductions.length === 1 ? 'obciążenie' : 'obciążeń'} • 
                        Suma: {deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} PLN
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-semibold">
                        -{deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} PLN
                      </span>
                      {expandedCategories[category] ? (
                        <ChevronUp className="w-5 h-5 text-surface-grey" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-surface-grey" />
                      )}
                    </div>
                  </div>

                  {expandedCategories[category] && (
                    <div className="border-t border-lighter-border">
                      {deductions.map((deduction) => (
                        <div key={deduction.id} className="p-4 border-b border-lighter-border last:border-b-0 hover:bg-section-grey-light/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {deduction.note && (
                                <p className="text-white font-medium mb-1">{deduction.note}</p>
                              )}
                              <p className="text-surface-grey text-sm">
                                Kategoria: {deduction.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-red-400 font-bold text-lg">
                                -{deduction.amount.toFixed(2)} PLN
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              {/* Total Summary */}
              <Card className="bg-section-grey-light border-2 border-red-900/50">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Suma wszystkich obciążeń</h3>
                    <p className="text-surface-grey">
                      {employeeDeductions.length} {employeeDeductions.length === 1 ? 'obciążenie' : 'obciążeń'} w sumie
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold text-2xl">
                      -{calculateTotalDeductions().toFixed(2)} PLN
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Assign Tool Modal */}
      <Modal show={showAssignToolModal} onClose={handleCloseAssignToolModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            Przypisz narzędzie do {employee.firstName} {employee.lastName}
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
            Usuń narzędzie od {employee.firstName} {employee.lastName}
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