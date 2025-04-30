// vehicleStatusUpdater.ts
import { setVehicleStatusToInUseForCurrentShift} from '../src/firebase/vehicleService';

import { useEffect } from "react";

export default function VehicleStatusWatcher() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateStatusAndScheduleNext = async () => {
      console.log("Checking and updating vehicle statuses...");
      try {
        await setVehicleStatusToInUseForCurrentShift();
        // Optionally refresh vehicle data if needed
        // await fetchAllVehicles();
      } catch (error) {
        console.error("Failed to update vehicle statuses", error);
      }
      // Schedule the next check
      timeoutId = setTimeout(updateStatusAndScheduleNext, 300000); // 5 minutes
    };

    updateStatusAndScheduleNext(); // Start the loop

    return () => clearTimeout(timeoutId); // Cleanup on unmount
  }, []);

  return null; // This component does not render anything
}



