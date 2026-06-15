import { getDb } from '../db';
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters } from '../types/todo';

export function getTodos(filters?: TodoFilters): Todo[] {
  return getDb().listTodos(filters);
}

export function createTodo(data: CreateTodoData): Todo {
  return getDb().createTodo(data);
}

export function updateTodo(id: string, data: UpdateTodoData): Todo | null {
  return getDb().updateTodo(id, data);
}

export function deleteTodo(id: string): boolean {
  return getDb().deleteTodo(id);
}
