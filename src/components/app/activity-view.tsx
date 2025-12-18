
"use client"

import React, { useMemo } from 'react'
import type { Recap, Comment, User } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Camera, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { collection, query, orderBy } from 'firebase/firestore'
import Image from 'next/image'
import { Skeleton } from '../ui/skeleton'

type ActivityViewProps = {
  viewedUserId: string | null
  users: User[]
  onAddRecap: () => void
  currentUser: User | null
}

const ActivityView = ({ viewedUserId, users, onAddRecap, currentUser }: ActivityViewProps) => {

  const firestore = useFirestore();
  
  const recapsQuery = useMemoFirebase(() => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'recaps'), orderBy('date', 'desc')) : null, [firestore, viewedUserId]);
  const { data: recaps, isLoading: areRecapsLoading } = useCollection<Recap>(recapsQuery);

  const commentsQueries = useMemo(() => {
    if (!viewedUserId || !recaps) return {};
    return recaps.reduce((acc, recap) => {
        acc[recap.id] = query(collection(firestore, 'users', viewedUserId, 'recaps', recap.id, 'comments'), orderBy('date', 'asc'));
        return acc;
    }, {} as Record<string, any>);
}, [firestore, viewedUserId, recaps]);

const commentsData = Object.keys(commentsQueries).reduce((acc, recapId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, isLoading } = useCollection<Comment>(commentsQueries[recapId]);
    acc[recapId] = { data, isLoading };
    return acc;
}, {} as Record<string, { data: Comment[] | null, isLoading: boolean }>);


  const getUser = (id: string) => users.find(u => u.id === id);

  // Only the account owner can create recaps on their own account
  // RESPONSABLE creates activity reports on their account
  // PATRON can create complete reports on their personal account
  // PATRON cannot create reports on collaborator accounts (only view and comment)
  const canAddRecap = currentUser?.id === viewedUserId;

  // PATRON can comment on collaborator recaps when viewing their account
  const canComment = currentUser?.role === 'PATRON' || currentUser?.id === viewedUserId;

  const handleAddComment = (recapId: string, content: string) => {
    if (!content.trim() || !currentUser || !viewedUserId) return;
    const ref = collection(firestore, 'users', viewedUserId, 'recaps', recapId, 'comments');
    addDocumentNonBlocking(ref, {
      recapId,
      authorId: currentUser.id,
      content,
      date: new Date().toISOString()
    });
  };

  if (areRecapsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full rounded-4xl" />
          <Skeleton className="h-64 w-full rounded-4xl" />
          <Skeleton className="h-64 w-full rounded-4xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold">Activité</h2>
            <p className="text-muted-foreground">Fil d'actualité et échanges</p>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto space-y-6">
        
        {canAddRecap && currentUser && (
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

        {recaps && recaps.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-4xl">
              <div className="inline-block bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                  <Send className="text-primary" size={24}/>
              </div>
              <h3 className="mt-4 text-lg font-semibold">C'est calme par ici.</h3>
              <p className="mt-1 text-muted-foreground">Aucun rapport pour le moment.</p>
          </div>
        ) : (
            recaps && recaps.map(recap => {
                const { data: recapComments, isLoading: areCommentsLoading } = commentsData[recap.id] || { data: [], isLoading: true };
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
                       {areCommentsLoading ? <Skeleton className="h-10 w-full" /> : <div className="w-full space-y-3">
                            {recapComments?.map(comment => {
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
                        </div>}
                        {currentUser && canComment && <div className="w-full flex items-center gap-2 pt-4 border-t">
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
                        </div>}
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
