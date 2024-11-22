"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { AlertCircle, CheckCircle, Clock, Timer, FolderIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  projects?: { value: string; label: string; tasks: number }[]
}

const statuses = [
  {
    value: "pending",
    label: "Pending",
    icon: Clock,
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle,
  },
  {
    value: "waiting",
    label: "Waiting",
    icon: Timer,
  },
  {
    value: "deleted",
    label: "Deleted",
    icon: AlertCircle,
  },
]

const priorities = [
  {
    value: "H",
    label: "High",
  },
  {
    value: "M",
    label: "Medium",
  },
  {
    value: "L",
    label: "Low",
  },
]

export function DataTableToolbar<TData>({
  table,
  projects = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-1 items-center space-x-2">
      <Input
        placeholder="Filter tasks..."
        value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("description")?.setFilterValue(event.target.value)
        }
        className="h-8 w-[150px] lg:w-[250px]"
      />
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={statuses}
        />
      )}
      {table.getColumn("priority") && (
        <DataTableFacetedFilter
          column={table.getColumn("priority")}
          title="Priority"
          options={priorities}
        />
      )}
      {table.getColumn("project") && projects.length > 0 && (
        <DataTableFacetedFilter
          column={table.getColumn("project")}
          title="Project"
          options={projects.map((project) => ({
            label: project.label,
            value: project.value,
            icon: FolderIcon,
            count: project.tasks,
          }))}
        />
      )}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <Cross2Icon className="ml-2 h-4 w-4" />
        </Button>
      )}
      <div className="flex-1" />
      <DataTableViewOptions table={table} />
    </div>
  )
}
