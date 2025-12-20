
"use client"

import React, { useMemo } from 'react'
import type { Recap, Comment, User, Transaction } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Camera, Send, Mic, FileText, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
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
  collaborators?: User[]
}

// Type for unified activity feed
type ActivityItem = {
  id: string
  type: 'recap' | 'expense' | 'budget'
  date: string
  userId: string
  data: Recap | Transaction
}

// Separate component for each recap card to handle its own comments hook
const RecapCard = ({
  recap,
  viewedUserId,
  users,
  currentUser,
  canComment
}: {
  recap: Recap
  viewedUserId: string
  users: User[]
  currentUser: User | null
  canComment: boolean
}) => {
  const firestore = useFirestore()

  const commentsQuery = useMemoFirebase(
    () => query(
      collection(firestore, 'users', viewedUserId, 'recaps', recap.id, 'comments'),
      orderBy('date', 'asc')
    ),
    [firestore, viewedUserId, recap.id]
  )
  const { data: recapComments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery)

  const getUser = (id: string) => users.find(u => u.id === id)
  const author = getUser(recap.authorId)

  const handleAddComment = (content: string) => {
    if (!content.trim() || !currentUser) return
    const ref = collection(firestore, 'users', viewedUserId, 'recaps', recap.id, 'comments')
    addDocumentNonBlocking(ref, {
      recapId: recap.id,
      authorId: currentUser.id,
      content,
      date: new Date().toISOString()
    })
  }

  return (
    <Card className="rounded-4xl flex flex-col bg-card overflow-hidden w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={author?.avatar} alt={author?.name} />
            <AvatarFallback>{author?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
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
        {recap.mediaUrl && !recap.mediaUrl.startsWith('blob:') && (
          <div className="w-full rounded-2xl overflow-hidden">
            {recap.mediaType === 'audio' ? (
              <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl">
                <Mic className="w-6 h-6 text-primary" />
                <audio src={recap.mediaUrl} controls className="flex-1" />
              </div>
            ) : recap.mediaType === 'image' ? (
              <div className="aspect-video relative">
                <Image src={recap.mediaUrl} alt={recap.title} layout="fill" objectFit="cover" />
              </div>
            ) : (
              <video src={recap.mediaUrl} controls className="w-full"></video>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
        {areCommentsLoading ? <Skeleton className="h-10 w-full" /> : (
          <div className="w-full space-y-3">
            {recapComments?.map(comment => {
              const commentAuthor = getUser(comment.authorId)
              return (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={commentAuthor?.avatar} alt={commentAuthor?.name} />
                    <AvatarFallback>{commentAuthor?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm bg-gray-100 dark:bg-neutral-800 rounded-xl p-2 flex-1">
                    <p className="font-semibold text-foreground">{commentAuthor?.name}</p>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {currentUser && canComment && (
          <div className="w-full flex items-center gap-2 pt-4 border-t">
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <form
              className="flex-1"
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.elements.namedItem('comment-input') as HTMLInputElement
                handleAddComment(input.value)
                input.value = ''
              }}
            >
              <Input name="comment-input" placeholder="Ajouter un commentaire..." className="rounded-xl bg-gray-100 dark:bg-neutral-800 focus-visible:ring-primary" />
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Activity card for transactions (expenses/budget)
const TransactionActivityCard = ({
  transaction,
  user
}: {
  transaction: Transaction
  user: User | undefined
}) => {
  const isExpense = transaction.type === 'EXPENSE'

  return (
    <Card className="rounded-4xl flex flex-col bg-card overflow-hidden w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{user?.name}</p>
              <span className="text-muted-foreground">a ajouté</span>
              <Badge
                variant={isExpense ? "destructive" : "default"}
                className="rounded-lg flex items-center gap-1"
              >
                {isExpense ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {isExpense ? 'une dépense' : 'un budget'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(transaction.date), 'PPP à HH:mm', { locale: fr })}
            </p>
          </div>
          <div className={`text-lg font-bold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
            {isExpense ? '-' : '+'}{transaction.amount.toLocaleString()} {transaction.currency}
          </div>
        </div>
        <div className="mt-3 pl-12">
          <p className="text-muted-foreground">{transaction.reason}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact activity item for the feed
const ActivityFeedItem = ({
  activity,
  users,
  currentUser,
  canComment
}: {
  activity: ActivityItem
  users: User[]
  currentUser: User | null
  canComment: boolean
}) => {
  const user = users.find(u => u.id === activity.userId)

  if (activity.type === 'recap') {
    return (
      <RecapCard
        recap={activity.data as Recap}
        viewedUserId={activity.userId}
        users={users}
        currentUser={currentUser}
        canComment={canComment}
      />
    )
  }

  return (
    <TransactionActivityCard
      transaction={activity.data as Transaction}
      user={user}
    />
  )
}

const ActivityView = ({ viewedUserId, users, onAddRecap, currentUser, collaborators = [] }: ActivityViewProps) => {
  const firestore = useFirestore()

  const isPatronViewingOwnDashboard = currentUser?.role === 'PATRON' && currentUser?.id === viewedUserId

  // For PATRON viewing their own dashboard: get activities from all collaborators
  // For others: get recaps from the viewed user only

  // Get recaps for viewed user (or all collaborators for PATRON)
  const recapsQuery = useMemoFirebase(
    () => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'recaps'), orderBy('date', 'desc')) : null,
    [firestore, viewedUserId]
  )
  const { data: recaps, isLoading: areRecapsLoading } = useCollection<Recap>(recapsQuery)

  // Get transactions for viewed user
  const transactionsQuery = useMemoFirebase(
    () => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'transactions'), orderBy('date', 'desc')) : null,
    [firestore, viewedUserId]
  )
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery)

  // For PATRON: also get recaps and transactions from collaborators
  const collaboratorIds = collaborators.map(c => c.id)

  // Create queries for each collaborator's recaps
  const collaboratorRecapsQueries = useMemoFirebase(
    () => isPatronViewingOwnDashboard && collaboratorIds.length > 0
      ? collaboratorIds.map(id => query(collection(firestore, 'users', id, 'recaps'), orderBy('date', 'desc')))
      : [],
    [firestore, isPatronViewingOwnDashboard, collaboratorIds.join(',')]
  )

  // Create queries for each collaborator's transactions
  const collaboratorTransactionsQueries = useMemoFirebase(
    () => isPatronViewingOwnDashboard && collaboratorIds.length > 0
      ? collaboratorIds.map(id => query(collection(firestore, 'users', id, 'transactions'), orderBy('date', 'desc')))
      : [],
    [firestore, isPatronViewingOwnDashboard, collaboratorIds.join(',')]
  )

  // Fetch collaborator recaps
  const { data: collabRecaps0 } = useCollection<Recap>(collaboratorRecapsQueries[0] || null)
  const { data: collabRecaps1 } = useCollection<Recap>(collaboratorRecapsQueries[1] || null)
  const { data: collabRecaps2 } = useCollection<Recap>(collaboratorRecapsQueries[2] || null)

  // Fetch collaborator transactions
  const { data: collabTx0 } = useCollection<Transaction>(collaboratorTransactionsQueries[0] || null)
  const { data: collabTx1 } = useCollection<Transaction>(collaboratorTransactionsQueries[1] || null)
  const { data: collabTx2 } = useCollection<Transaction>(collaboratorTransactionsQueries[2] || null)

  // Combine all activities into a unified feed
  const activityFeed = useMemo(() => {
    const activities: ActivityItem[] = []

    // Add own recaps
    if (recaps) {
      recaps.forEach(recap => {
        activities.push({
          id: `recap-${recap.id}`,
          type: 'recap',
          date: recap.date,
          userId: recap.authorId,
          data: recap
        })
      })
    }

    // Add own transactions (only for PATRON viewing own dashboard)
    if (isPatronViewingOwnDashboard && transactions) {
      transactions.forEach(tx => {
        activities.push({
          id: `tx-${tx.id}`,
          type: tx.type === 'EXPENSE' ? 'expense' : 'budget',
          date: tx.date,
          userId: tx.authorId,
          data: tx
        })
      })
    }

    // Add collaborator recaps
    if (isPatronViewingOwnDashboard) {
      const allCollabRecaps = [
        ...(collabRecaps0 || []),
        ...(collabRecaps1 || []),
        ...(collabRecaps2 || [])
      ]
      allCollabRecaps.forEach(recap => {
        activities.push({
          id: `recap-${recap.id}`,
          type: 'recap',
          date: recap.date,
          userId: recap.authorId,
          data: recap
        })
      })

      // Add collaborator transactions
      const allCollabTx = [
        ...(collabTx0 || []),
        ...(collabTx1 || []),
        ...(collabTx2 || [])
      ]
      allCollabTx.forEach(tx => {
        activities.push({
          id: `tx-${tx.id}`,
          type: tx.type === 'EXPENSE' ? 'expense' : 'budget',
          date: tx.date,
          userId: tx.authorId,
          data: tx
        })
      })
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return activities
  }, [recaps, transactions, collabRecaps0, collabRecaps1, collabRecaps2, collabTx0, collabTx1, collabTx2, isPatronViewingOwnDashboard])

  // Only the account owner can create recaps on their own account
  const canAddRecap = currentUser?.id === viewedUserId

  // PATRON can comment on collaborator recaps when viewing their account
  const canComment = currentUser?.role === 'PATRON' || currentUser?.id === viewedUserId

  if (areRecapsLoading || areTransactionsLoading) {
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
            <p className="text-muted-foreground">
              {isPatronViewingOwnDashboard
                ? "Fil d'actualité de votre équipe"
                : "Fil d'actualité et échanges"}
            </p>
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

        {activityFeed.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-4xl">
              <div className="inline-block bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                  <Send className="text-primary" size={24}/>
              </div>
              <h3 className="mt-4 text-lg font-semibold">C'est calme par ici.</h3>
              <p className="mt-1 text-muted-foreground">
                {isPatronViewingOwnDashboard
                  ? "Aucune activité de votre équipe pour le moment."
                  : "Aucun rapport pour le moment."}
              </p>
          </div>
        ) : (
          activityFeed.map(activity => (
            <ActivityFeedItem
              key={activity.id}
              activity={activity}
              users={users}
              currentUser={currentUser}
              canComment={canComment}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityView
