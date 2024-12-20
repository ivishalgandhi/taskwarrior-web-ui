'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CommandSuggestion,
  TASKWARRIOR_COMMANDS,
} from '@/lib/command-suggestions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommandAutocompleteProps {
  onCommandExecuted: (filter?: string) => void;
}

export function CommandAutocomplete({ onCommandExecuted }: CommandAutocompleteProps) {
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = async (type: string) => {
    try {
      const response = await fetch(`/api/tasks/suggestions?type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  };

  useEffect(() => {
    const handleCommand = async () => {
      const words = command.split(' ');
      const lastWord = words[words.length - 1];
      
      let newSuggestions: CommandSuggestion[] = [];
      
      try {
        // Only show suggestions if user has typed something
        if (!command.trim()) {
          setShowSuggestions(false);
          setSuggestions([]);
          return;
        }

        // Show taskwarrior commands at the start
        if (words.length === 1) {
          newSuggestions = TASKWARRIOR_COMMANDS
            .filter(cmd => cmd.toLowerCase().startsWith(lastWord.toLowerCase()))
            .map(cmd => ({
              value: cmd,
              type: 'command',
              display: cmd,
              description: 'Taskwarrior command'
            }));
          
          setShowSuggestions(newSuggestions.length > 0);
        }
        // Show project suggestions after 'project:'
        else if (lastWord.startsWith('project:')) {
          const query = lastWord.slice(8); // Remove 'project:'
          const projects = await fetchSuggestions('projects');
          
          newSuggestions = projects
            .filter(project => project.toLowerCase().includes(query.toLowerCase()))
            .map(project => ({
              value: 'project:' + project,
              type: 'project',
              display: project,
              description: 'Project name'
            }));
          
          setShowSuggestions(newSuggestions.length > 0);
        }
        // Show tag suggestions after '+' or '-'
        else if (lastWord.startsWith('+') || lastWord.startsWith('-')) {
          const prefix = lastWord[0];
          const query = lastWord.slice(1);
          const tags = await fetchSuggestions('tags');
          
          newSuggestions = tags
            .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
            .map(tag => ({
              value: prefix + tag,
              type: 'tag',
              display: tag,
              description: prefix === '+' ? 'Add tag' : 'Remove tag'
            }));
          
          setShowSuggestions(newSuggestions.length > 0);
        }
        // Show date suggestions after 'due:'
        else if (lastWord.startsWith('due:')) {
          const query = lastWord.slice(4); // Remove 'due:'
          const dates = ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'eow', 'eom', 'eoy'];
          
          newSuggestions = dates
            .filter(date => date.toLowerCase().includes(query.toLowerCase()))
            .map(date => ({
              value: 'due:' + date,
              type: 'date',
              display: date,
              description: 'Due date'
            }));
          
          setShowSuggestions(newSuggestions.length > 0);
        }
        // No suggestions for other cases
        else {
          setShowSuggestions(false);
        }
        
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error handling command:', error);
        setShowSuggestions(false);
      }
    };

    handleCommand();
  }, [command]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to execute command');
      }

      const data = await response.json();
      
      // Always call onCommandExecuted if we got tasks in response
      if (data.tasks) {
        onCommandExecuted(command.trim());
      }
      // For modify commands, show success message and refresh
      else if (data.success) {
        toast.success('Command executed successfully');
        onCommandExecuted();
      }

      setCommand('');
    } catch (error) {
      console.error('Error executing command:', error);
      toast.error('Failed to execute command');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionSelect = (suggestion: CommandSuggestion) => {
    const words = command.split(' ');
    words[words.length - 1] = suggestion.value;
    setCommand(words.join(' ') + ' ');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev + 1 >= suggestions.length ? 0 : prev + 1;
          const element = document.querySelector(`li:nth-child(${newIndex + 1})`);
          element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return newIndex;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev - 1 < 0 ? suggestions.length - 1 : prev - 1;
          const element = document.querySelector(`li:nth-child(${newIndex + 1})`);
          element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return newIndex;
        });
        break;

      case 'Tab':
      case 'Enter':
        if (!e.metaKey) {  // Only handle selection if it's not cmd+enter
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            handleSuggestionSelect(suggestions[0]);
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative w-full" ref={commandRef}>
      <div className="flex w-full items-center space-x-2">
        <Input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a command..."
          className="flex-1"
          disabled={isSubmitting}
        />
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !command.trim()}
          className="min-w-[100px] flex items-center justify-center gap-1"
        >
          <span>{isSubmitting ? 'Running...' : 'Run'}</span>
          {!isSubmitting && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>↵
            </kbd>
          )}
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.value}
                className={cn(
                  "px-4 py-2 cursor-pointer text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedIndex === index && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <span>{suggestion.display || suggestion.value}</span>
                  {suggestion.description && (
                    <span className="text-muted-foreground text-xs">
                      {suggestion.description}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
