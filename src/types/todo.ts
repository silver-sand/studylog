export type TodoCategory = 'general' | 'study' | 'personal' | 'coaching';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'completed' | 'cancelled';

export interface Todo {
  id: string;
  title: string;
  description: string;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate: string | null;
  status: TodoStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  category?: TodoCategory;
  priority?: TodoPriority;
  dueDate?: string | null;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  category?: TodoCategory;
  priority?: TodoPriority;
  dueDate?: string | null;
  status?: TodoStatus;
  sortOrder?: number;
}

export interface TodoFilters {
  status?: TodoStatus;
  category?: TodoCategory;
  priority?: TodoPriority;
}
