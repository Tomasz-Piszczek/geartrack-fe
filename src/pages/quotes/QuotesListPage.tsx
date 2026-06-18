import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quotesApi } from '../../api/quotes';
import type { QuoteListDto } from '../../api/quotes';
import { usersApi } from '../../api/users';
import { toast } from '../../lib/toast';
import { useAuth } from '../../context/AuthContext';

const GRID = '170px minmax(180px,1.25fr) minmax(170px,1.3fr) 140px 110px 178px';

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtPrice(n?: number) {
  if (n == null) return '—';
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN';
}

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

interface RowProps {
  quote: QuoteListDto;
  adminUser: boolean;
  duplicatingId: string | null;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onApprovalToggle: (quote: QuoteListDto) => void;
}

const QuoteRow: React.FC<RowProps> = ({ quote, adminUser, duplicatingId, onEdit, onDuplicate, onDelete, onApprovalToggle }) => {
  const isApproved = quote.approved;
  return (
    <div
      className="group/row"
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 24px',
        alignItems: 'center',
        padding: '17px 26px 17px 30px',
        borderBottom: '1px solid rgba(255,255,255,0.045)',
        background: isApproved ? 'rgba(52,208,88,0.045)' : 'transparent',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={e => { if (!isApproved) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isApproved ? 'rgba(52,208,88,0.045)' : 'transparent'; }}
    >
      {/* left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isApproved ? '#34d058' : 'transparent' }} />

      {/* document number + status */}
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#e6e6e6' }}>
          {quote.documentNumber}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: 11.5, fontWeight: 600, color: isApproved ? '#8be79a' : '#e3c64a' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isApproved ? '#34d058' : '#cdae09', display: 'inline-block' }} />
          {isApproved ? 'Zatwierdzona' : 'Oczekuje'}
        </div>
      </div>

      {/* contractor */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{quote.contractorName}</div>
        <div style={{ fontSize: 12, color: '#7d7d7d', marginTop: 3 }}>{quote.createdByEmail || ''}</div>
      </div>

      {/* product */}
      <div style={{ fontSize: 14, color: '#cfcfcf' }}>{quote.productName}</div>

      {/* price */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: '#fff', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {fmtPrice(quote.totalPrice)}
      </div>

      {/* date */}
      <div style={{ fontSize: 13, color: '#9a9a9a' }}>{fmtDate(quote.createdAt)}</div>

      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
        {/* icon buttons — hidden until hover */}
        <div className="flex items-center gap-1">
          <button
            title="Edytuj"
            onClick={() => onEdit(quote.uuid)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#bdbdbd', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#bdbdbd'; }}
          >
            <IconEdit />
          </button>
          <button
            title="Duplikuj"
            onClick={() => onDuplicate(quote.uuid)}
            disabled={duplicatingId === quote.uuid}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#bdbdbd', cursor: duplicatingId === quote.uuid ? 'default' : 'pointer', opacity: duplicatingId === quote.uuid ? 0.5 : 1 }}
            onMouseEnter={e => { if (duplicatingId !== quote.uuid) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#bdbdbd'; }}
          >
            {duplicatingId === quote.uuid ? (
              <span style={{ fontSize: 12 }}>…</span>
            ) : (
              <IconCopy />
            )}
          </button>
          <button
            title="Usuń"
            onClick={() => onDelete(quote.uuid)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ff7676', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,74,74,0.14)'; (e.currentTarget as HTMLButtonElement).style.color = '#ff8a8a'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#ff7676'; }}
          >
            <IconTrash />
          </button>
        </div>

        {/* approve button — always visible for admins */}
        {adminUser && (
          <button
            onClick={() => onApprovalToggle(quote)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, borderRadius: 9, padding: '8px 14px',
              fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              background: isApproved ? 'transparent' : '#dfffa9',
              color: isApproved ? '#bdbdbd' : '#15200a',
              border: `1px solid ${isApproved ? 'rgba(255,255,255,0.16)' : '#dfffa9'}`,
              transition: 'filter 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.07)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
          >
            {!isApproved && <IconCheck />}
            {isApproved ? 'Cofnij' : 'Zatwierdź'}
          </button>
        )}
      </div>
    </div>
  );
};

const QuotesListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminUser = user?.role === 'ADMIN';

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

  const handleEdit = (id: string) => navigate(`/quotes/${id}/edit`);

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę wycenę?')) {
      await quotesApi.deleteQuote(id);
      refetch();
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const [details, nextNumber] = await Promise.all([
        quotesApi.getQuote(id),
        quotesApi.getNextQuoteNumber(),
      ]);
      const pendingFiles: File[] = [];
      for (const attachment of details.attachments ?? []) {
        const blob = await quotesApi.downloadAttachment(id, attachment.uuid);
        pendingFiles.push(new File([blob], attachment.fileName, { type: attachment.fileType }));
      }
      navigate('/quotes/new', {
        state: {
          sourceQuote: { ...details, documentNumber: nextNumber.nextQuoteNumber },
          pendingFiles,
        },
      });
    } catch {
      toast.error('Wystąpił błąd podczas duplikowania wyceny');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleApprovalToggle = async (quote: QuoteListDto) => {
    try {
      await quotesApi.setQuoteApproval(quote.uuid, !quote.approved);
      refetch();
    } catch {
      toast.error('Wystąpił błąd podczas zmiany statusu zatwierdzenia');
    }
  };

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const from = totalElements === 0 ? 0 : page * 20 + 1;
  const to = Math.min((page + 1) * 20, totalElements);

  return (
    <div style={{ padding: '32px 36px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Wyceny</h1>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#cfcabf', background: 'rgba(255,255,255,0.06)', padding: '4px 11px', borderRadius: 20 }}>
            {totalElements}
          </span>
        </div>
        <button
          onClick={() => navigate('/quotes/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dfffa9', color: '#15200a', border: 'none', borderRadius: 11, padding: '11px 18px', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15200a" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
          Dodaj wycenę
        </button>
      </div>

      {/* search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, background: '#2c2c2c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '0 15px', height: 46 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7d7d7d" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="OFE/1/01/2025"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, flex: 1, fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#2c2c2c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '0 15px', height: 46, minWidth: 210 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>
          <select
            value={createdBy}
            onChange={e => setCreatedBy(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#cfcfcf', fontSize: 14, flex: 1, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            <option value="" style={{ background: '#2c2c2c' }}>Wszyscy użytkownicy</option>
            {users?.map(u => (
              <option key={u.userId} value={u.userId} style={{ background: '#2c2c2c' }}>{u.email}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          style={{ background: '#2c2c2c', color: '#e3e3e3', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '0 22px', height: 46, fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2c2c2c'; (e.currentTarget as HTMLButtonElement).style.color = '#e3e3e3'; }}
        >
          Szukaj
        </button>
      </form>

      {/* table card */}
      <div style={{ background: '#1b1b1b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {/* column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '0 24px', padding: '14px 26px 14px 30px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)' }}>
          {['Numer / Status', 'Kontrahent', 'Produkt', 'Koszt', 'Data', 'Akcje'].map((col, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#7c7c7c', textAlign: (i === 3 || i === 5) ? 'right' as const : 'left' as const }}>
              {col}
            </div>
          ))}
        </div>

        {/* rows */}
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#7d7d7d', fontSize: 14 }}>Ładowanie...</div>
        ) : !data?.content?.length ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#7d7d7d', fontSize: 14 }}>Brak wycen do wyświetlenia</div>
        ) : (
          data.content.map(quote => (
            <QuoteRow
              key={quote.uuid}
              quote={quote}
              adminUser={adminUser}
              duplicatingId={duplicatingId}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onApprovalToggle={handleApprovalToggle}
            />
          ))
        )}

        {/* pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 26px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, color: '#8a8a8a' }}>
            {totalElements === 0 ? 'Brak wyników' : `Wyświetlanie ${from}–${to} z ${totalElements} wycen`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#6f6f6f' : '#cfcfcf', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 34, height: 34, padding: '0 11px', borderRadius: 8, background: i === page ? '#dfffa9' : 'transparent', border: `1px solid ${i === page ? '#dfffa9' : 'rgba(255,255,255,0.1)'}`, color: i === page ? '#15200a' : '#cfcfcf', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: page >= totalPages - 1 ? '#6f6f6f' : '#cfcfcf', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotesListPage;
