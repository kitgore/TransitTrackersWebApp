'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { AppSidebar } from "@/components/app-sidebar";

type Notification = {
  id: string;
  message: string;
  source: "local" | "twilio";
  timestamp: string;
};

export default function NotificationsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const isAdmin = role === "admin";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [clearedIds, setClearedIds] = useState<string[]>([]);

  const fetchTwilioNotifications = async (): Promise<Notification[]> => {
    return [
      {
        id: "twilio-sim-1",
        message: "⚠️ Twilio: Route 5 running late",
        source: "twilio",
        timestamp: new Date().toISOString(),
      },
      {
        id: "twilio-sim-2",
        message: "⚠️ Twilio: Power outage on Route 2",
        source: "twilio",
        timestamp: new Date().toISOString(),
      },
    ];
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const cleared: string[] = userSnap.exists() ? userSnap.data().clearedNotifications || [] : [];
      setClearedIds(cleared);

      const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const firestoreNotifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString(),
      })) as Notification[];

      const twilioNotifs = await fetchTwilioNotifications();

      const visible = [...twilioNotifs, ...firestoreNotifs].filter(
        (n) => !cleared.includes(n.id)
      );

      setNotifications(visible);
    };

    load();
  }, [user]);

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const ref = collection(db, "notifications");
    const docRef = await addDoc(ref, {
      message: newMessage,
      source: "local",
      timestamp: Timestamp.now(),
    });

    const newNotif: Notification = {
      id: docRef.id,
      message: newMessage,
      source: "local",
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setNewMessage("");
  };

  const clearNotification = async (notifId: string) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      clearedNotifications: arrayUnion(notifId),
    });

    setClearedIds((prev) => [...prev, notifId]);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const clearAll = async () => {
    if (!user || notifications.length === 0) return;

    const ids = notifications.map((n) => n.id);
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      clearedNotifications: arrayUnion(...ids),
    });

    setClearedIds((prev) => [...prev, ...ids]);
    setNotifications([]);
  };

  if (authLoading) return <p>Loading...</p>;

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-500 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {isAdmin && (
          <form onSubmit={handleCreateNotification} className="mb-6">
            <label className="block text-sm font-medium mb-2">
              New Local Notification
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3 py-2 border rounded shadow-sm"
                placeholder="Enter notification..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </form>
        )}

        {notifications.length === 0 ? (
          <p>No notifications right now.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((note) => (
              <li
                key={note.id}
                className="group flex justify-between items-center bg-gray-50 px-3 py-2 rounded hover:bg-gray-100"
              >
                <span>
                  {note.message}
                  {note.source === "twilio" && (
                    <span className="ml-2 text-xs text-purple-500">(Twilio)</span>
                  )}
                </span>
                <button
                  onClick={() => clearNotification(note.id)}
                  className="text-sm text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppSidebar>
  );
}
