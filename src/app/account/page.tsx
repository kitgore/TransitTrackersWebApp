'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/src/firebase/config';
import { getUserProfile, updateUserProfile } from '@/src/firebase/userService';
import { updateEmail } from 'firebase/auth';



export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
const [editingField, setEditingField] = useState<string | null>(null);
const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const data = await getUserProfile(currentUser.uid);
        setProfile(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = async (field: string, value: string) => {
    if (!user) return;
  
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);
  
    if (field === 'email') {
      try {
        await user.updateEmail(value); // update in Firebase Auth
      } catch (authErr: any) {
        alert("Failed to update email in Auth: " + authErr.message);
      }
    }
  
    await updateUserProfile(user.uid, { [field]: value }); // update in Firestore
  };
  

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
      <ul className="space-y-4">
  {['firstName', 'lastName', 'email', 'phoneNumber'].map((field) => (
    <li key={field} className="flex justify-between items-center">
      <div>
        <strong>{field.replace(/([A-Z])/g, ' $1')}</strong>:{' '}
        {editingField === field ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="border rounded px-2 py-1"
          />
        ) : (
          profile[field] || 'Not provided'
        )}
      </div>

      {editingField === field ? (
        <div className="space-x-2">
          <button
            onClick={() => {
              handleChange(field, editValue);
              setEditingField(null);
            }}
            className="text-green-500 hover:underline"
          >
            Update
          </button>
          <button
            onClick={() => setEditingField(null)}
            className="text-red-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setEditingField(field);
            setEditValue(profile[field] || '');
          }}
          className="text-blue-500 underline"
        >
          Change
        </button>
      )}
    </li>
  ))}
</ul>


      <div className="mt-8 text-center">
  <button
    onClick={() => window.history.back()}
    className="text-sm text-gray-600 hover:text-blue-500 transition"
  >
    ← Back
  </button>
</div>

    </div>
  );
}
