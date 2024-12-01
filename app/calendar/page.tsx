'use client';

import { CalendarView } from '@/components/calendar-view';
import { useEffect, useState } from 'react';
import { Task } from '@/types/task';
import { useSearchParams } from 'next/navigation';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const includeCompleted = searchParams.get('includeCompleted') === 'true';
        const response = await fetch(`/api/tasks?includeCompleted=${includeCompleted}`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        
        // Debug log to see task data
        console.log('Raw tasks data:', data);
        console.log('Sample task due date:', data[0]?.due);
        
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [searchParams]); // Re-fetch when search params change

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Task Calendar</h1>
      <CalendarView tasks={tasks} />
    </div>
  );
}
