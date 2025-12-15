"use client"

import React from 'react'
import type { Recap, Comment, User } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, MessageSquare } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useFirestore } from '@/firebase'
import { addDocumentNonBlocking } from '@/firebase'
import { collection } from 'firebase/firestore'
import Image from 'next/image'

type ActivityViewProps = {
  recaps: Recap[]
  comments: Comment[]
  users: User[]
  onAddRecap: () => void
  viewAs: string
  currentUser: User
  authorId: string
}

const ActivityView = ({ recaps, comments, users, onAddRecap, viewAs, currentUser, authorId }: ActivityViewProps) => {

  const getUser = (id: string) => users.find(u => u.id === id)
  const firestore = useFirestore();

  const handleAddComment = (recapId: string, content: string) => {
    if (!content.trim()) return;
    const ref = collection(firestore, 'users', authorId, 'recaps', recapId, 'comments');
    addDocumentNonBlocking(ref, {
      recapId,
      authorId: currentUser.id,
      content,
      date: new Date().toISOString()
    });
    // Clear input field after submission if you control it with state
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activité</h2>
        {viewAs.toUpperCase() === 'RESPONSABLE' && (
          <Button onClick={onAddRecap} className="rounded-xl gap-2">
            <Plus size={16} /> Nouveau Recap
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recaps.map(recap => {
          const recapComments = comments.filter(c => c.recapId === recap.id);
          return (
            <Card key={recap.id} className="rounded-4xl flex flex-col bg-card overflow-hidden">
              {recap.mediaUrl && (
                <div className="w-full aspect-video relative">
                  {recap.mediaType === 'image' ? (
                    <Image src={recap.mediaUrl} alt={recap.title} layout="fill" objectFit="cover" />
                  ) : (
                    <video src={recap.mediaUrl} controls className="w-full h-full object-cover"></video>
                  )}
                </div>
              )}
              <CardHeader className={recap.mediaUrl ? "pt-4" : ""}>
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
                    <AvatarImage src={currentUser?.avatar}/>
                    <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                   <form
                    className="flex-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('comment-input') as HTMLInputElement;
                      handleAddComment(recap.id, input.value);
                      input.value = '';
                    }}
                   >
                    <Input name="comment-input" placeholder="Ajouter un commentaire..." className="rounded-xl bg-gray-100 dark:bg-neutral-800 focus-visible:ring-primary"/>
                   </form>
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
