'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, updateEmail } from 'firebase/auth';
import { auth } from '@/src/firebase/config';
import { getUserProfile, updateUserProfile } from '@/src/firebase/userService';
import { AppSidebar } from '@/components/app-sidebar';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/firebase/config';
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [uploading, setUploading] = useState(false);

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
        await user.updateEmail(value);
      } catch (authErr: any) {
        alert("Failed to update email in Auth: " + authErr.message);
      }
    }

    await updateUserProfile(user.uid, { [field]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile(user.uid, { avatarUrl: url });
      setProfile((prev: any) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      alert("Upload failed. See console for details.");
    } finally {
      setUploading(false);
    }
  };


  return (
<AppSidebar>
  <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded-lg">
    <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
    {profile ? (
      <>
        <div className="mb-4">
          <label className="block font-medium mb-1">Upload Profile Picture</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt="Profile"
              className="mt-2 w-20 h-20 rounded-full border object-cover"
            />
          )}
        </div>

        <ul className="space-y-4">
          {['firstName', 'lastName', 'email', 'phoneNumber'].map((field) => (
            <li key={field} className="flex justify-between items-center">
              <div>
                {/* Capitalize the first letter of the field name */}
                <strong>{field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</strong>:
                <span className="ml-2">
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
                </span>
              </div>

              {editingField === field ? (
                <div className="flex space-x-4 items-center">
                  <Button
                    onClick={() => {
                      handleChange(field, editValue);
                      setEditingField(null);
                    }}
                    className="bg-white border border-gray-400 text-green-500 hover:bg-gray-100"
                  >
                    Update
                  </Button>
                  <Button
                    onClick={() => setEditingField(null)}
                    className="bg-white border border-gray-400 text-red-500 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 ml-2">
                  <Button
                    onClick={() => {
                      setEditingField(field);
                      setEditValue(profile[field] || '');
                    }}
                    className="bg-white border border-gray-400 text-black hover:bg-gray-100"
                  >
                    Change
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </>
    ) : (
      <p>Loading...</p>
    )}
  </div>
</AppSidebar>



  );
}