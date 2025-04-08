'use client';

import React, { useState } from 'react';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/src/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";  

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [redirected, setRedirected] = useState(false); // prevent multiple redirects

    const { user, role, loading } = useAuth(); // <- now watching loading too
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Now wait for role to load in useEffect
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Wait for context to populate, then redirect
    useEffect(() => {
        if (!loading && user && role && !redirected) {
            if (role === 'admin') {
                router.push('/dashboard-admin');
            } else {
                router.push('/dashboard');
            }
            setRedirected(true);
        }
    }, [loading, user, role, router, redirected]);

    const handleResetPassword = async () => {
        const emailPrompt = prompt('Enter your email to receive a password reset link:');
        if (emailPrompt) {
            try {
                await sendPasswordResetEmail(auth, emailPrompt);
                alert('Password reset email sent! Check your inbox.');
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        Sign in to your account
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        {error && (
                            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Input
                            type="email"
                            placeholder="Email address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="flex justify-center items-center mt-5 p-2">
                        <a href="#" onClick={handleResetPassword}>
                            Forgot Password?
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
