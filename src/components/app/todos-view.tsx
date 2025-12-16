
"use client"

import React from 'react'
import type { Todo } from '@/lib/definitions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'

type TodosViewProps = {
  todos: Todo[]
  onAddTodo: () => void
  onToggleTodo: (id: string, status: 'pending' | 'completed') => void
  onDeleteTodo: (id: string) => void
  canManage: boolean
}

const TodosView = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo, canManage }: TodosViewProps) => {

  const pendingTodos = todos.filter(t => t.status === 'pending');
  const completedTodos = todos.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tâches à faire</h2>
          <p className="text-muted-foreground">Suivez les actions à réaliser</p>
        </div>
        {canManage && (
            <Button onClick={onAddTodo} className="rounded-xl gap-2">
                <Plus size={16} /> Nouvelle Tâche
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="rounded-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListTodo className="text-orange-500" />
                    En cours ({pendingTodos.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {pendingTodos.length > 0 ? pendingTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-secondary/50">
                        <Checkbox 
                            id={`todo-${todo.id}`}
                            checked={todo.status === 'completed'}
                            onCheckedChange={() => onToggleTodo(todo.id, todo.status)}
                        />
                        <label htmlFor={`todo-${todo.id}`} className="flex-1 text-sm font-medium">{todo.task}</label>
                        {canManage && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onDeleteTodo(todo.id)}>
                                <Trash2 size={16} className="text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche en cours.</p>
                )}
            </CardContent>
        </Card>

        <Card className="rounded-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListTodo className="text-green-500" />
                    Terminées ({completedTodos.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {completedTodos.length > 0 ? completedTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-secondary/50">
                        <Checkbox 
                            id={`todo-${todo.id}`}
                            checked={todo.status === 'completed'}
                            onCheckedChange={() => onToggleTodo(todo.id, todo.status)}
                        />
                        <label htmlFor={`todo-${todo.id}`} className="flex-1 text-sm font-medium line-through text-muted-foreground">{todo.task}</label>
                        {canManage && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onDeleteTodo(todo.id)}>
                                <Trash2 size={16} className="text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche terminée.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TodosView
