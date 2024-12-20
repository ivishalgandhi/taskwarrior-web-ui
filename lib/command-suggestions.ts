export interface CommandSuggestion {
  type: 'command' | 'attribute' | 'value' | 'tag' | 'project' | 'date';
  value: string;
  display?: string;
  description?: string;
}

export interface TaskwarriorAttribute {
  name: string;
  values?: string[];
  description?: string;
  dynamic?: boolean;
}

export const TASKWARRIOR_COMMANDS = [
  'add',
  'modify',
  'done',
  'delete',
  'start',
  'stop',
  'list',
  'completed',
  'pending',
  'sync'
];

export const TASKWARRIOR_ATTRIBUTES: TaskwarriorAttribute[] = [
  {
    name: 'project:',
    description: 'Project name',
    dynamic: true,
  },
  {
    name: 'tags:',
    description: 'Task tags',
    dynamic: true,
  },
  {
    name: 'priority:',
    description: 'Task priority',
    values: ['H', 'M', 'L'],
  },
  {
    name: 'due:',
    description: 'Due date',
    values: ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  {
    name: 'depends:',
    description: 'Task dependencies',
    dynamic: true,
  },
  {
    name: 'status:',
    description: 'Task status',
    values: ['pending', 'completed', 'deleted', 'waiting'],
  },
];

export async function fetchDynamicValues(attribute: string): Promise<string[]> {
  try {
    const type = attribute.endsWith(':') ? attribute.slice(0, -1) : attribute;
    console.log('Fetching dynamic values for type:', type);
    
    const response = await fetch(`/api/tasks/suggestions?type=${type}`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch suggestions: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Received values:', data.values);
    return data.values || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw error; // Re-throw to handle in the component
  }
}

export function getCommandSuggestions(
  input: string,
  dynamicValues: Record<string, string[]> = {}
): CommandSuggestion[] {
  if (!input) return [];
  
  const words = input.split(' ');
  const currentWord = words[words.length - 1].toLowerCase();

  console.log('Processing word:', currentWord);
  console.log('Available dynamic values:', dynamicValues);

  // If starting with + or -, show tag suggestions
  if (currentWord.startsWith('+') || currentWord.startsWith('-')) {
    const prefix = currentWord[0]; // + or -
    const tagQuery = currentWord.slice(1).toLowerCase();
    const tags = dynamicValues['tags'] || [];
    
    console.log('Tag search:', { prefix, tagQuery, availableTags: tags });
    
    const tagSuggestions = tags
      .filter(tag => tag.toLowerCase().includes(tagQuery))
      .map(tag => ({
        type: 'value',
        value: prefix + tag,
        description: prefix === '+' ? 'Add tag' : 'Remove tag',
      }));

    console.log('Tag suggestions:', tagSuggestions);
    return tagSuggestions;
  }

  // If starting a new command
  if (words.length === 1) {
    return TASKWARRIOR_COMMANDS
      .filter(cmd => cmd.toLowerCase().startsWith(currentWord))
      .map(cmd => ({
        type: 'command',
        value: cmd,
        description: `Taskwarrior ${cmd} command`,
      }));
  }

  // Check if we're typing an attribute or have just typed one
  const colonIndex = currentWord.indexOf(':');
  if (colonIndex !== -1) {
    const attrPrefix = currentWord.slice(0, colonIndex);
    const valuePrefix = currentWord.slice(colonIndex + 1).toLowerCase();

    // Find matching attribute
    const matchingAttr = TASKWARRIOR_ATTRIBUTES.find(
      attr => attr.name.toLowerCase().startsWith(attrPrefix.toLowerCase())
    );

    if (matchingAttr) {
      if (valuePrefix === '') {
        // Just typed the colon, show value suggestions
        return getValueSuggestions(matchingAttr, '', dynamicValues);
      } else {
        // Typing a value, filter suggestions
        return getValueSuggestions(matchingAttr, valuePrefix, dynamicValues);
      }
    }

    // Show attribute suggestions while typing
    return TASKWARRIOR_ATTRIBUTES
      .filter(attr => attr.name.toLowerCase().startsWith(attrPrefix.toLowerCase()))
      .map(attr => ({
        type: 'attribute',
        value: attr.name,
        description: attr.description,
      }));
  }

  // Check if we're typing an attribute name (without colon yet)
  const matchingAttributes = TASKWARRIOR_ATTRIBUTES
    .filter(attr => attr.name.toLowerCase().startsWith(currentWord))
    .map(attr => ({
      type: 'attribute',
      value: attr.name,
      description: attr.description,
    }));

  if (matchingAttributes.length > 0) {
    return matchingAttributes;
  }

  return [];
}

function getValueSuggestions(
  attribute: TaskwarriorAttribute,
  valuePrefix: string,
  dynamicValues: Record<string, string[]>
): CommandSuggestion[] {
  console.log('Getting value suggestions for:', {
    attribute: attribute.name,
    valuePrefix,
    dynamicValues,
  });

  let values: string[] = [];

  if (attribute.dynamic) {
    values = dynamicValues[attribute.name] || [];
    console.log('Dynamic values for', attribute.name, ':', values);
  } else {
    values = attribute.values || [];
    console.log('Static values for', attribute.name, ':', values);
  }

  return values
    .filter(value => value.toLowerCase().includes(valuePrefix.toLowerCase()))
    .map(value => ({
      type: 'value',
      value: value,
      description: `${attribute.description}: ${value}`,
    }));
}
