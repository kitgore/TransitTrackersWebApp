'use client'; // Ensure this line is at the top

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea, ScrollBar } from "@/components/bus-status-scrollable";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    // Sample vehicle data for demonstration
    const vehicles = Array.from({ length: 30 }).map((_, i) => ({
        id: `V-${1000 + i}`,            // Vehicle ID
        status: i % 2 === 0 ? "Active" : "Inactive"  // Alternating status
    }));

    // Example function for updating the vehicle status
    const handleUpdateStatus = (vehicleId: string) => {
        console.log(`Update status for vehicle ${vehicleId}`);
        // You can implement your status update logic here
    };

    return (
        <AppSidebar breadcrumb="Administrator Panel">
            <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Vehicles</h2>
                    </div>
                </div>

                <div className="flex">
                    <div className="w-1/2 rounded-md border">
                        {/* Fixed Header Row */}
                        <div className="flex bg-gray-100 font-bold p-3 px-12 border-b">
                            <div className="w-2/5 text-left">Action</div>
                            <div className="w-1/5 text-center">Vehicle ID</div>
                            <div className="w-2/5 text-right">Status</div>
                        </div>

                        {/* Scrollable content */}
                        <ScrollArea className="h-[450px] w-full">
                            <div className="space-y-4">
                                {vehicles.map((vehicle, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-3 border-b last:border-b-0"
                                    >
                                        {/* Action (Update Status Button) */}
                                        <div className="w-2/5 flex items-center justify-center">
                                            <Button
                                                onClick={() => handleUpdateStatus(vehicle.id)}
                                                className="bg-gray-200 text-black px-6 py-2 text-sm font-small hover:bg-black hover:text-white"
                                            >
                                                Update Status
                                            </Button>
                                        </div>

                                        {/* Vehicle ID */}
                                        <div className="w-2/5 text-center text-sm font-medium">
                                            {vehicle.id}
                                        </div>

                                        {/* Status */}
                                        <div className="w-2/5 text-right px-6">
                                            <span
                                                className={`inline-block px-3 py-2 text-xs font-bold rounded ${
                                                    vehicle.status === "Active"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {vehicle.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </AppSidebar>
    );
}



