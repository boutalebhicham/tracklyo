

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
import type { User, Currency, Transaction, Recap, Event as CalendarEvent, RecapType, TransactionType, PaymentMethod, DocumentFile, AddUserForm, Mission, MissionType } from '@/lib/definitions';
import { calculateBalance, CONVERSION_RATES } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Image as ImageIcon, Video, Mic, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import FileUploader from './file-uploader';


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


export const AddTransactionModal = ({ isOpen, onClose, onAddTransaction, authorId, viewAs }: ModalProps & { onAddTransaction: (tx: Omit<Transaction, 'id' | 'authorId' | 'date'>, transactions: Transaction[], files: File[]) => void, authorId: string, viewAs: string }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  const firestore = useFirestore();
  const transactionsQuery = useMemoFirebase(() => authorId ? collection(firestore, 'users', authorId, 'transactions') : null, [authorId, firestore]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  // Force EXPENSE type for RESPONSABLE users
  React.useEffect(() => {
    if (viewAs === 'RESPONSABLE') {
      setTransactionType('EXPENSE');
    }
  }, [viewAs]);

  const handleSubmit = () => {
    if (!transactions) return;

    // Security check: RESPONSABLE can only create EXPENSE
    if (viewAs === 'RESPONSABLE' && transactionType !== 'EXPENSE') {
      setError('Vous ne pouvez créer que des dépenses.');
      return;
    }

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
    
    const transaction: Omit<Transaction, 'id' | 'authorId' | 'date'> = {
      amount: numericAmount,
      reason,
      currency,
      type: transactionType
    };

    // Add paymentMethod only for expenses
    if (transactionType === 'EXPENSE') {
      transaction.paymentMethod = paymentMethod;
    }

    onAddTransaction(transaction, transactions, attachmentFiles);
    setAmount('');
    setReason('');
    setPaymentMethod('CASH');
    setAttachmentFiles([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <GlassDialogContent>
        <DialogHeader><DialogTitle>Nouvelle Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          {viewAs === 'PATRON' && (
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
          )}
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
          {transactionType === 'EXPENSE' && (
            <div className="space-y-2">
              <Label>Méthode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-sm bg-popover/80">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Carte bancaire</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {transactionType === 'EXPENSE' && (
            <div className="space-y-2">
              <Label>Justificatifs</Label>
              <FileUploader
                files={attachmentFiles}
                onChange={setAttachmentFiles}
                maxFiles={3}
                accept="image/*,.pdf"
                maxSize={5}
              />
            </div>
          )}
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
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setMediaFile(event.target.files[0]);
      }
    };

    const handleVoiceInput = async () => {
      if (isRecording) {
        // Stop recording
        mediaRecorderRef.current?.stop();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsRecording(false);
        return;
      }

      // Request microphone permission and start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Create audio file from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `vocal-${Date.now()}.webm`, { type: 'audio/webm' });
          setMediaFile(audioFile);

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          setRecordingDuration(0);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);

        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Veuillez autoriser l\'accès au microphone pour enregistrer un message vocal.');
      }
    };

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = () => {
        // Allow submit if there's description OR audio file
        if(description || mediaFile) {
            const recapData: Omit<Recap, 'id'> = {
              authorId,
              title: title || 'Rapport du jour',
              description: description || 'Message vocal',
              type,
              date: new Date().toISOString()
            };
            if (mediaFile) {
              recapData.mediaUrl = URL.createObjectURL(mediaFile);
              recapData.mediaType = mediaFile.type.startsWith('audio/') ? 'audio' : mediaFile.type.startsWith('image/') ? 'image' : 'video';
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
      // Stop recording if active
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsRecording(false);
      setRecordingDuration(0);
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

                    {/* Show recording indicator */}
                    {isRecording && (
                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          Enregistrement en cours... {formatDuration(recordingDuration)}
                        </span>
                      </div>
                    )}

                    {/* Show selected file */}
                    {mediaFile && !isRecording && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {mediaFile.type.startsWith('audio/') ? 'Message vocal enregistré' : mediaFile.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-red-500 hover:text-red-600"
                          onClick={() => setMediaFile(null)}
                        >
                          Supprimer
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full ${isRecording ? 'bg-red-100 dark:bg-red-900/50 animate-pulse' : ''}`}
                          onClick={handleVoiceInput}
                        >
                          <Mic className={isRecording ? 'text-red-500' : 'text-primary'} />
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!description && !mediaFile}>Publier</Button>
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

export const AddMissionModal = ({ isOpen, onClose, onAddMission, authorId }: ModalProps & { onAddMission: (mission: Omit<Mission, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => void, authorId: string }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [missionType, setMissionType] = useState<MissionType>('PERSONAL');

    const handleSubmit = () => {
        if (!title.trim()) return;
        const missionData: any = {
            title: title.trim(),
            status: 'TODO',
            type: missionType,
        };
        // Only add description if it's not empty (Firebase doesn't accept undefined)
        if (description.trim()) {
            missionData.description = description.trim();
        }
        onAddMission(missionData);
        setTitle('');
        setDescription('');
        setMissionType('PERSONAL');
        onClose();
    };

    const resetAndClose = () => {
        setTitle('');
        setDescription('');
        setMissionType('PERSONAL');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <GlassDialogContent>
                <DialogHeader>
                    <DialogTitle className="text-center">Nouvelle Mission</DialogTitle>
                    <DialogDescription className="text-center">
                        Créez une nouvelle mission pour organiser votre travail
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Type de mission</Label>
                        <RadioGroup value={missionType} onValueChange={(v: MissionType) => setMissionType(v)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PERSONAL" id="mission-type-personal" />
                                <Label htmlFor="mission-type-personal" className="font-normal cursor-pointer">Personnel (privé)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="SHARED" id="mission-type-shared" />
                                <Label htmlFor="mission-type-shared" className="font-normal cursor-pointer">Collaborateur (partagé)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mission-title">Titre de la mission</Label>
                        <Input
                            id="mission-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Préparer le rapport mensuel"
                            className="rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mission-description">Description (optionnel)</Label>
                        <Textarea
                            id="mission-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Détails de la mission..."
                            className="rounded-xl min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!title.trim()}>
                        Créer la mission
                    </Button>
                </DialogFooter>
            </GlassDialogContent>
        </Dialog>
    );
};

