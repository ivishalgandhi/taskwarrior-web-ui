'use client';

import { CalendarView } from '@/components/calendar-view';
import { useEffect, useState } from 'react';
import { Task } from '@/types/task';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table-view-options";
import { useReactTable, getCoreRowModel, getFilteredRowModel, ColumnDef, ColumnFiltersState } from '@tanstack/react-table';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const searchParams = useSearchParams();
  
  // Define the status and priority options
  const statuses = [
    {
      value: "pending",
      label: "Pending",
    },
    {
      value: "completed",
      label: "Completed",
    },
    {
      value: "waiting",
      label: "Waiting",
    },
  ];

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
  ];
  
  // Get status from URL params, defaulting to ['pending', 'waiting']
  const statusParam = searchParams.get('status');
  const statusValues = statusParam ? statusParam.split(',') : ['pending', 'waiting'];
  const includeCompleted = statusValues.includes('completed');

  // Initialize column filters
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "status",
      value: statusValues
    }
  ]);

  // Define columns for the table
  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "status",
      filterFn: (row, id, value) => {
        if (!value?.length) return true;
        return (value as string[]).includes(row.getValue(id));
      },
    },
    {
      accessorKey: "priority",
      filterFn: (row, id, value) => {
        if (!value?.length) return true;
        return (value as string[]).includes(row.getValue(id));
      },
    },
  ];

  // Create table instance
  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Create table filters object for calendar view
  const tableFilters = {
    status: statusValues
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        console.log('[Calendar] Fetching tasks with includeCompleted:', includeCompleted);
        console.log('[Calendar] Current table filters:', tableFilters);
        
        const response = await fetch(`/api/tasks?includeCompleted=${includeCompleted}`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        
        // Filter out deleted tasks before setting state
        const nonDeletedTasks = data.filter((task: Task) => task.status !== 'deleted');
        setTasks(nonDeletedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [includeCompleted]);

  // Function to update URL with new filters
  const updateFilters = (newStatus: string[]) => {
    const params = new URLSearchParams(window.location.search);
    if (newStatus.length > 0) {
      params.set('status', newStatus.join(','));
    } else {
      params.delete('status');
    }
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    // Force a page reload to update the data
    window.location.reload();
  };

  // Watch for filter changes
  useEffect(() => {
    const statusFilter = columnFilters.find(filter => filter.id === 'status');
    if (statusFilter && !Array.isArray(statusFilter.value)) return;
    
    const newStatusValues = statusFilter?.value as string[] || [];
    if (JSON.stringify(newStatusValues.sort()) !== JSON.stringify(statusValues.sort())) {
      updateFilters(newStatusValues);
    }
  }, [columnFilters]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between p-2 mb-6">
        <div className="flex flex-1 items-center space-x-2 overflow-x-auto pb-2">
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statuses.filter(status => status.value !== 'deleted')}
            />
          )}
          {table.getColumn("priority") && (
            <DataTableFacetedFilter
              column={table.getColumn("priority")}
              title="Priority"
              options={priorities}
            />
          )}
          {statusValues.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => updateFilters([])}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">Task Calendar</h1>
      <CalendarView 
        tasks={tasks} 
        tableFilters={tableFilters}
        onTaskUpdate={() => {}}
      />
    </div>
  );
}
