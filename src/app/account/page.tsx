'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/firebase/config';
import { updateProfile, updateEmail } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [updatedValue, setUpdatedValue] = useState('');

  useEffect(() => {
    if (user) {
      const [first = '', last = ''] = user.displayName?.split(' ') || [];
      setFirstName(first);
      setLastName(last);
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setUpdatedValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setUpdatedValue('');
  };

  const handleSaveEdit = async () => {
    if (!user) return;

    try {
      if (editingField === 'firstName' || editingField === 'lastName') {
        const newDisplayName =
          editingField === 'firstName'
            ? `${updatedValue} ${lastName}`
            : `${firstName} ${updatedValue}`;
        await updateProfile(user, { displayName: newDisplayName });
        if (editingField === 'firstName') setFirstName(updatedValue);
        else setLastName(updatedValue);
      }

      if (editingField === 'email') {
        await updateEmail(user, updatedValue);
        setEmail(updatedValue);
      }

      if (editingField === 'phoneNumber') {
        // Firebase Auth doesn't support phone number update directly
        alert('Phone number update not supported via web.');
      }

      setEditingField(null);
      setUpdatedValue('');
    } catch (error: any) {
      alert('Update failed: ' + error.message);
    }
  };

  const renderField = (label: string, value: string, fieldKey: string) => {
    const isEditing = editingField === fieldKey;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{label}</label>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
              className="w-full"
            />
            <Button onClick={handleSaveEdit}>Save</Button>
            <Button variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p>{value || 'Not provided'}</p>
            <Button variant="ghost" onClick={() => handleStartEdit(fieldKey, value)}>
              Change
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background p-6">
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Account Settings</h1>
        {renderField('First Name', firstName, 'firstName')}
        {renderField('Last Name', lastName, 'lastName')}
        {renderField('Email', email, 'email')}
        {renderField('Phone Number', phoneNumber, 'phoneNumber')}
      </div>
    </div>
  );
}
