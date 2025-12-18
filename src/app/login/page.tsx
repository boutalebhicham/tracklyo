
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import Logo from '@/components/app/logo';
import { AnimatePresence, motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
});

const registerSchema = z.object({
  name: z.string().min(1, { message: 'Le nom est requis' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    // Redirect to home if user is logged in
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = (data: LoginFormData) => {
    setError(null);
    signInWithEmailAndPassword(auth, data.email, data.password)
      .catch((e: any) => {
        setError(getFirebaseErrorMessage(e.code));
      });
  };

  const handleRegister = async (data: RegisterFormData) => {
    setError(null);
    try {
      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Step 2: Create Firestore document with retry logic
      const userDocRef = doc(firestore, 'users', user.uid);
      const userData = {
        id: user.uid,
        name: data.name,
        email: data.email,
        role: 'PATRON',
        avatar: `https://picsum.photos/seed/${user.uid}/100/100`,
        phoneNumber: '',
      };

      // Retry up to 3 times to ensure document creation
      let retries = 3;
      let docCreated = false;

      while (retries > 0 && !docCreated) {
        try {
          await setDoc(userDocRef, userData, { merge: true });
          // Wait a moment to ensure Firestore indexes the document
          await new Promise(resolve => setTimeout(resolve, 500));
          docCreated = true;
        } catch (docError: any) {
          retries--;
          if (retries === 0) {
            console.error('[handleRegister] Failed to create user document after retries:', docError);
            throw new Error('Impossible de créer votre profil. Veuillez réessayer.');
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Document created successfully - auth redirect will happen automatically via useEffect
    } catch (e: any) {
      console.error('[handleRegister] Registration error:', e);
      setError(e.message || getFirebaseErrorMessage(e.code));
    }
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email': return 'Adresse email invalide.';
      case 'auth/user-not-found':
      case 'auth/wrong-password': 
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.';
      case 'auth/email-already-in-use': return 'Cette adresse email est déjà utilisée.';
      case 'auth/weak-password': return 'Le mot de passe est trop faible.';
      default: return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  // While checking auth, show a loading state. 
  // If user is found, the useEffect above will redirect.
  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><p>Chargement...</p></div>;
  }
  
  // If user is already logged in, useEffect will handle redirection, so we can return null here to avoid flicker.
  if (user) {
    return null;
  }
  
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <Logo className="h-16 w-auto mx-auto mb-4 text-white" />
        <p className="max-w-md text-slate-300">
          Suivez l'activité, le budget et l'agenda de vos équipes en temps réel. Tracklyo, votre partenaire de confiance.
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="bg-white/10 backdrop-blur-lg text-white p-6 sm:p-8 rounded-4xl border border-white/20 shadow-2xl shadow-primary/10">
          <AnimatePresence mode="wait">
            {isRegistering ? (
              <motion.div
                key="register"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-center">Créer un compte de gestion</h2>
                 <p className="text-center text-sm text-slate-300 mt-2">Vous pourrez ajouter vos collaborateurs ensuite.</p>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="grid gap-4 mt-6">
                  <div className="grid gap-2">
                    <Label htmlFor="register-name">Nom complet</Label>
                    <Input id="register-name" {...registerForm.register('name')} className="rounded-xl bg-white/10 border-white/20 placeholder:text-slate-400 focus:ring-offset-slate-900" />
                    {registerForm.formState.errors.name && <p className="text-red-400 text-sm">{registerForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" {...registerForm.register('email')} className="rounded-xl bg-white/10 border-white/20 placeholder:text-slate-400 focus:ring-offset-slate-900" />
                    {registerForm.formState.errors.email && <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <Input id="register-password" type="password" {...registerForm.register('password')} className="rounded-xl bg-white/10 border-white/20 placeholder:text-slate-400 focus:ring-offset-slate-900" />
                    {registerForm.formState.errors.password && <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" disabled={registerForm.formState.isSubmitting}>
                    {registerForm.formState.isSubmitting ? 'Création...' : "S'inscrire"}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-300">
                  Déjà un compte ?{' '}
                  <button onClick={() => setIsRegistering(false)} className="font-semibold text-primary hover:underline">
                    Se connecter
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-center">Bon retour !</h2>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4 mt-6">
                  <div className="grid gap-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" {...loginForm.register('email')} className="rounded-xl bg-white/10 border-white/20 placeholder:text-slate-400 focus:ring-offset-slate-900" />
                    {loginForm.formState.errors.email && <p className="text-red-400 text-sm">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input id="login-password" type="password" {...loginForm.register('password')} className="rounded-xl bg-white/10 border-white/20 placeholder:text-slate-400 focus:ring-offset-slate-900" />
                    {loginForm.formState.errors.password && <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-300">
                  Pas encore de compte ?{' '}
                  <button onClick={() => setIsRegistering(true)} className="font-semibold text-primary hover:underline">
                    Inscrivez-vous
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

    