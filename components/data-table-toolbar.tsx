"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { Task } from "@/types/task"
import { useMemo } from "react"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  projects: {
    label: string
    value: string
    tasks: number
  }[]
}

export function DataTableToolbar<TData>({
  table,
  projects,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
      </div>
    </div>
  )
}
