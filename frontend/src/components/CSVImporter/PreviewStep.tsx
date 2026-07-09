'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnResizeMode
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface PreviewStepProps {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ file, onCancel, onConfirm }) => {
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Table states
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');

  useEffect(() => {
    setLoading(true);
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Some errors occurred while parsing the file. Displaying what could be recovered.');
        }

        if (results.data && results.data.length > 0) {
          setData(results.data);
          // Extract headers from keys of the first row
          setHeaders(Object.keys(results.data[0]));
        } else {
          setError('The uploaded CSV file appears to be empty.');
        }
        setLoading(false);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
        setLoading(false);
      }
    });
  }, [file]);

  // Dynamically build columns based on parsed CSV headers
  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    return headers.map((header) => ({
      id: header,
      accessorKey: header,
      header: () => (
        <span className="truncate block font-semibold text-zinc-300">
          {header}
        </span>
      ),
      cell: (info) => (
        <span className="truncate block text-zinc-400 font-medium">
          {info.getValue() as string || '-'}
        </span>
      ),
      minSize: 80,
      size: 150,
      maxSize: 400
    }));
  }, [headers]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode,
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-zinc-400 font-medium">Parsing CSV file locally...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            File Preview
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono font-normal">
              {file.name}
            </span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Analyze and search parsed columns locally before initiating CRM lead mapping.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300 hover:text-white rounded-xl transition flex items-center gap-2 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Discard
          </button>
          <button
            onClick={() => onConfirm(file)}
            className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Import
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-300 text-sm">
          {error}
        </div>
      )}

      {/* Control Bar: Search and Pagination Metadata */}
      <div className="bg-zinc-950/20 border border-zinc-850 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-md">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search preview records..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-zinc-800 focus:border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/10 transition"
          />
        </div>
        <div className="text-zinc-400 text-sm font-medium">
          Total Rows: <span className="text-zinc-200">{data.length}</span>
        </div>
      </div>

      {/* Main Table Card (with scroll limits) */}
      <div className="border border-zinc-800 rounded-xl bg-zinc-950/40 backdrop-blur-md overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[480px] scrollbar-thin scrollbar-thumb-zinc-800">
          <table
            className="w-full text-left border-collapse"
            style={{ width: table.getCenterTotalSize() }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-zinc-800 bg-zinc-900/60 sticky top-0 z-10">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold text-zinc-400 tracking-wider relative select-none"
                      style={{ width: header.getSize() }}
                    >
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer select-none flex items-center gap-1.5"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' ▴',
                          desc: ' ▾',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>

                      {/* Resizer Handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-violet-500/50 ${
                          header.column.getIsResizing() ? 'bg-violet-500 w-2' : ''
                        }`}
                      />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-900/40 hover:bg-zinc-900/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3.5 text-sm"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-4 py-16 text-center text-zinc-500 font-medium text-sm"
                  >
                    No matching preview records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {data.length > 10 && (
          <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-xs text-zinc-400 font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PreviewStep;
