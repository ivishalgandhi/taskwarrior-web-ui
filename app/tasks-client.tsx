"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task } from '@/types/task';
import { DataTable } from "@/components/data-table";
import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { FolderIcon } from "@/components/icons/folder-icon";
import { CommandInput } from "@/components/command-input";
import Calendar from '@/components/calendar-new/calendar';
import { Mode } from '@/components/calendar-new/calendar-types';
import { DataTableRowActions } from "@/components/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table-toolbar"; 
import { Input } from "@/components/ui/input"; 
import { Cross2Icon } from "@radix-ui/react-icons"; 
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"; 
import { DataTableViewOptions } from "@/components/data-table-view-options"; 
import { Clock, CheckCircle, Timer, AlertCircle } from "lucide-react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues } from '@tanstack/react-table'

interface ProjectNode {
  name: string;
  count: number;
  children: ProjectNode[];
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectNode[]>([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarMode, setCalendarMode] = useState<Mode>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

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

  // Initialize column filters
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "status",
      value: ["pending", "waiting"]
    }
  ]);

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => {
        return (
          <div className="w-[50px] font-mono text-sm">
            {row.getValue("id")}
          </div>
        )
      },
      size: 50,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[300px] lg:max-w-[500px] truncate font-medium">
              {row.getValue("description")}
            </span>
          </div>
        )
      },
      size: 300,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        if (!status) return null;

        const StatusIcon = status === "pending" ? Clock :
                  status === "completed" ? CheckCircle :
                  status === "waiting" ? Timer :
                  AlertCircle;

        return (
          <div className="flex items-center w-[110px]">
            <StatusIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{status}</span>
          </div>
        );
      },
      size: 110,
      meta: {
        className: "w-[110px]",
      },
      filterFn: (row, id, value) => {
        const status: string = row.getValue(id)
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        if (Array.isArray(value)) {
          return value.includes(status)
        }
        return status === value
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        return <div className="w-[80px]">{row.getValue("priority")}</div>
      },
      size: 80,
      filterFn: (row, id, value) => {
        const priority: string | undefined = row.getValue(id)
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        if (Array.isArray(value)) {
          // Allow tasks without priority when filtering
          if (!priority) return false
          return value.includes(priority)
        }
        return priority === value
      },
    },
    {
      accessorKey: "project",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project" />
      ),
      cell: ({ row }) => {
        return <div className="max-w-[150px] lg:max-w-[200px] truncate">{row.getValue("project")}</div>
      },
      size: 150,
      filterFn: (row, id, value) => {
        const project: string | undefined = row.getValue(id)
        // If we're filtering by project and the task has no project, exclude it
        if (!project) return false
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        if (Array.isArray(value)) {
          return value.some(val => {
            if (!val) return false
            if (project === val) return true
            const taskParts = project.split('.')
            const valParts = val.split('.')
            if (valParts.length > taskParts.length) return false
            return valParts.every((part, i) => taskParts[i] === part)
          })
        }
        return project.toLowerCase().includes(String(value).toLowerCase())
      },
    },
    {
      accessorKey: "tags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tags" />
      ),
      cell: ({ row }) => {
        const tags: string[] = row.getValue("tags") || []
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px] lg:max-w-[200px]">
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
        // If we're filtering by tags and the task has no tags, exclude it
        if (!tags || tags.length === 0) return false
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        if (Array.isArray(value)) {
          return value.some(filterTag => 
            tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
          )
        }
        return tags.some(tag => tag.toLowerCase().includes(String(value).toLowerCase()))
      },
    },
    {
      accessorKey: "urgency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Urgency" />
      ),
      cell: ({ row }) => {
        return (
          <div className="w-[70px]">
            {Number(row.getValue("urgency")).toFixed(1)}
          </div>
        )
      },
      size: 70,
    },
    {
      accessorKey: "due",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const due = row.getValue<string>("due");
        if (!due) return "";
        
        try {
          const isoDate = due.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
            '$1-$2-$3T$4:$5:$6Z'
          );
          
          const now = new Date();
          const taskDate = new Date(isoDate);
          
          if (isNaN(taskDate.getTime())) return "";
          
          const diffInMonths = (now.getFullYear() - taskDate.getFullYear()) * 12 + 
                              (now.getMonth() - taskDate.getMonth());
          
          if (diffInMonths === 0) {
            const diffInDays = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffInDays === 0) return "today";
            if (diffInDays === 1) return "yesterday";
            if (diffInDays < 7) return `${diffInDays}d`;
            if (diffInDays < 14) return "1wk";
            if (diffInDays < 21) return "2wk";
            if (diffInDays < 28) return "3wk";
            return "4wk";
          } else if (diffInMonths < 12) {
            return `${diffInMonths}mo`;
          } else {
            const years = Math.floor(diffInMonths / 12);
            return `${years}y`;
          }
        } catch (error) {
          console.error("Error formatting date:", error);
          return "";
        }
      },
    },
    {
      accessorKey: "entry",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const entry = row.getValue<string>("entry");
        if (!entry) return "";
        
        try {
          const isoDate = entry.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
            '$1-$2-$3T$4:$5:$6Z'
          );
          
          const now = new Date();
          const taskDate = new Date(isoDate);
          
          if (isNaN(taskDate.getTime())) return "";
          
          const diffInMonths = (now.getFullYear() - taskDate.getFullYear()) * 12 + 
                              (now.getMonth() - taskDate.getMonth());
          
          if (diffInMonths === 0) {
            const diffInDays = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffInDays === 0) return "today";
            if (diffInDays === 1) return "yesterday";
            if (diffInDays < 7) return `${diffInDays}d`;
            if (diffInDays < 14) return "1wk";
            if (diffInDays < 21) return "2wk";
            if (diffInDays < 28) return "3wk";
            return "4wk";
          } else if (diffInMonths < 12) {
            return `${diffInMonths}mo`;
          } else {
            const years = Math.floor(diffInMonths / 12);
            return `${years}y`;
          }
        } catch (error) {
          console.error("Error formatting date:", error);
          return "";
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions 
          row={row} 
          onAction={() => {
            fetchTasks();
            fetchProjects();
          }}
        />
      ),
    },
  ];

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
      sorting: [
        {
          id: "urgency",
          desc: true,
        },
      ],
    },
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  // Recursive function to flatten project hierarchy
  const flattenProjects = (nodes: ProjectNode[], prefix = ''): { value: string; label: string; tasks: number }[] => {
    let options: { value: string; label: string; tasks: number }[] = [];
    
    nodes.forEach(node => {
      const fullPath = prefix ? `${prefix}.${node.name}` : node.name;
      options.push({
        value: fullPath,
        label: fullPath,
        tasks: node.count
      });
      
      if (node.children && node.children.length > 0) {
        options = options.concat(flattenProjects(node.children, fullPath));
      }
    });
    
    // Sort by project path
    options.sort((a, b) => a.label.localeCompare(b.label));
    
    return options;
  };

  useEffect(() => {
    const options = flattenProjects(projects);
    setProjectOptions(options);
  }, [projects]);

  // Get filtered tasks based on current table filters
  const filteredTasks = useMemo(() => {
    // First filter out deleted tasks
    const nonDeletedTasks = tasks.filter(task => task.status !== 'deleted');
    
    return nonDeletedTasks.filter(task => {
      const filters = columnFilters;
      return filters.every(filter => {
        const column = filter.id;
        const value = filter.value;

        switch (column) {
          case 'description':
            return task.description.toLowerCase().includes((value as string).toLowerCase());
          case 'status':
            if (!Array.isArray(value) || value.length === 0) return true;
            return value.includes(task.status);
          case 'priority':
            if (!Array.isArray(value) || value.length === 0) return true;
            // Exclude tasks without priority when filtering
            if (!task.priority) return false;
            return value.includes(task.priority);
          case 'project':
            if (!Array.isArray(value) || value.length === 0) return true;
            // If we're filtering by project and the task has no project, exclude it
            if (!task.project) return false;
            return value.some(val => {
              if (!val) return false;
              if (task.project === val) return true;
              const taskParts = task.project.split('.');
              const valParts = (val as string).split('.');
              if (valParts.length > taskParts.length) return false;
              return valParts.every((part, i) => taskParts[i] === part);
            });
          case 'tags':
            if (!Array.isArray(value) || value.length === 0) return true;
            // If we're filtering by tags and the task has no tags, exclude it
            if (!task.tags || task.tags.length === 0) return false;
            return value.some(filterTag => {
              if (!filterTag) return false;
              return task.tags!.some(tag => 
                tag.toLowerCase() === filterTag.toLowerCase()
              );
            });
          default:
            return true;
        }
      });
    });
  }, [tasks, columnFilters]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (err: any) {
      console.error('Error fetching projects:', err?.message || err);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks from API...');
      setLoading(true);
      // Only include completed tasks if they are selected in the filter
      const includeCompleted = columnFilters.some(filter => 
        filter.id === 'status' && 
        Array.isArray(filter.value) && 
        filter.value.includes('completed')
      );
      
      const response = await fetch(`/api/tasks?includeCompleted=${includeCompleted}`);
      console.log('API Response status:', response.status);
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      // Filter out deleted tasks before setting state
      const nonDeletedTasks = data.filter((task: Task) => task.status !== 'deleted');
      setTasks(nonDeletedTasks);
    } catch (err: any) {
      console.error('Error fetching tasks:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} task`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      throw error;
    }
  };

  useEffect(() => {
    const updateProjectOptions = () => {
      const flattenProjects = (nodes: ProjectNode[], prefix = ''): any[] => {
        return nodes.flatMap(node => {
          const currentPath = prefix ? `${prefix}.${node.name}` : node.name;
          const result = [{
            value: currentPath,
            label: currentPath,
            tasks: node.count
          }];
          
          if (node.children.length > 0) {
            result.push(...flattenProjects(node.children, currentPath));
          }
          
          return result;
        });
      };
      
      setProjectOptions(flattenProjects(projects));
    };
    
    updateProjectOptions();
  }, [projects]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const handleTaskUpdate = () => {
    fetchTasks();
    fetchProjects();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="w-full px-4 lg:px-8 py-4 flex-none">
        <div className="mb-4">
          <CommandInput onCommandExecuted={() => {
            fetchTasks()
            fetchProjects()
          }} />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between p-2">
            <div className="flex flex-1 items-center space-x-2 overflow-x-auto pb-2">
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
              {table.getColumn("project") && (
                <DataTableFacetedFilter
                  column={table.getColumn("project")}
                  title="Project"
                  options={projectOptions.filter(p => !p.value.includes("deleted")).map(project => ({
                    label: project.label,
                    value: project.value,
                    count: project.tasks,
                  }))}
                />
              )}
              {table.getColumn("tags") && (
                <DataTableFacetedFilter
                  column={table.getColumn("tags")}
                  title="Tags"
                  options={Array.from(new Set(tasks.flatMap(task => task.tags || []))).map(tag => ({
                    label: tag,
                    value: tag,
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
            </div>
            <DataTableViewOptions table={table} />
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              className="text-sm"
              onClick={() => setView('list')}
            >
              List View
            </Button>
            <Button
              variant={view === 'calendar' ? 'secondary' : 'ghost'}
              className="text-sm"
              onClick={() => setView('calendar')}
            >
              Calendar View
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {view === 'list' ? (
            <div className="h-full">
              <DataTable 
                table={table} 
                columns={columns}
                data={filteredTasks}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>
          ) : (
            <div className="h-full">
              <Calendar
                tasks={filteredTasks}
                setTasks={setTasks}
                mode={calendarMode}
                setMode={setCalendarMode}
                date={calendarDate}
                setDate={setCalendarDate}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
