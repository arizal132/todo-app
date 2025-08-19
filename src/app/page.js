'use client';

import { useState, useEffect } from 'react';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch todos
  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const result = await response.json();
      if (result.success) {
        setTodos(result.data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new todo
  const addTodo = async (todoData) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });
      const result = await response.json();
      if (result.success) {
        setTodos([result.data, ...todos]);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update todo
  const updateTodo = async (id, todoData) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });
      const result = await response.json();
      if (result.success) {
        setTodos(todos.map(todo => 
          todo._id === id ? result.data : todo
        ));
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Delete todo
  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setTodos(todos.filter(todo => todo._id !== id));
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Todo List App</h1>
          <p className="mt-2 text-gray-600">Manage your tasks efficiently</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <TodoForm onSubmit={addTodo} />
        </div>

        <TodoList 
          todos={todos}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
        />
      </div>
    </div>
  );
}