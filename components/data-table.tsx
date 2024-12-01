"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  Table as ReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Task } from "@/types/task"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableColumnHeader } from "./data-table-column-header"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData>[];
  data: TData[];
  table: ReactTable<TData>;
  onTaskUpdate: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  table,
  onTaskUpdate,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="rounded-md border flex-1 overflow-auto">
        <Table className="relative">
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags: string[] = row.getValue("tags") || []
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10"
            >
              {tag}
            </span>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const tags: string[] = row.getValue(id)
      if (!tags || !value) return true
      return tags.some(tag => tag.toLowerCase().includes(value.toLowerCase()))
    },
  },
  // ... other columns ...
]
