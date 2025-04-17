'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchShiftsByUser, fetchRoles } from '@/src/firebase/shiftService';
import Link from 'next/link';

export default function MyShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);

  // First load roles
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

  // Then load shifts once roles are loaded
  useEffect(() => {
    const loadShifts = async () => {
      if (!user || roles.length === 0) return; // Wait for both user and roles
      
      try {
        console.log('Loading shifts for user:', user.uid);
        const userShifts = await fetchShiftsByUser(user.uid);
        console.log('Fetched shifts:', userShifts);
        
        // Sort shifts by start time
        const sortedShifts = userShifts.sort((a, b) => 
          new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime()
        );
        console.log('Sorted shifts:', sortedShifts);
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>My Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view your shifts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>My Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading your shifts...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Upcoming Shifts</h1>
        <Button asChild>
          <Link href="/dashboard">View Schedule</Link>
        </Button>
      </div>

      {shifts.length === 0 ? (
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
    </div>
  );
} 