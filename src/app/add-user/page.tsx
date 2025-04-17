'use client';

import { useState } from 'react';
import { userService } from '@/src/firebase/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from '@/components/app-sidebar';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface NewUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'admin' | 'driver';
}

export default function UsersPage() {
  const { user, loading: authLoading, role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'driver', // Default role is "driver"
  });

  const [phoneParts, setPhoneParts] = useState({
    country: '1',
    area: '',
    prefix: '',
    line: '',
  });

  if (authLoading) {
    return <div>Loading...</div>;
  } 

  if (!user) {
    return <div>You must be logged in to access this page.</div>;
  }

  if (role !== "admin") {
      return <div className="text-center text-red-500 font-bold text-lg mt-10">Access Denied: You do not have admin privileges.</div>;
  }

  const validateForm = () => {
    if (!newUser.email) {
      throw new Error('Email is required');
    }
    
    const { country, area, prefix, line } = phoneParts;
    
    if (![country, area, prefix, line].every(part => /^\d+$/.test(part))) {
      throw new Error('Phone number is invalid.');
    }
    
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      validateForm();

      const randomPassword = Math.random().toString(36).slice(-10);

      const fullPhoneNumber = `+${phoneParts.country}${phoneParts.area}${phoneParts.prefix}${phoneParts.line}`;
      const userToCreate = { ...newUser, phoneNumber: fullPhoneNumber, password: randomPassword };

      try {
        await userService.createUser(userToCreate);
      }
      catch (error: any) {
        console.error('User creation error:', error);
      
        let errorMessage = 'Failed to create user';
      
        // Check for the specific error about the email already being in use
        if (error.message === 'This email is already registered') {
          errorMessage = 'That email is already in use by another account.';
        }
      
        // Show the toast with the appropriate error message
        toast({
          title: 'Failed to create user',
          description: errorMessage,
        });
      
        return; // Stop execution if user creation fails
      }      

      // Send the password reset email
      const auth = getAuth(); // Firebase client-side auth

      try {
          await sendPasswordResetEmail(auth, newUser.email);
          toast({
            title: 'User created successfully!',
            description: 'Password reset email sent!'
          });
      } catch (error: any) {
        toast({
          title: 'User created, but email failed',
          description: error.message || ''
        });
      }

      // Reset form
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'driver',
      });

      setPhoneParts({
        country: '1',
        area: '',
        prefix: '',
        line: '',
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Failed to create user",
        description: error.message || '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppSidebar>
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={() => router.push('/users')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Drivers
        </Button>

        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription className="text-red-500">
                An email will be sent to the new user so they can reset their password and log in. Ensure the email address is accurate and ask them to check their inbox.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName">First Name</label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      value={newUser.firstName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName">Last Name</label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      value={newUser.lastName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="country"
                      className="w-14"
                      value={phoneParts.country}
                      onChange={(e) => setPhoneParts({ ...phoneParts, country: e.target.value })}
                      maxLength={1}
                    />
                    <span className="text-gray-500">(</span>
                    <Input
                      id="area"
                      className="w-20"
                      value={phoneParts.area}
                      onChange={(e) => setPhoneParts({ ...phoneParts, area: e.target.value })}
                      maxLength={3}
                    />
                    <span className="text-gray-500">)</span>
                    <Input
                      id="prefix"
                      className="w-20"
                      value={phoneParts.prefix}
                      onChange={(e) => setPhoneParts({ ...phoneParts, prefix: e.target.value })}
                      maxLength={3}
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      id="line"
                      className="w-24"
                      value={phoneParts.line}
                      onChange={(e) => setPhoneParts({ ...phoneParts, line: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                </div>

                {/*<div className="space-y-2">
                  <label htmlFor="password">Password</label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password (min. 6 characters)"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>*/}

                {/* Role Toggle */}
                <div className="flex items-center justify-end space-x-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Make this user an administrator
                  </label>
                  <Switch
                    id="role"
                    checked={newUser.role === 'admin'}
                    onCheckedChange={(checked) =>
                      setNewUser({ ...newUser, role: checked ? 'admin' : 'driver' })
                    }
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
