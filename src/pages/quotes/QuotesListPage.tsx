import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quotesApi } from '../../api/quotes';
import { usersApi } from '../../api/users';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatting';

const QuotesListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quotes', page, search, createdBy],
    queryFn: () => quotesApi.getQuotes(page, 20, search || undefined, createdBy || undefined),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAllUsers(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    refetch();
  };

  const handleEdit = (id: string) => {
    navigate(`/quotes/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę wycenę?')) {
      await quotesApi.deleteQuote(id);
      refetch();
    }
  };

  const columns = [
    {
      key: 'documentNumber',
      label: 'Numer dokumentu',
      render: (quote: { documentNumber: string }) => quote.documentNumber,
    },
    {
      key: 'contractorName',
      label: 'Kontrahent',
      render: (quote: { contractorName: string; contractorCode: string }) => (
        <div>
          <div className="font-medium text-white">{quote.contractorName}</div>
          <div className="text-sm text-gray-400">{quote.contractorCode}</div>
        </div>
      ),
    },
    {
      key: 'productName',
      label: 'Produkt',
      render: (quote: { productName: string; productCode: string }) => (
        <div>
          <div className="font-medium text-white">{quote.productName}</div>
          <div className="text-sm text-gray-400">{quote.productCode}</div>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      label: 'Koszt',
      render: (quote: { totalPrice?: number }) => (
        <div className="text-white">
          {quote.totalPrice ? (
            <span className="font-medium">{quote.totalPrice.toFixed(2)} PLN</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Data utworzenia',
      render: (quote: { createdAt: string }) => (
        <span className="text-white">{formatDate(quote.createdAt)}</span>
      ),
    },
    {
      key: 'createdBy',
      label: 'Utworzono przez',
      render: (quote: { createdByEmail?: string }) => (
        <span className="text-white">{quote.createdByEmail || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Akcje',
      render: (quote: { uuid: string }) => (
        <div className="flex space-x-2">
          <Button
            color="gray"
            size="sm"
            onClick={() => handleEdit(quote.uuid)}
          >
            Edytuj
          </Button>
          <Button
            color="failure"
            size="sm"
            onClick={() => handleDelete(quote.uuid)}
          >
            Usuń
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Wyceny</h1>
        <Button
          color="primary"
          onClick={() => navigate('/quotes/new')}
        >
          Dodaj
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="OFE/1/01/2025"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className="p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green"
          >
            <option value="">Wszyscy użytkownicy</option>
            {users?.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.email}
              </option>
            ))}
          </select>
          <Button type="submit" color="gray">
            Szukaj
          </Button>
        </div>
      </form>

      <div className="bg-background-light rounded-lg overflow-hidden">
        <Table>
          <Table.Head>
            <Table.Row>
              {columns.map((column, index) => (
                <Table.HeadCell key={index}>{column.label}</Table.HeadCell>
              ))}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-8">
                  <div className="text-white">Ładowanie...</div>
                </Table.Cell>
              </Table.Row>
            ) : !data?.content || data.content.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-8">
                  <div className="text-gray-400">Brak wycen do wyświetlenia</div>
                </Table.Cell>
              </Table.Row>
            ) : (
              data.content.map((quote) => (
                <Table.Row key={quote.uuid}>
                  {columns.map((column, index) => (
                    <Table.Cell key={index}>{column.render(quote)}</Table.Cell>
                  ))}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-700">
            <Pagination
              currentPage={page + 1}
              totalElements={data.totalElements}
              perPage={20}
              onPageChange={(newPage) => setPage(newPage - 1)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotesListPage;