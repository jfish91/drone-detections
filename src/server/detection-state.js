
const RSSI_HISTORY_TIMEFRAME = 5;

export function createDetectionState() {

    let messageCount = 0;
    const allDrones = new Map();
    let activeDroneIDs = new Set();

    const bandCounts = {'2.4GHz': 0, '5.8GHz': 0}
    const classCounts = {'Lightbridge': 0, 'OcuSync': 0};

    // in future, make this an object?
    const rssiHistory = [];
    
    function handleMessage(msg) {
        // increment message count by 1
        messageCount++;
        console.log(`MESSAGE ${messageCount} recieved`)

        const timestamp = msg.timestamp || null;
        const rssis = []
        
        const actives = msg.detections || [];
        activeDroneIDs = new Set(actives.map(detection => detection.drone_id));

        // for each detection, add to all drones if it does not exist already
        actives.forEach(detection => {
            const droneID = detection.drone_id;
            if (!allDrones.has(droneID)) {
                // create new drone if not found in existing allDrones
                const newDrone = {
                    drone_id: detection.drone_id,
                    start_time: detection.start_time,
                    band :detection.band,
                    classification: detection.classification,
                    rssi: detection.rssi,
                }; 
                // console.log(droneID)
                // console.log(newDrone)
                allDrones.set(droneID, newDrone);
                // console.log(allDrones);

                // update counts
                bandCounts[detection.band] += 1;
                classCounts[detection.classification] += 1;
            } else {
                // if existing, only update rssi 
                allDrones.get(droneID).rssi = detection.rssi;
            }

        });

        if (!timestamp) {
            console.log("No timestamp attached to message, rssi's not collected")
        } else {
            rssiHistory.push({timestamp:timestamp, rssis:rssis});
        }
        console.log(`message ${messageCount} handled`);
        // console.log(allDrones);
    }

    function currentState() {

        const activeCount = activeDroneIDs.size;
        const activeDrones = [...activeDroneIDs].map(id => allDrones.get(id));

        // want last X mins of rssi history, data every 3 seconds = 20 items per minute
        // TODO: come back and fix this later
        const recentRSSI = rssiHistory.slice(-(20* RSSI_HISTORY_TIMEFRAME));  

        const allDroneList = [...allDrones]
        return {activeDrones, activeCount, messageCount, bandCounts, classCounts, recentRSSI, allDroneList};
    }

    function cleaner() {
        // TODO: implement cleaner, have it run every 5(?) minutes
        // delete any rssi groups > 5 mins old 
        // also delete old drones? need to set some kind of limit to avoid buildup
    }

    return {handleMessage, currentState}
}