import React from 'react';

interface TableProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

interface TableHeadCellProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> & {
  Head: React.FC<TableHeadProps>;
  Body: React.FC<TableBodyProps>;
  Row: React.FC<TableRowProps>;
  Cell: React.FC<TableCellProps>;
  HeadCell: React.FC<TableHeadCellProps>;
} = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        {children}
      </table>
    </div>
  );
};

const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <thead className={`group/thead ${className}`}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`group/tbody ${className}`}>
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <tr className={`group/tr ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({ children, className = '', colSpan }) => {
  return (
    <td className={`px-6 py-4 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
};

const TableHeadCell: React.FC<TableHeadCellProps> = ({ children, className = '' }) => {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.HeadCell = TableHeadCell;

export default Table;