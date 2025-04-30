'use client'; 
import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from '@/src/firebase/config';
import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea, ScrollBar } from "@/components/bus-status-scrollable";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"; 
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from '@radix-ui/react-checkbox';
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";  
import { useRouter } from 'next/navigation';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/switch';
import VehicleStatusWatcher from "@/components/vehicleStatusWatcher";

interface Vehicle {
    id: string;
    name: string;
    vin: string;
    licensePlate: string;
    status: string;
    note?: string;
    adaAccessible?: boolean;
}

export default function AdminPage() {
    const { user, loading, role } = useAuth();
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [status, setStatus] = useState<string>("");
    const [note, setNote] = useState<string>("");

    // State for the "Add a Vehicle" form
    const [vehicleName, setVehicleName] = useState<string>("");
    const [vin, setVin] = useState<string>("");
    const [licensePlate, setLicensePlate] = useState<string>("");
    const [isAdaAccessible, setIsAdaAccessible] = useState(false);

    const [vehicleToRemove, setVehicleToRemove] = useState<Vehicle | null>(null);
    const [plateInput, setPlateInput] = useState<string>("");

    const fetchVehicles = useCallback(() => {
        if (!user) return;
    
        const vehiclesRef = collection(db, "vehicles");
    
        // Set up real-time listener
        const unsubscribe = onSnapshot(vehiclesRef, (querySnapshot) => {
            const vehicleList: Vehicle[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || "",
                vin: doc.data().vin || "",
                licensePlate: doc.data().licensePlate || "",
                status: doc.data().status || "Available",
                note: doc.data().note || "",
                adaAccessible: doc.data().adaAccessible ?? false // default to false if undefined
            }));
            setVehicles(vehicleList);
        });
    
        // Clean up the listener when the component is unmounted or when user changes
        return () => unsubscribe();
    }, [user]);
    
    useEffect(() => {
        if (!loading && user) {
            fetchVehicles();
        }
    }, [loading, user, fetchVehicles]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>You must be logged in to access this page.</div>;
    }

    if (role !== "admin") {
        return <div className="text-center text-red-500 font-bold text-lg mt-10">Access Denied: You do not have admin privileges.</div>;
    }

    // Add vehicle to Firestore
    const handleAddVehicle = async () => {
        if (!vehicleName || !vin || !licensePlate) {
            alert("Please fill out all fields.");
            return;
        }

        const newVehicle = {
            name: vehicleName,
            vin,
            licensePlate,
            status: "Available",
            note: "",
            adaAccessible: isAdaAccessible
        };

        try {
            await addDoc(collection(db, "vehicles"), newVehicle);

            // Clear form fields
            setVehicleName("");
            setVin("");
            setLicensePlate("");
            setIsAdaAccessible(false);

            // Refresh the vehicle list
            fetchVehicles();
            alert("Vehicle added successfully!");
        } catch (error) {
            console.error("Error adding vehicle:", error);
            alert("Failed to add vehicle.");
        }
    };

    const handleRemoveVehicle = async () => {
        if (!vehicleToRemove) {
            alert("Please select a vehicle.");
            return;
        }
    
        if (plateInput !== vehicleToRemove.licensePlate) {
            alert("License plate does not match. Removal denied.");
            return;
        }
    
        try {
            const vehicleRef = doc(db, "vehicles", vehicleToRemove.id);
            await deleteDoc(vehicleRef);  // Use deleteDoc() here
    
            alert(`Vehicle ${vehicleToRemove.name} removed successfully.`);
    
            // Refresh the list
            fetchVehicles();
            setVehicleToRemove(null);
            setPlateInput("");
        } catch (error) {
            console.error("Error removing vehicle:", error);
            alert("Failed to remove vehicle.");
        }
    };

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
       <TooltipProvider>
        <AppSidebar>
            <VehicleStatusWatcher /> {/* Starts the periodic updater immediately */}
            <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Manage Vehicles</h2>
                </div>

                <div className="flex space-x-8">
                    <div className="w-1/2 rounded-md border">
                        <div className="flex bg-gray-100 font-bold p-3 px-12 border-b">Vehicle Details & Status</div>

                        <ScrollArea className="h-[500px] w-full">
                            <div className="space-y-0">
                                {vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="flex items-center p-3 border-b last:border-b-0">
                                        <div className="w-2/5 flex items-center justify-right px-6">
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
                                              
                                                    {vehicle.status === "In Use" ? (
                                                      <div className="text-red-500 font-medium">
                                                        This vehicle is being driven, you cannot change the status.
                                                      </div>
                                                    ) : (
                                                      <>
                                                        <Select value={status} onValueChange={setStatus}>
                                                          <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Status" />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="Available">Available</SelectItem>
                                                            <SelectItem value="Out of Service">Out of Service</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                              
                                                        <Input
                                                          value={note}
                                                          onChange={(e) => setNote(e.target.value)}
                                                          placeholder="Enter optional note"
                                                        />
                                                      </>
                                                    )}
                                              
                                                    <div className="flex justify-end space-x-2">
                                                      <Button onClick={handleCancel}>Cancel</Button>
                                                      {vehicle.status !== "In Use" && <Button onClick={handleSave}>Save</Button>}
                                                    </div>
                                                  </PopoverContent>
                                                )}
                                            </Popover>
                                        </div>

                                        <div className="w-1/5 text-center">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                    <Button  
                                                            className="bg-gray-200 text-black px-6 py-2 text-sm font-small hover:bg-black hover:text-white"
                                                        >{vehicle.name}</Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-4 space-y-3">
                                                        <h4 className="text-lg font-bold mb-2">Vehicle Details</h4>
                                                        <div>Name: {vehicle.name}</div>
                                                        <div>License Plate: {vehicle.licensePlate}</div>
                                                        <div>VIN: {vehicle.vin}</div>
                                                        <div>ADA Accessible: {vehicle.adaAccessible ? "Yes" : "No"}</div>
                                                    </PopoverContent>
                                                </Popover>
                                        </div>

                                        <div className="w-2/5 text-right px-6">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className={` px-2 py-1 rounded-lg font-medium
                                                        ${vehicle.status === "In Use" ? "bg-blue-200 text-blue-800" :
                                                            vehicle.status === "Available" ? "bg-green-200 text-green-800" :
                                                            "bg-red-200 text-red-800"}`}
                                                    >
                                                        {vehicle.status}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>{vehicle.note || "No Note"}</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex w-1/2 h-full space-y-4 flex-col">
                        <div className="flex-1 rounded-md border">
                            <div className="flex bg-gray-100 font-bold p-3 px-12 border-b">Add a Vehicle</div>

                            <div className="p-4 space-y-4">
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium py-2">Vehicle Number:</label>
                                        <Input
                                            type="text"
                                            value={vehicleName}
                                            onChange={(e) => setVehicleName(e.target.value)}
                                            placeholder="Enter vehicle number (e.g. 123)"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-sm font-medium py-2">License Plate:</label>
                                        <Input
                                            type="text"
                                            value={licensePlate}
                                            onChange={(e) => setLicensePlate(e.target.value)}
                                            placeholder="Enter license plate"
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium py-2">Vehicle VIN:</label>
                                        <Input
                                            type="text"
                                            value={vin}
                                            onChange={(e) => setVin(e.target.value)}
                                            placeholder="Enter VIN"
                                        />
                                    </div>

                                    <div className="flex-1 flex py-8 justify-center items-center">
                                        <Button onClick={handleAddVehicle} className="bg-gray-200 text-black px-6 py-2 text-sm font-small hover:bg-black hover:text-white">
                                            Add to Database
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <Switch
                                        checked={isAdaAccessible}
                                        onCheckedChange={setIsAdaAccessible}/>
                                    <label className="text-sm font-medium">This Vhicle is ADA Accessible:</label>
                                </div>
                                
                            </div>
                        </div>

                        <div className="flex-1 rounded-md border mt-4">
                            <div className="flex bg-gray-100 font-bold p-3 px-12 border-b">Remove a Vehicle</div>
                            <div className="p-4 space-y-4">

                                {/* Vehicle selection dropdown */}
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium py-2">Choose a Vehicle to Remove:</label>
                                        <Select onValueChange={(value) => {
                                            const vehicle = vehicles.find(v => v.id === value) || null;
                                            setVehicleToRemove(vehicle);
                                            setPlateInput("");
                                        }}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a vehicle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Display the license plate */}
                                    <div className="flex-1">
                                        <label className="block text-sm text-center font-medium py-2">Selected Vehicle Plate:</label>
                                        <div className="text-center text-lg font-semibold">
                                            {vehicleToRemove?.licensePlate || "N/A"}
                                        </div>
                                    </div>
                                </div>

                                {/* Plate verification and remove button */}
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium py-2">Verify the License Plate:</label>
                                        <Input
                                            type="text"
                                            value={plateInput || ""}  // Ensure it's always controlled
                                            onChange={(e) => setPlateInput(e.target.value)}
                                            placeholder="Must match plate displayed"
                                        />
                                    </div>

                                    <div className="flex-1 flex py-8 justify-center items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    onClick={handleRemoveVehicle} 
                                                    className="bg-gray-200 text-black px-6 py-2 text-sm font-small hover:bg-red-600 hover:text-white"
                                                >
                                                    Remove from Database
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <span className="text-sm">This cannot be undone!</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppSidebar>
      </TooltipProvider>
    );
}
