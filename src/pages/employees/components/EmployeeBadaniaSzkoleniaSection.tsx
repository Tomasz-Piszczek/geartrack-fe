import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { HiTrash, HiPencil, HiCalendar } from 'react-icons/hi';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Modal from '../../../components/common/Modal';
import Table from '../../../components/common/Table';
import Input from '../../../components/common/Input';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { badaniaSzkoleniaApi } from '../../../api/badaniaSzkolenia';
import { VALIDATION } from '../../../constants';
import type { BadanieSzkolenieDto, BadanieSzkolenieStatus } from '../../../types/index';
import { toast } from '../../../lib/toast';
import { useBadaniaSzkolenia } from '../../../context/BadaniaSzkolenieContext';

interface BadanieSzkolenieFormData {
  date: string;
  category: string;
}

interface EmployeeBadaniaSzkoleniaSectionProps {
  employeeId: string;
  employeeName: string;
  isAdmin: boolean;
}

export interface EmployeeBadaniaSzkoleniaSectionRef {
  openAddModal: () => void;
}

const EmployeeBadaniaSzkoleniaSection = forwardRef<EmployeeBadaniaSzkoleniaSectionRef, EmployeeBadaniaSzkoleniaSectionProps>(({ employeeId, isAdmin }, ref) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBadanie, setSelectedBadanie] = useState<BadanieSzkolenieDto | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const { getBadaniaSzkoleniaByEmployeeId } = useBadaniaSzkolenia();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BadanieSzkolenieFormData>();

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await badaniaSzkoleniaApi.getCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  const createMutation = useMutation({
    mutationFn: ({ employeeId, badanie }: { employeeId: string; badanie: Omit<BadanieSzkolenieDto, 'id' | 'status'> }) =>
      badaniaSzkoleniaApi.create(employeeId, badanie),
    onSuccess: async () => {
      toast.success('Badanie/Szkolenie zostało utworzone');
      handleCloseModal();
      const cats = await badaniaSzkoleniaApi.getCategories();
      setCategories(cats);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create badanie/szkolenie');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, badanie }: { id: string; badanie: BadanieSzkolenieDto }) =>
      badaniaSzkoleniaApi.update(id, badanie),
    onSuccess: async () => {
      toast.success('Badanie/Szkolenie zostało zaktualizowane');
      handleCloseModal();
      const cats = await badaniaSzkoleniaApi.getCategories();
      setCategories(cats);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update badanie/szkolenie');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: badaniaSzkoleniaApi.delete,
    onSuccess: () => {
      toast.success('Badanie/Szkolenie zostało usunięte');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete badanie/szkolenie');
    },
  });

  const employeeBadania = getBadaniaSzkoleniaByEmployeeId(employeeId);
  const totalPages = Math.ceil(employeeBadania.length / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedBadania = employeeBadania.slice(startIndex, endIndex);

  const handleOpenModal = () => {
    setSelectedBadanie(null);
    const today = new Date().toISOString().split('T')[0];
    reset({
      date: today,
      category: '',
    });
    setShowCategoryInput(false);
    setShowModal(true);
  };

  useImperativeHandle(ref, () => ({
    openAddModal: handleOpenModal
  }));

  const handleOpenEditModal = (badanie: BadanieSzkolenieDto) => {
    setSelectedBadanie(badanie);
    reset({
      date: badanie.date,
      category: badanie.category,
    });
    setShowCategoryInput(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBadanie(null);
    reset();
    setShowCategoryInput(false);
  };

  const onSubmit = (data: BadanieSzkolenieFormData) => {
    if (selectedBadanie) {
      updateMutation.mutate({
        id: selectedBadanie.id!,
        badanie: {
          ...selectedBadanie,
          ...data,
        },
      });
    } else {
      createMutation.mutate({
        employeeId: employeeId,
        badanie: {
          employeeId: employeeId,
          date: data.date,
          category: data.category,
        },
      });
    }
  };

  const handleDelete = (badanieId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to badanie/szkolenie?')) {
      deleteMutation.mutate(badanieId);
    }
  };

  const handleZakoncz = (badanie: BadanieSzkolenieDto) => {
    updateMutation.mutate({
      id: badanie.id!,
      badanie: {
        ...badanie,
        status: 'UKONCZONY',
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusLabel = (status: BadanieSzkolenieStatus): string => {
    const statusLabels: Record<BadanieSzkolenieStatus, string> = {
      'OCZEKUJACY': 'OCZEKUJĄCY',
      'UKONCZONY': 'UKOŃCZONY'
    };
    return statusLabels[status];
  };

  const getDateColor = (date: string, status: BadanieSzkolenieStatus): string => {
    if (status === 'UKONCZONY') return 'text-white';

    const badanieDate = new Date(date);
    badanieDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    if (badanieDate < today) return 'text-red-400';
    if (badanieDate <= sevenDaysFromNow) return 'text-orange-400';
    return 'text-white';
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Badania i Szkolenia</h2>
        </div>
      </div>

      {employeeBadania.length === 0 ? (
        <Card className="text-center py-12">
          <HiCalendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-surface-grey-dark" />
          <p className="text-lg text-surface-grey-dark">Brak badań i szkoleń</p>
          <p className="text-sm text-surface-grey">Dodaj nowe badanie lub szkolenie, aby rozpocząć śledzenie</p>
        </Card>
      ) : (
        <>
          <div className="table-wrapper">
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Data</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Kategoria</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Status</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Akcje</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {paginatedBadania.map((badanie) => (
                  <Table.Row key={badanie.id}>
                    <Table.Cell className={`text-center ${getDateColor(badanie.date, badanie.status)}`}>
                      {formatDate(badanie.date)}
                    </Table.Cell>
                    <Table.Cell className="text-white text-center">
                      {badanie.category}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        badanie.status === 'OCZEKUJACY' ? 'bg-yellow-900 text-yellow-300' :
                        badanie.status === 'UKONCZONY' ? 'bg-green-900 text-green-300' :
                        'bg-gray-900 text-gray-300'
                      }`}>
                        {getStatusLabel(badanie.status)}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <div className="flex gap-2 justify-center">
                        {badanie.status === 'OCZEKUJACY' && isAdmin && (
                          <Button
                            size="sm"
                            color="gray"
                            onClick={() => handleZakoncz(badanie)}
                            className="bg-green-900 hover:bg-green-800 text-green-300"
                          >
                            Zakończ
                          </Button>
                        )}
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => handleOpenEditModal(badanie)}
                          className="bg-blue-900 hover:bg-blue-800 text-blue-300"
                        >
                          <HiPencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => handleDelete(badanie.id!)}
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
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Poprzednia
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    color={page === p ? "primary" : "gray"}
                    onClick={() => setPage(p)}
                    className={page === p ? "bg-dark-green" : ""}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                color="gray"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Następna
              </Button>
            </div>
          )}
        </>
      )}

      <Modal show={showModal} onClose={handleCloseModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {selectedBadanie ? 'Edytuj Badanie/Szkolenie' : 'Dodaj Badanie/Szkolenie'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="date"
              label="Data"
              type="date"
              {...register('date', { required: VALIDATION.REQUIRED })}
              error={errors.date?.message}
              className="bg-section-grey-light"
            />

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kategoria
              </label>
              {!showCategoryInput ? (
                <div className="space-y-2">
                  <select
                    {...register('category', { required: VALIDATION.REQUIRED })}
                    className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowCategoryInput(true);
                        setValue('category', '');
                      }
                    }}
                  >
                    <option value="">Wybierz kategorię</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__new__">+ Dodaj nową kategorię</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="category"
                    placeholder="Wpisz nową kategorię"
                    {...register('category', { required: VALIDATION.REQUIRED })}
                    error={errors.category?.message}
                    className="bg-section-grey-light"
                  />
                  <Button
                    type="button"
                    size="sm"
                    color="gray"
                    onClick={() => {
                      setShowCategoryInput(false);
                      setValue('category', '');
                    }}
                  >
                    Anuluj
                  </Button>
                </div>
              )}
              {errors.category && (
                <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
              )}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                {selectedBadanie ? 'Aktualizowanie...' : 'Dodawanie...'}
              </div>
            ) : (
              selectedBadanie ? 'Aktualizuj' : 'Dodaj'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

EmployeeBadaniaSzkoleniaSection.displayName = 'EmployeeBadaniaSzkoleniaSection';

export default EmployeeBadaniaSzkoleniaSection;
