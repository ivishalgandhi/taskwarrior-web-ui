"use client";

import { useEffect, useState, useMemo } from "react";
import { Task } from "@/types/task";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, AlertCircle, CheckCircle, Clock, Timer } from "lucide-react";
import { DataTableRowActions } from "@/components/data-table-row-actions";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { FolderIcon } from "@/components/icons/folder-icon";
import { CommandInput } from "@/components/command-input"; // Import the CommandInput component

interface ProjectNode {
  name: string;
  tasks: number;
  children: { [key: string]: ProjectNode };
  fullPath: string;
}

// Helper function to format urgency
const formatUrgency = (urgency: number | undefined) => {
  if (urgency === undefined) return "";
  return urgency.toFixed(2);
};

// Helper function to format date
const formatDate = (date: string | undefined) => {
  if (!date) return "";
  
  try {
    // Convert Taskwarrior format (20240514T025828Z) to ISO format (2024-05-14T02:58:28Z)
    const isoDate = date.replace(
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
};

// Helper function to flatten project hierarchy for select options
const flattenProjects = (nodes: ProjectNode[], prefix = ""): { value: string; label: string; tasks: number }[] => {
  let options: { value: string; label: string; tasks: number }[] = [];
  
  if (!Array.isArray(nodes)) return options;
  
  nodes.forEach(node => {
    if (!node) return;
    
    options.push({
      value: node.fullPath,
      label: node.fullPath,
      tasks: node.tasks
    });
    
    if (node.children && Object.keys(node.children).length > 0) {
      options = options.concat(flattenProjects(Object.values(node.children)));
    }
  });
  
  return options;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectNode[]>([]);
  const [columnFilters, setColumnFilters] = useState([
    {
      id: "status",
      value: ["pending", "waiting"]
    }
  ]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const projectTree = await response.json();
      setProjects(projectTree);
    } catch (err: any) {
      console.error('Error fetching projects:', err?.message || err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
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
        throw new Error('Failed to update task');
      }
      
      // Refresh tasks after action
      fetchTasks();
      fetchProjects();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
      },
      {
        accessorKey: "project",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Project" />
        ),
        cell: ({ row }) => {
          const project = row.getValue("project") as string;
          if (!project) return null;
          return <div className="w-[150px]">{project}</div>;
        },
        filterFn: (row, id, value: string[]) => {
          const project = row.getValue<string>(id);
          if (!value?.length) return true;
          if (!project) return false;
          
          // Check if the project matches any of the selected values
          return value.some(val => {
            // Handle exact match
            if (project === val) return true;
            
            // Handle subproject match (project is a child of val)
            // Add dots to ensure we match full project parts
            const projectParts = project.split('.');
            const valParts = val.split('.');
            
            // Check if all parts of val match the beginning of project parts
            if (valParts.length > projectParts.length) return false;
            return valParts.every((part, i) => projectParts[i] === part);
          });
        },
      },
      {
        accessorKey: "urgency",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Urgency" className="text-center" />
        ),
        cell: ({ row }) => {
          const urgency = row.getValue<number>("urgency");
          return <div className="text-center">{formatUrgency(urgency)}</div>;
        },
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" className="text-center" />
        ),
        cell: ({ row }) => {
          const priority = row.getValue<string>("priority");
          if (!priority) return null;
          const priorityLabels: Record<string, string> = {
            H: "High",
            M: "Medium",
            L: "Low"
          };
          return (
            <div className={`text-center
              ${priority === 'H' ? 'text-red-600 font-semibold' : ''}
              ${priority === 'M' ? 'text-gray-600' : ''}
              ${priority === 'L' ? 'text-gray-400' : ''}
            `}>
              {priorityLabels[priority]}
            </div>
          );
        },
        filterFn: (row, id, value: string[]) => {
          const priority = row.getValue<string>(id);
          if (!value?.length) return true;
          return value.includes(priority);
        },
      },
      {
        accessorKey: "due",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Due Date" className="text-center" />
        ),
        cell: ({ row }) => {
          const due = row.getValue<string>("due");
          return <div className="text-center">{formatDate(due)}</div>;
        },
      },
      {
        accessorKey: "entry",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" className="text-center" />
        ),
        cell: ({ row }) => {
          const entry = row.getValue<string>("entry");
          return <div className="text-center">{formatDate(entry)}</div>;
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" className="text-center" />
        ),
        cell: ({ row }) => {
          const status = row.getValue<string>("status");
          if (!status) return null;

          const StatusIcon = status === "pending" ? Clock :
                    status === "completed" ? CheckCircle :
                    status === "waiting" ? Timer :
                    AlertCircle;

          return (
            <div className="flex items-center justify-center">
              <StatusIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{status}</span>
            </div>
          );
        },
        filterFn: (row, id, value: string[]) => {
          const status = row.getValue<string>(id);
          if (!value?.length) return true;
          if (!status) return false;
          return value.includes(status);
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DataTableRowActions 
            row={row} 
            onAction={handleTaskAction}
          />
        ),
      },
    ],
    [handleTaskAction]
  );

  const projectOptions = useMemo(() => {
    const options = flattenProjects(projects);
    return options.map(({ value, label, tasks }) => ({
      value,
      label,
      icon: FolderIcon,
      count: tasks
    }));
  }, [projects]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <CommandInput onCommandExecuted={() => {
        fetchTasks()
        fetchProjects()
      }} />
      <DataTable 
        columns={columns} 
        data={tasks} 
        projects={projectOptions}
        defaultColumnFilters={columnFilters}
      />
    </div>
  );
}
