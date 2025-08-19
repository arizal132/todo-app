'use client';

import { useState } from 'react';
import TodoForm from './TodoForm';

export default function TodoList({ todos, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);

  const handleToggleComplete = async (todo) => {
    await onUpdate(todo._id, { completed: !todo.completed });
  };

  const handleEdit = (todo) => {
    setEditingId(todo._id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (todoData) => {
    const result = await onUpdate(editingId, todoData);
    if (result.success) {
      setEditingId(null);
    }
    return result;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      await onDelete(id);
    }
  };

  if (todos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No todos yet. Add your first todo above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <div key={todo._id} className="bg-white rounded-lg shadow p-6">
          {editingId === todo._id ? (
            <div>
              <TodoForm 
                onSubmit={handleUpdate} 
                initialData={todo} 
              />
              <button
                onClick={handleCancelEdit}
                className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                    className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p className={`mt-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                        {todo.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Created: {new Date(todo.createdAt).toLocaleDateString()}
                      {todo.updatedAt !== todo.createdAt && (
                        <> • Updated: {new Date(todo.updatedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(todo)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}