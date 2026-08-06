import { getDb } from '../db';
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters } from '../types/todo';

export async function getTodos(filters?: TodoFilters): Promise<Todo[]> {
  return getDb().listTodos(filters);
}

export async function createTodo(data: CreateTodoData): Promise<Todo> {
  return getDb().createTodo(data);
}

export async function updateTodo(id: string, data: UpdateTodoData): Promise<Todo | null> {
  return getDb().updateTodo(id, data);
}

export async function deleteTodo(id: string): Promise<boolean> {
  return getDb().deleteTodo(id);
}
