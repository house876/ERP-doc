
import React from 'react';
import type { Column } from '../types';

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
}

export const DataTable = <T extends object,>({ columns, data }: DataTableProps<T>): React.ReactNode => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-md text-center shadow-sm border border-gray-200">
        <p className="text-gray-500 italic">표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
              >
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-4 py-3 whitespace-normal text-sm text-gray-800 text-center break-words"
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : String(row[column.accessor as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};