
"use client"

import React from 'react'
import type { Todo, User } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, ListTodo, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format, isPast, isToday, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type TodoListViewProps = {
  todos: Todo[]
  currentUser: User
  viewedUser: User
  onAddTodo: () => void
  onUpdateTodoStatus: (todoId: string, status: 'PENDING' | 'DONE') => void
}

const TodoListView = ({ todos, currentUser, viewedUser, onAddTodo, onUpdateTodoStatus }: TodoListViewProps) => {

  const canManageTodos = currentUser.role === 'PATRON' && currentUser.id !== viewedUser.id;
  const isOwnTodos = currentUser.id === viewedUser.id;

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.status === b.status) {
      return parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
    }
    return a.status === 'PENDING' ? -1 : 1;
  });

  const getDeadlineInfo = (deadline: string) => {
    const deadLineDate = parseISO(deadline);
    if (isPast(deadLineDate) && !isToday(deadLineDate)) {
      return { text: `En retard de ${differenceInDays(new Date(), deadLineDate)} jours`, color: "text-red-500", icon: <AlertCircle size={14} /> };
    }
    const diff = differenceInDays(deadLineDate, new Date());
    if (diff <= 3) {
      return { text: `Dans ${diff + 1} jours`, color: "text-amber-500", icon: <Calendar size={14} /> };
    }
    return { text: format(deadLineDate, "d MMM", { locale: fr }), color: "text-muted-foreground", icon: <Calendar size={14} /> };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold">Liste de Tâches</h2>
            <p className="text-muted-foreground">Tâches assignées à {viewedUser.name.split(' ')[0]}</p>
        </div>
        {canManageTodos && (
            <Button onClick={onAddTodo} className="rounded-xl gap-2">
                <Plus size={16} /> Nouvelle Tâche
            </Button>
        )}
      </div>
      
      {todos.length === 0 ? (
        <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-4xl">
            <div className="inline-block bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                <ListTodo className="text-primary" size={24}/>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Aucune tâche assignée.</h3>
            {canManageTodos && <p className="mt-1 text-muted-foreground">Cliquez sur "Nouvelle Tâche" pour en assigner une.</p>}
        </div>
      ) : (
        <Card className="rounded-4xl">
            <CardContent className="p-4 space-y-3">
                {sortedTodos.map(todo => {
                    const deadlineInfo = getDeadlineInfo(todo.deadline);
                    const isDone = todo.status === 'DONE';
                    return (
                        <div key={todo.id} className={cn("flex items-start gap-4 p-3 rounded-2xl transition-colors", isDone ? "bg-gray-50 dark:bg-neutral-800/50" : "bg-card hover:bg-gray-50 dark:hover:bg-neutral-800/50")}>
                           <Checkbox
                             id={`todo-${todo.id}`}
                             checked={isDone}
                             onCheckedChange={(checked) => onUpdateTodoStatus(todo.id, checked ? 'DONE' : 'PENDING')}
                             disabled={!isOwnTodos}
                             className="mt-1 h-5 w-5 rounded"
                           />
                           <div className="flex-1">
                             <label htmlFor={`todo-${todo.id}`} className={cn("font-medium leading-tight", isDone && "line-through text-muted-foreground")}>{todo.title}</label>
                             {todo.description && <p className={cn("text-sm text-muted-foreground", isDone && "line-through")}>{todo.description}</p>}
                           </div>
                           {!isDone && (
                             <Badge variant="outline" className={cn("flex items-center gap-1.5 rounded-lg py-1 px-2 text-xs", deadlineInfo.color)}>
                                {deadlineInfo.icon}
                                {deadlineInfo.text}
                             </Badge>
                           )}
                           {isDone && (
                              <Badge variant="secondary" className="flex items-center gap-1.5 rounded-lg py-1 px-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 border-transparent">
                                <CheckCircle2 size={14} />
                                Terminée
                             </Badge>
                           )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TodoListView
