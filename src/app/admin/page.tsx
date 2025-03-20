'use client'; // Ensure this line is at the top

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '@/src/firebase/config';
import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea, ScrollBar } from "@/components/bus-status-scrollable";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"; 
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"; 
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";  // Import the Auth context

interface Vehicle {
    id: string;   // Firestore document ID (auto-generated)
    name: string; // Changed from id to name
    vin: string;
    licensePlate: string;
    status: string;
    note?: string;
}

export default function AdminPage() {
    const { user, loading } = useAuth();  // Get the current user from AuthContext
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [status, setStatus] = useState<string>("");
    const [note, setNote] = useState<string>("");

    // Fetch vehicles only if the user is authenticated
    const fetchVehicles = async () => {
        if (!user) return;

        const querySnapshot = await getDocs(collection(db, "vehicles"));
        const vehicleList: Vehicle[] = querySnapshot.docs.map(doc => {
            // Log the document ID (Firestore's auto-generated ID)
            console.log("Fetched document ID:", doc.id);

            // Now using `name` field in the vehicle object
            return {
                id: doc.id,  // The Firestore document ID (auto-generated, treated as string)
                name: doc.data().name || "",  // This is now the field `name` in Firestore
                vin: doc.data().vin || "",
                licensePlate: doc.data().licensePlate || "",
                status: doc.data().status || "",
                note: doc.data().note || ""
            };
        });
        setVehicles(vehicleList);
    };

    useEffect(() => {
        if (!loading && user) {
            fetchVehicles();
        }
    }, [loading, user]);

    // Save changes to Firestore
    const handleSave = async () => {
        if (!selectedVehicle || !selectedVehicle.id) {
            console.error("Selected vehicle is missing or ID is invalid:", selectedVehicle);
            return;
        }

        // Using the document ID for the reference
        const vehicleRef = doc(db, "vehicles", selectedVehicle.id);  // This is the document ID, which should be a string

        const updatedStatus = String(status || ""); // Ensuring status is a string
        const updatedNote = String(note || ""); // Ensuring note is a string

        console.log("Saving vehicle with status:", updatedStatus, "and note:", updatedNote);

        try {
            await updateDoc(vehicleRef, {
                status: updatedStatus,
                note: updatedNote
            });

            console.log(`Updated ${selectedVehicle.id} to ${updatedStatus}, Note: ${updatedNote}`);

            // Update local state
            setVehicles((prev) =>
                prev.map((v) =>
                    v.id === selectedVehicle.id ? { ...v, status: updatedStatus, note: updatedNote } : v
                )
            );

            setSelectedVehicle(null);
            setNote("");
        } catch (error) {
            console.error("Error updating Firestore document:", error);
        }
    };

    const handleCancel = () => {
        setSelectedVehicle(null);
        setNote("");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>You must be logged in to access this page.</div>;
    }

    return (
        <AppSidebar>
            <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Vehicles</h2>
                </div>

                <div className="flex">
                    <div className="w-1/2 rounded-md border">
                        <div className="flex bg-gray-100 font-bold p-3 px-12 border-b">
                            <div className="w-2/5 text-left">Action</div>
                            <div className="w-1/5 text-center">Vehicle</div>
                            <div className="w-2/5 text-right">Status</div>
                        </div>

                        <ScrollArea className="h-[450px] w-full">
                            <div className="space-y-0">
                                {vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="flex items-center p-3 border-b last:border-b-0">
                                        <div className="w-2/5 flex items-center justify-center">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedVehicle(vehicle);
                                                            setStatus(vehicle.status);
                                                            setNote(vehicle.note || "");
                                                        }}
                                                        className="bg-gray-200 text-black px-6 py-2 text-sm font-small hover:bg-black hover:text-white"
                                                    >
                                                        Update Status
                                                    </Button>
                                                </PopoverTrigger>

                                                {selectedVehicle?.id === vehicle.id && (
                                                    <PopoverContent className="w-72 p-4 space-y-4">
                                                        <h4 className="text-sm font-medium">Update Status for {vehicle.name}</h4>

                                                        <Select value={status} onValueChange={setStatus}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="In Use">In Use</SelectItem>
                                                                <SelectItem value="Available">Available</SelectItem>
                                                                <SelectItem value="Out of Service">Out of Service</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        <Input
                                                            value={note}
                                                            onChange={(e) => setNote(e.target.value)}
                                                            placeholder="Enter optional note"
                                                        />

                                                        <div className="flex justify-end space-x-2">
                                                            <Button onClick={handleCancel}>Cancel</Button>
                                                            <Button onClick={handleSave}>Save</Button>
                                                        </div>
                                                    </PopoverContent>
                                                )}
                                            </Popover>
                                        </div>
                                        <div className="w-1/5 text-center">{vehicle.name}</div>
                                        <div className="w-2/5 text-right">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>{vehicle.status}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>{vehicle.note || "No Note"}</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </AppSidebar>
    );
}
