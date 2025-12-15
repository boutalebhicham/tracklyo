"use client"

import React from 'react'
import type { Recap, Comment, User, UserRole } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, MessageSquare } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type ActivityViewProps = {
  recaps: Recap[]
  comments: Comment[]
  users: User[]
  onAddRecap: () => void
  viewAs: UserRole
}

const ActivityView = ({ recaps, comments, users, onAddRecap, viewAs }: ActivityViewProps) => {

  const getUser = (id: string) => users.find(u => u.id === id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activité</h2>
        <Button onClick={onAddRecap} className="rounded-xl gap-2" disabled={viewAs === 'PATRON'}>
          <Plus size={16} /> Nouveau Recap
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recaps.map(recap => {
          const recapComments = comments.filter(c => c.recapId === recap.id);
          return (
            <Card key={recap.id} className="rounded-4xl flex flex-col bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{recap.title}</CardTitle>
                  <Badge variant={recap.type === 'WEEKLY' ? 'default' : 'secondary'} className="capitalize rounded-lg">
                    {recap.type === 'WEEKLY' ? 'Hebdo' : 'Jour'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground pt-1">{format(parseISO(recap.date), 'PPP', { locale: fr })}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{recap.description}</p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div className="w-full">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare size={16} className="text-muted-foreground"/>
                    Commentaires
                  </h4>
                  <div className="space-y-3">
                    {recapComments.map(comment => {
                      const author = getUser(comment.authorId);
                      return (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={author?.avatar} alt={author?.name} />
                            <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm bg-gray-100 dark:bg-neutral-800 rounded-xl p-2 flex-1">
                            <p className="font-semibold text-foreground">{author?.name}</p>
                            <p className="text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="w-full flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={getUser(viewAs === 'PATRON' ? 'user-patron-1' : 'user-responsable-1')?.avatar}/>
                  </Avatar>
                   <Input placeholder="Ajouter un commentaire..." className="rounded-xl bg-gray-100 dark:bg-neutral-800 focus-visible:ring-primary"/>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default ActivityView
