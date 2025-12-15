"use client"

import React from 'react'
import type { Recap, Comment, User } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, MessageSquare, Send, Camera } from 'lucide-react'
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

  const sortedRecaps = recaps.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold">Activité</h2>
            <p className="text-muted-foreground">Fil d'actualité et échanges</p>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto space-y-6">
        {viewAs.toUpperCase() === 'RESPONSABLE' && (
          <Card className="rounded-4xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <button onClick={onAddRecap} className="flex-1 text-left bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors px-4 py-3 rounded-full">
                  <span className="text-muted-foreground">Publier un nouveau rapport...</span>
                </button>
                <Button onClick={onAddRecap} variant="ghost" size="icon" className="rounded-full">
                  <Camera size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sortedRecaps.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-4xl">
              <div className="inline-block bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                  <Send className="text-primary" size={24}/>
              </div>
              <h3 className="mt-4 text-lg font-semibold">C'est calme par ici.</h3>
              <p className="mt-1 text-muted-foreground">Aucun rapport pour le moment.</p>
          </div>
        ) : (
            sortedRecaps.map(recap => {
                const recapComments = comments.filter(c => c.recapId === recap.id);
                const author = getUser(recap.authorId);
                return (
                    <Card key={recap.id} className="rounded-4xl flex flex-col bg-card overflow-hidden w-full">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={author?.avatar} alt={author?.name} />
                                <AvatarFallback>{author?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{author?.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{format(parseISO(recap.date), 'PPP à HH:mm', { locale: fr })}</p>
                            </div>
                            <Badge variant={recap.type === 'WEEKLY' ? 'default' : 'secondary'} className="capitalize rounded-lg ml-auto">
                                {recap.type === 'WEEKLY' ? 'Hebdo' : 'Jour'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h3 className="text-lg font-semibold">{recap.title}</h3>
                        <p className="text-muted-foreground">{recap.description}</p>
                        {recap.mediaUrl && (
                            <div className="w-full aspect-video relative rounded-2xl overflow-hidden">
                            {recap.mediaType === 'image' ? (
                                <Image src={recap.mediaUrl} alt={recap.title} layout="fill" objectFit="cover" />
                            ) : (
                                <video src={recap.mediaUrl} controls className="w-full h-full object-cover"></video>
                            )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
                        <div className="w-full space-y-3">
                            {recapComments.map(comment => {
                            const commentAuthor = getUser(comment.authorId);
                            return (
                                <div key={comment.id} className="flex items-start gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={commentAuthor?.avatar} alt={commentAuthor?.name} />
                                    <AvatarFallback>{commentAuthor?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm bg-gray-100 dark:bg-neutral-800 rounded-xl p-2 flex-1">
                                    <p className="font-semibold text-foreground">{commentAuthor?.name}</p>
                                    <p className="text-muted-foreground">{comment.content}</p>
                                </div>
                                </div>
                            )
                            })}
                        </div>
                        <div className="w-full flex items-center gap-2 pt-4 border-t">
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
            })
        )}
      </div>
    </div>
  )
}

export default ActivityView
