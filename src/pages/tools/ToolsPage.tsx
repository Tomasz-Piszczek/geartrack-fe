import React, { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiSearch } from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toolsApi } from '../../api/tools';
import type { ToolDto } from '../../types';
import { QUERY_KEYS, VALIDATION } from '../../constants';
import { toast } from '../../lib/toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface ToolFormData {
  name: string;
  factoryNumber: string;
  size: string;
  quantity: number;
  value: number;
}

const ToolsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ToolFormData>();

  const createMutation = useMutation({
    mutationFn: toolsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Tool created successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tool');
    },
  });

  const updateMutation = useMutation({
    mutationFn: toolsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Tool updated successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update tool');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: toolsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOOLS] });
      toast.success('Tool deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tool');
    },
  });

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.factoryNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (tool?: ToolDto) => {
    setEditingTool(tool || null);
    if (tool) {
      reset({
        name: tool.name,
        factoryNumber: tool.factoryNumber,
        size: tool.size,
        quantity: tool.quantity,
        value: tool.value,
      });
    } else {
      reset({
        name: '',
        factoryNumber: '',
        size: '',
        quantity: 0,
        value: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTool(null);
    reset();
  };

  const onSubmit = (data: ToolFormData) => {
    if (editingTool) {
      updateMutation.mutate({
        ...editingTool,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tools Magazine</h1>
          <p className="text-surface-grey-dark">Manage your tool inventory</p>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
          className="bg-dark-green hover:bg-dark-green/80"
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            icon={HiSearch}
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-section-grey"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell className="bg-section-grey-dark text-white">Name</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Factory Number</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Size</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Quantity</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Value</Table.HeadCell>
            <Table.HeadCell className="bg-section-grey-dark text-white">Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center text-white">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : filteredTools.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center text-surface-grey-dark">
                  No tools found
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredTools.map((tool) => (
                <Table.Row key={tool.uuid} className="hover:bg-section-grey-light">
                  <Table.Cell className="text-white">{tool.name}</Table.Cell>
                  <Table.Cell className="text-white">{tool.factoryNumber}</Table.Cell>
                  <Table.Cell className="text-white">{tool.size}</Table.Cell>
                  <Table.Cell className="text-white">{tool.quantity}</Table.Cell>
                  <Table.Cell className="text-white">${tool.value.toFixed(2)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() => handleOpenModal(tool)}
                      >
                        <HiPencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete(tool.uuid!)}
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

      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {editingTool ? 'Edit Tool' : 'Add New Tool'}
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

            <Input
              id="size"
              label="Size"
              {...register('size', { required: VALIDATION.REQUIRED })}
              error={errors.size?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="quantity"
              label="Quantity"
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
              label="Value ($)"
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
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
            loading={createMutation.isPending || updateMutation.isPending}
            className="bg-dark-green hover:bg-dark-green/80"
          >
            {editingTool ? 'Update Tool' : 'Create Tool'}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ToolsPage;