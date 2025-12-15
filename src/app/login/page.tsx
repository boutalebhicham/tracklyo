'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase';
import Logo from '@/components/app/logo';

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
});

const registerSchema = z.object({
  name: z.string().min(1, { message: 'Le nom est requis' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
  role: z.enum(['PATRON', 'RESPONSABLE']),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
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
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/');
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e.code));
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: `https://picsum.photos/seed/${user.uid}/100/100`,
        phoneNumber: '', // Can be added later
      }, { merge: true });
      
      router.push('/');
    } catch (e: any) {
      setError(getFirebaseErrorMessage(e.code));
    }
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Chargement...</p>
        </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="hidden bg-primary lg:flex flex-col items-center justify-center p-10 text-primary-foreground">
        <div className="text-center">
            <Logo className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold">Tracklyo</h1>
            <p className="text-lg mt-2 opacity-80">Suivez l'activité, le budget et l'agenda en temps réel.</p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <Tabs defaultValue="login" className="mx-auto grid w-[350px] gap-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card className="border-none shadow-none">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Bienvenue</CardTitle>
                <CardDescription>
                  Entrez vos identifiants pour accéder à votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" {...loginForm.register('email')} className="rounded-lg"/>
                    {loginForm.formState.errors.email && <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input id="login-password" type="password" {...loginForm.register('password')} className="rounded-lg" />
                    {loginForm.formState.errors.password && <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full rounded-lg" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="register">
             <Card className="border-none shadow-none">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Créez un compte</CardTitle>
                <CardDescription>
                  C'est parti pour une gestion simplifiée.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="register-name">Nom complet</Label>
                    <Input id="register-name" {...registerForm.register('name')} className="rounded-lg"/>
                     {registerForm.formState.errors.name && <p className="text-red-500 text-sm">{registerForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" {...registerForm.register('email')} className="rounded-lg"/>
                    {registerForm.formState.errors.email && <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <Input id="register-password" type="password" {...registerForm.register('password')} className="rounded-lg"/>
                    {registerForm.formState.errors.password && <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>}
                  </div>
                   <div className="grid gap-2">
                    <Label>Rôle</Label>
                    <select {...registerForm.register('role')} className="w-full p-2 border rounded-lg bg-transparent focus:ring-2 focus:ring-ring">
                      <option value="PATRON">Patron</option>
                      <option value="RESPONSABLE">Responsable</option>
                    </select>
                  </div>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full rounded-lg" disabled={registerForm.formState.isSubmitting}>
                    {registerForm.formState.isSubmitting ? 'Création...' : "S'inscrire"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
