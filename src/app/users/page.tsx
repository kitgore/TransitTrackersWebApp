// app/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { AppSidebar } from "@/components/app-sidebar";
import { UserTable, type User } from "@/components/user-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppSidebar breadcrumb="Manage Drivers">
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Drivers</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push('/add-user')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <UserTable users={users} />
        )}
      </div>
    </AppSidebar>
  );
}