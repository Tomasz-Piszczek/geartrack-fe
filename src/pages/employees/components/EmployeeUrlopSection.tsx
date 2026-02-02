import { useState, forwardRef, useImperativeHandle } from 'react';
import { HiTrash, HiPencil, HiCalendar, HiDocumentText } from 'react-icons/hi';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Modal from '../../../components/common/Modal';
import Table from '../../../components/common/Table';
import Input from '../../../components/common/Input';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { urlopyApi } from '../../../api/urlopy';
import { VALIDATION } from '../../../constants';
import type { UrlopDto, UrlopStatus } from '../../../types/index';
import { toast } from '../../../lib/toast';
import { useUrlopy } from '../../../context/UrlopContext';

interface UrlopFormData {
  fromDate: string;
  toDate: string;
  note?: string;
}

interface EmployeeUrlopSectionProps {
  employeeId: string;
  employeeName: string;
  isAdmin: boolean;
}

export interface EmployeeUrlopSectionRef {
  openAddModal: () => void;
}

const EmployeeUrlopSection = forwardRef<EmployeeUrlopSectionRef, EmployeeUrlopSectionProps>(({ employeeId, isAdmin }, ref) => {
  const [showUrlopModal, setShowUrlopModal] = useState(false);
  const [selectedUrlop, setSelectedUrlop] = useState<UrlopDto | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [urlopPage, setUrlopPage] = useState(1);
  const [urlopPerPage] = useState(5);
  const { getUrlopByEmployeeId } = useUrlopy();

  const {
    register: registerUrlop,
    handleSubmit: handleSubmitUrlop,
    formState: { errors: urlopErrors },
    reset: resetUrlop,
  } = useForm<UrlopFormData>();

  const createUrlopMutation = useMutation({
    mutationFn: ({ employeeId, urlop }: { employeeId: string; urlop: Omit<UrlopDto, 'id'> }) =>
      urlopyApi.create(employeeId, urlop),
    onSuccess: () => {
      toast.success('Urlop created successfully');
      handleCloseUrlopModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create urlop');
    },
  });

  const updateUrlopMutation = useMutation({
    mutationFn: ({ id, urlop }: { id: string; urlop: UrlopDto }) =>
      urlopyApi.update(id, urlop),
    onSuccess: () => {
      toast.success('Urlop updated successfully');
      handleCloseUrlopModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update urlop');
    },
  });

  const deleteUrlopMutation = useMutation({
    mutationFn: urlopyApi.delete,
    onSuccess: () => {
      toast.success('Urlop deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete urlop');
    },
  });

  const employeeUrlopy = getUrlopByEmployeeId(employeeId);
  const totalUrlopPages = Math.ceil(employeeUrlopy.length / urlopPerPage);
  const urlopStartIndex = (urlopPage - 1) * urlopPerPage;
  const urlopEndIndex = urlopStartIndex + urlopPerPage;
  const paginatedUrlopy = employeeUrlopy.slice(urlopStartIndex, urlopEndIndex);

  const handleOpenUrlopModal = () => {
    setSelectedUrlop(null);
    const today = new Date().toISOString().split('T')[0];
    resetUrlop({
      fromDate: today,
      toDate: today,
      note: '',
    });
    setShowUrlopModal(true);
  };

  useImperativeHandle(ref, () => ({
    openAddModal: handleOpenUrlopModal
  }));

  const handleOpenEditUrlopModal = (urlop: UrlopDto) => {
    setSelectedUrlop(urlop);
    resetUrlop({
      fromDate: urlop.fromDate,
      toDate: urlop.toDate,
      note: urlop.note || '',
    });
    setShowUrlopModal(true);
  };

  const handleCloseUrlopModal = () => {
    setShowUrlopModal(false);
    setSelectedUrlop(null);
    resetUrlop();
  };

  const onSubmitUrlop = (data: UrlopFormData) => {
    if (selectedUrlop) {
      updateUrlopMutation.mutate({
        id: selectedUrlop.id!,
        urlop: {
          ...selectedUrlop,
          ...data,
        },
      });
    } else {
      createUrlopMutation.mutate({
        employeeId: employeeId,
        urlop: {
          employeeId: employeeId,
          fromDate: data.fromDate,
          toDate: data.toDate,
          note: data.note,
          status: 'PENDING',
        },
      });
    }
  };

  const handleDeleteUrlop = (urlopId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten urlop?')) {
      deleteUrlopMutation.mutate(urlopId);
    }
  };

  const handleAcceptUrlop = (urlop: UrlopDto) => {
    updateUrlopMutation.mutate({
      id: urlop.id!,
      urlop: {
        ...urlop,
        status: 'ACCEPTED',
      },
    });
  };

  const handleRejectUrlop = (urlop: UrlopDto) => {
    updateUrlopMutation.mutate({
      id: urlop.id!,
      urlop: {
        ...urlop,
        status: 'REJECTED',
      },
    });
  };

  const handleShowNote = (note: string) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const handleCloseNoteModal = () => {
    setShowNoteModal(false);
    setSelectedNote('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusLabel = (status: UrlopStatus): string => {
    const statusLabels: Record<UrlopStatus, string> = {
      'PENDING': 'OCZEKUJĄCY',
      'ACCEPTED': 'ZAAKCEPTOWANY',
      'REJECTED': 'ODRZUCONY'
    };
    return statusLabels[status];
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Urlopy</h2>
        </div>
      </div>

      {employeeUrlopy.length === 0 ? (
        <Card className="text-center py-12">
          <HiCalendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-surface-grey-dark" />
          <p className="text-lg text-surface-grey-dark">Brak urlopów</p>
          <p className="text-sm text-surface-grey">Dodaj nowy urlop, aby rozpocząć śledzenie</p>
        </Card>
      ) : (
        <>
          <div className="table-wrapper">
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Data Od</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Data Do</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Status</Table.HeadCell>
                  <Table.HeadCell className="bg-section-grey-dark text-white text-center">Akcje</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {paginatedUrlopy.map((urlop) => (
                  <Table.Row
                    key={urlop.id}
                    className={`hover:bg-section-grey-light ${urlop.note ? 'cursor-pointer' : ''}`}
                    onClick={() => urlop.note && handleShowNote(urlop.note)}
                  >
                    <Table.Cell className="text-white text-center">
                      <div className="flex items-center justify-center gap-2">
                        {urlop.note && <HiDocumentText className="w-4 h-4 text-blue-400" />}
                        {formatDate(urlop.fromDate)}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-white text-center">
                      {formatDate(urlop.toDate)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        urlop.status === 'PENDING' ? 'bg-yellow-900 text-yellow-300' :
                        urlop.status === 'ACCEPTED' ? 'bg-green-900 text-green-300' :
                        urlop.status === 'REJECTED' ? 'bg-red-900 text-red-300' :
                        'bg-gray-900 text-gray-300'
                      }`}>
                        {getStatusLabel(urlop.status)}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                        {urlop.status === 'PENDING' && isAdmin && (
                          <>
                            <Button
                              size="sm"
                              color="gray"
                              onClick={() => handleAcceptUrlop(urlop)}
                              className="bg-green-900 hover:bg-green-800 text-green-300"
                            >
                              Akceptuj
                            </Button>
                            <Button
                              size="sm"
                              color="gray"
                              onClick={() => handleRejectUrlop(urlop)}
                              className="bg-red-900 hover:bg-red-800 text-red-300"
                            >
                              Odrzuć
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => handleOpenEditUrlopModal(urlop)}
                          className="bg-blue-900 hover:bg-blue-800 text-blue-300"
                        >
                          <HiPencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => handleDeleteUrlop(urlop.id!)}
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

          {employeeUrlopy.some(u => u.note) && (
            <div className="mt-2 text-sm text-surface-grey flex items-center gap-2">
            </div>
          )}

          {totalUrlopPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                size="sm"
                color="gray"
                onClick={() => setUrlopPage(urlopPage - 1)}
                disabled={urlopPage === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Poprzednia
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalUrlopPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    color={urlopPage === page ? "primary" : "gray"}
                    onClick={() => setUrlopPage(page)}
                    className={urlopPage === page ? "bg-dark-green" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                color="gray"
                onClick={() => setUrlopPage(urlopPage + 1)}
                disabled={urlopPage === totalUrlopPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Następna
              </Button>
            </div>
          )}
        </>
      )}

      {/* Urlop Modal */}
      <Modal show={showUrlopModal} onClose={handleCloseUrlopModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">
            {selectedUrlop ? 'Edytuj Urlop' : 'Dodaj Urlop'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <form onSubmit={handleSubmitUrlop(onSubmitUrlop)} className="space-y-4">
            <Input
              id="fromDate"
              label="Data od"
              type="date"
              {...registerUrlop('fromDate', { required: VALIDATION.REQUIRED })}
              error={urlopErrors.fromDate?.message}
              className="bg-section-grey-light"
            />

            <Input
              id="toDate"
              label="Data do"
              type="date"
              {...registerUrlop('toDate', { required: VALIDATION.REQUIRED })}
              error={urlopErrors.toDate?.message}
              className="bg-section-grey-light"
            />

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notatka
              </label>
              <textarea
                {...registerUrlop('note')}
                rows={4}
                className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
                placeholder="Dodaj notatkę..."
              />
              {urlopErrors.note && (
                <p className="mt-1 text-sm text-red-400">{urlopErrors.note.message}</p>
              )}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button
            color="primary"
            onClick={handleSubmitUrlop(onSubmitUrlop)}
            disabled={createUrlopMutation.isPending || updateUrlopMutation.isPending}
          >
            {(createUrlopMutation.isPending || updateUrlopMutation.isPending) ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                {selectedUrlop ? 'Aktualizowanie...' : 'Dodawanie...'}
              </div>
            ) : (
              selectedUrlop ? 'Aktualizuj' : 'Dodaj Urlop'
            )}
          </Button>
          <Button color="gray" onClick={handleCloseUrlopModal}>
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Note Modal */}
      <Modal show={showNoteModal} onClose={handleCloseNoteModal}>
        <Modal.Header className="bg-section-grey border-lighter-border">
          <span className="text-white">Notatka</span>
        </Modal.Header>
        <Modal.Body className="bg-section-grey">
          <div className="text-white whitespace-pre-wrap">
            {selectedNote}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-section-grey border-lighter-border">
          <Button color="gray" onClick={handleCloseNoteModal}>
            Zamknij
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

EmployeeUrlopSection.displayName = 'EmployeeUrlopSection';

export default EmployeeUrlopSection;
