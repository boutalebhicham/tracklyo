"use client"

import React, { useState } from 'react';
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
import type { User, Currency, Transaction, Recap, CalendarEvent, RecapType, UserRole, TransactionType } from '@/lib/definitions';
import { calculateBalance, CONVERSION_RATES } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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


export const AddUserModal = ({ isOpen, onClose, onAddUser }: ModalProps & { onAddUser: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    if (name && phone) {
      onAddUser({
        id: `user-${Date.now()}`,
        name,
        phoneNumber: phone,
        role: 'RESPONSABLE',
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <GlassDialogContent>
        <DialogHeader><DialogTitle>Ajouter un collaborateur</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Nom complet</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><Label htmlFor="phone">Numéro de téléphone</Label><Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl" /></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} className="rounded-xl">Ajouter</Button></DialogFooter>
      </GlassDialogContent>
    </Dialog>
  );
};


export const AddTransactionModal = ({ isOpen, onClose, onAddTransaction, authorId, viewAs, transactions }: ModalProps & { onAddTransaction: (tx: Omit<Transaction, 'id'>) => void, authorId: string, viewAs: UserRole, transactions: Transaction[] }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [error, setError] = useState('');
  
  const type: TransactionType = viewAs === 'PATRON' ? 'BUDGET_ADD' : 'EXPENSE';

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || !reason) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if(type === 'EXPENSE') {
      const { balance } = calculateBalance(transactions);
      const expenseInEur = numericAmount / CONVERSION_RATES[currency];
      if (expenseInEur > balance) {
        setError('Le montant de la dépense ne peut pas excéder le solde actuel.');
        return;
      }
    }
    
    onAddTransaction({ authorId, amount: numericAmount, reason, currency, type, date: new Date().toISOString() });
    setAmount('');
    setReason('');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <GlassDialogContent>
        <DialogHeader><DialogTitle>Ajouter une {type === 'BUDGET_ADD' ? 'entrée de budget' : 'dépense'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
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

    const handleSubmit = () => {
        if(title && description) {
            onAddRecap({ authorId, title, description, type, date: new Date().toISOString() });
            setTitle(''); setDescription('');
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <GlassDialogContent>
                <DialogHeader><DialogTitle>Nouveau récapitulatif</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="title">Titre</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" /></div>
                    <div className="space-y-2"><Label>Type</Label>
                        <RadioGroup defaultValue="DAILY" onValueChange={(v: RecapType) => setType(v)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="DAILY" id="r1" /><Label htmlFor="r1">Journalier</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="WEEKLY" id="r2" /><Label htmlFor="r2">Hebdomadaire</Label></div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl" /></div>
                </div>
                <DialogFooter><Button onClick={handleSubmit} className="rounded-xl">Ajouter</Button></DialogFooter>
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
