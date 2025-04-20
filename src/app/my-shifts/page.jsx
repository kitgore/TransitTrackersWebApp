'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchShiftsByUser, fetchRoles } from '@/src/firebase/shiftService';
import Link from 'next/link';
import { NavUser } from '@/components/nav-user';
import { BookUser, Calendar, MessageSquare } from 'lucide-react';

export default function MyShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const fetchedRoles = await fetchRoles();
        setRoles(fetchedRoles);
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    loadRoles();
  }, []);

  useEffect(() => {
    const loadShifts = async () => {
      if (!user || roles.length === 0) return;
      try {
        const userShifts = await fetchShiftsByUser(user.uid);
        const sortedShifts = userShifts.sort((a, b) =>
          new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime()
        );
        setShifts(sortedShifts);
      } catch (error) {
        console.error('Error loading shifts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadShifts();
  }, [user, roles]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const userData = {
    name: `${user?.displayName || 'User'}`,
    email: user?.email || '',
    avatar: '/avatars/default.jpg',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full border-b bg-white shadow-sm">
        <div className="flex flex-wrap justify-between items-center px-4 py-3 max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
              <Calendar size={18} /> Schedule
            </Link>
            <Link href="/notifications" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
              <MessageSquare size={18} /> Notifications
            </Link>
            <Link href="/my-shifts" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
              <Calendar size={18} /> View My Shifts
            </Link>
            <Link href="/account" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
              <BookUser size={18} /> User Settings
            </Link>
          </div>
          <NavUser user={userData} />
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 max-w-3xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Upcoming Shifts</h1>
        </div>

        {loading ? (
          <Card>
            <CardHeader><CardTitle>Loading your shifts...</CardTitle></CardHeader>
          </Card>
        ) : shifts.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p>No upcoming shifts found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 text-xl h-16 px-4">
                    <span className="font-semibold">{shift.roleName}</span>
                    <div className="flex-1 flex justify-end items-center gap-4">
                      {shift.vehicleName && (
                        <>
                          <span className="text-base text-gray-600">{shift.vehicleName}</span>
                          <span className="text-muted-foreground">|</span>
                        </>
                      )}
                      <span className="text-base text-gray-600">{formatDate(shift.startTimeISO)}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-base text-gray-600">{formatTime(shift.startTimeISO)} - {formatTime(shift.endTimeISO)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
