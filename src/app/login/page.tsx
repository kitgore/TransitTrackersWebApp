'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/src/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    // State hooks for form management
    // useState returns [current state, function to update state]
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and signup
    const [isLoading, setIsLoading] = useState(false);
    
    // Next.js router hook for programmatic navigation
    const router = useRouter();

    // Form submission handler
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        setIsLoading(true);
        setError('');
        
        try {
            // Attempt either signup or login based on isSignUp state
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Navigate to dashboard after successful authentication
            router.push('/dashboard');
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
						{isSignUp
							? 'Create an account'
							: 'Sign in to your account'}
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
									autoComplete={
										isSignUp
											? 'new-password'
											: 'current-password'
									}
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
							{isLoading
								? 'Processing...'
								: isSignUp
									? 'Create Account'
									: 'Sign In'}
						</Button>

						<Button
							type="button"
							variant="ghost"
							className="w-full"
							onClick={() => setIsSignUp(!isSignUp)}
						>
							{isSignUp
								? 'Already have an account? Sign in'
								: "Don't have an account? Sign up"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
