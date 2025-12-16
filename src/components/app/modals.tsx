

"use client"

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { User, Currency, Transaction, Recap, CalendarEvent, RecapType, TransactionType, DocumentFile, AddUserForm, Todo } from '@/lib/definitions';
import { calculateBalance, CONVERSION_RATES } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Image as ImageIcon, Video, Mic, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const GlassDialogContent = ({ className, ...props }: React.ComponentProps<typeof DialogContent>) => (
    <DialogContent 
      className="bg-background/80 backdrop-blur-lg border-white/20 dark:border-white/10 rounded-5xl"
      {...props}
    />
)

export const PaywallModal = ({ isOpen, onClose }: ModalProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <GlassDialogContent>
      <DialogHeader>
        <DialogTitle>Passer au forfait PRO</DialogTitle>
        <DialogDescription>
          Vous avez atteint la limite d'un collaborateur. Pour en ajouter d'autres, veuillez mettre à niveau votre abonnement.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onClose} variant="outline" className="rounded-xl">Plus tard</Button>
        <Button className="rounded-xl">Mettre à niveau</Button>
      </DialogFooter>
    </GlassDialogContent>
  </Dialog>
);


export const AddUserModal = ({ isOpen, onClose, onAddUser }: ModalProps & { onAddUser: (user: AddUserForm) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = () => {
    if (name && email && password) {
      onAddUser({ name, email, password });
      setName('');
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <GlassDialogContent>
        <DialogHeader><DialogTitle>Ajouter un collaborateur</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Nom complet</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><Label htmlFor="password">Mot de passe temporaire</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl" /></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} className="rounded-xl">Créer le compte</Button></DialogFooter>
      </GlassDialogContent>
    </Dialog>
  );
};


export const AddTransactionModal = ({ isOpen, onClose, onAddTransaction, authorId, viewAs, transactions }: ModalProps & { onAddTransaction: (tx: Omit<Transaction, 'id' | 'authorId' | 'date'>) => void, authorId: string, viewAs: string, transactions: Transaction[] }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || !reason) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if(transactionType === 'EXPENSE') {
      const { balance } = calculateBalance(transactions);
      const expenseInEur = numericAmount / CONVERSION_RATES[currency];
      if (expenseInEur > balance) {
        setError('Le montant de la dépense ne peut pas excéder le solde actuel.');
        return;
      }
    }
    
    onAddTransaction({ amount: numericAmount, reason, currency, type: transactionType });
    setAmount('');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <GlassDialogContent>
        <DialogHeader><DialogTitle>Nouvelle Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type de transaction</Label>
            <RadioGroup value={transactionType} onValueChange={(v: any) => setTransactionType(v)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="BUDGET_ADD" id="r-budget" className="peer sr-only" />
                <Label htmlFor="r-budget" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Ajout de budget
                </Label>
              </div>
              <div>
                <RadioGroupItem value="EXPENSE" id="r-expense" className="peer sr-only" />
                <Label htmlFor="r-expense" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Dépense
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="amount">Montant</Label><Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Devise</Label>
            <Select value={currency} onValueChange={(v: Currency) => setCurrency(v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-sm bg-popover/80"><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="XOF">XOF</SelectItem></SelectContent>
            </Select>
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="reason">Motif</Label><Input id="reason" value={reason} onChange={e => setReason(e.target.value)} className="rounded-xl" /></div>
          {error && <Alert variant="destructive" className="rounded-xl"><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
        <DialogFooter><Button onClick={handleSubmit} className="rounded-xl">Enregistrer</Button></DialogFooter>
      </GlassDialogContent>
    </Dialog>
  );
};


export const AddRecapModal = ({ isOpen, onClose, onAddRecap, authorId }: ModalProps & { onAddRecap: (recap: Omit<Recap, 'id'>) => void, authorId: string }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<RecapType>('DAILY');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setMediaFile(event.target.files[0]);
      }
    };

    const handleSubmit = () => {
        if(description) {
            const recapData: Omit<Recap, 'id'> = { authorId, title: title || 'Rapport du jour', description, type, date: new Date().toISOString() };
            if (mediaFile) {
              recapData.mediaUrl = URL.createObjectURL(mediaFile);
              recapData.mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
            }
            onAddRecap(recapData);
            setTitle(''); 
            setDescription('');
            setMediaFile(null);
            onClose();
        }
    }

    const resetAndClose = () => {
      setTitle('');
      setDescription('');
      setMediaFile(null);
      onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <GlassDialogContent>
                <DialogHeader>
                    <DialogTitle className="text-center">Créer une publication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="sr-only">Titre</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de votre rapport (optionnel)" className="rounded-xl bg-transparent border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description" className="sr-only">Description</Label>
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Quel est le programme aujourd'hui ?" className="rounded-xl min-h-[120px] bg-transparent border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>

                    {mediaFile && (
                      <div className="text-sm text-muted-foreground">
                        Fichier sélectionné: {mediaFile.name}
                      </div>
                    )}
                </div>
                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <div className="flex justify-between items-center p-2 border rounded-xl">
                      <span className="text-sm font-medium ml-2">Ajouter à votre publication</span>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                          <ImageIcon className="text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                          <Video className="text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <Mic className="text-primary" />
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!description}>Publier</Button>
                </DialogFooter>
                <Input type="file" accept="image/*,video/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            </GlassDialogContent>
        </Dialog>
    )
}

export const AddEventModal = ({ isOpen, onClose, onAddEvent, authorId }: ModalProps & { onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void, authorId: string }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = () => {
        if(title && date) {
            onAddEvent({ authorId, title, description, date: new Date(date).toISOString() });
            setTitle(''); setDescription(''); setDate('');
            onClose();
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <GlassDialogContent>
                <DialogHeader><DialogTitle>Nouvel événement</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="event-title">Titre</Label><Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" /></div>
                    <div className="space-y-2"><Label htmlFor="event-date">Date et heure</Label><Input id="event-date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl"/></div>
                    <div className="space-y-2"><Label htmlFor="event-desc">Description</Label><Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl"/></div>
                </div>
                <DialogFooter><Button onClick={handleSubmit} className="rounded-xl">Planifier</Button></DialogFooter>
            </GlassDialogContent>
        </Dialog>
    )
}

export const AddDocumentModal = ({ isOpen, onClose, onAddDocument, authorId }: ModalProps & { onAddDocument: (doc: Omit<DocumentFile, 'id'>) => void, authorId: string }) => {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setFile(event.target.files[0]);
      }
    };

    const handleSubmit = () => {
        if(file) {
            onAddDocument({ 
                authorId,
                name: file.name, 
                type: file.type || 'inconnu', 
                size: `${(file.size / (1024*1024)).toFixed(2)} MB`,
                date: new Date().toISOString() 
            });
            setFile(null);
            onClose();
        }
    }

    const resetAndClose = () => {
        setFile(null);
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <GlassDialogContent>
                <DialogHeader>
                    <DialogTitle className="text-center">Uploader un document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-6">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-semibold">{file ? file.name : "Sélectionner un fichier"}</p>
                        <p className="text-xs text-muted-foreground">{file ? `${(file.size / (1024*1024)).toFixed(2)} MB` : "ou glissez-déposez"}</p>
                    </div>
                    <Input type="file" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!file}>
                        Envoyer le fichier
                    </Button>
                </DialogFooter>
            </GlassDialogContent>
        </Dialog>
    )
};
    
export const AddTodoModal = ({ isOpen, onClose, onAddTodo }: ModalProps & { onAddTodo: (task: string) => void }) => {
    const [task, setTask] = useState('');

    const handleSubmit = () => {
        if (task.trim()) {
            onAddTodo(task);
            setTask('');
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <GlassDialogContent>
                <DialogHeader>
                    <DialogTitle>Nouvelle tâche</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="task">Tâche</Label>
                    <Input 
                        id="task" 
                        value={task} 
                        onChange={(e) => setTask(e.target.value)} 
                        className="rounded-xl"
                        placeholder="Que faut-il faire ?"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="rounded-xl">Ajouter</Button>
                </DialogFooter>
            </GlassDialogContent>
        </Dialog>
    );
};
