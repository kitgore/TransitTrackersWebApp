'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/src/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Get the user document from Firestore to check their role
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            
            if (userDoc.exists()) {
                const userRole = userDoc.data().role || "driver";
                // Redirect based on role
                if (userRole === "admin") {
                    router.push('/dashboard-admin');
                } else {
                    router.push('/dashboard');
                }
            } else {
                // Default to regular dashboard if role can't be determined
                router.push('/dashboard');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
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

						<div className="space-y-4">
							<div className="space-y-2">
								<Input
									id="email"
									type="email"
									placeholder="Email address"
									autoComplete="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Input
									id="password"
									type="password"
									placeholder="Password"
									autoComplete="current-password"
									required
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
								/>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? 'Processing...' : 'Sign In'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
