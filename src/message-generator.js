// restrictions for rssi range
const RSSI_MIN = -110;
const RSSI_MAX = -65;
const RSSI_STEP = 5;

// chance the drone appears in the next detections array
const SURVIVAL_RATE = 0.8;

// generate anywhere from 0 to 2 drones on every tick
// max of 3 = steady state 7.5
// max of 2 = steady state 5
const NEW_DRONE_MAX = 2;
const NEW_DRONE_MIN = 0;
const TOTAL_DRONE_MIN = 2;

export function roundToFourDecimals(num) {
    return parseFloat(num.toFixed(4));
}

// generate random 8 character ID for drone_id and msg_id
export function generateID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';

    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ensure new id isnt already included in input set
export function generateUniqueID(idSet) {
    let id = generateID();
    while (idSet.has(id)) id = generateID();
    // add new id to set
    idSet.add(id);
    return id;
}

// generate rssi between -110 and -65 rounded to 4 decimals
export function generateRssi() {
    return roundToFourDecimals((Math.random() * (RSSI_MAX - RSSI_MIN)) + RSSI_MIN);
}

// given prev rssi, generate random change
export function nextRssi(prevRssi) {
    // const change = (Math.random() * 10) - RSSI_STEP;
    const change = (Math.random() * 2 * RSSI_STEP - RSSI_STEP)
    let nextValue = prevRssi + change;
    // if nextValue outside of range, reverse the change
    if (nextValue < RSSI_MIN || nextValue > RSSI_MAX) {
        nextValue = prevRssi - change;
    }
    return roundToFourDecimals(nextValue);
}

// create new drone
export function createDrone(timestamp, droneIDs) {
    const drone = {
        drone_id: generateUniqueID(droneIDs),
        start_time: timestamp,
        band : Math.random() < 0.5 ? '2.4GHz' : '5.8GHz',
        classification: Math.random() < 0.5 ? 'OcuSync' : 'Lightbridge',
        rssi: generateRssi(),
    };
    return drone;
}

// update rssi of drone, all other fields should remain the same
export function updateDrone(drone) {
    return {
        ...drone,
        rssi: nextRssi(drone.rssi),
    }
}

// generate new message, update id sets, update surviving/killed drones
export function createSimulator() {

    // these sets are updated within the tick function
    const droneIDs = new Set();
    const msgIDs = new Set();
    // alive drones also updated within function
    let aliveDrones = [];

    function tick(timestamp) {

        // new lists to hold which existing drones survive and which are killed
        const detections = [];
        const newlyKilledDrones = [];

        // drones survive with 80% probability, update rssi
        aliveDrones.forEach(drone => { 
            if (Math.random() < SURVIVAL_RATE) {
                detections.push(updateDrone(drone));
            } else {
                newlyKilledDrones.push(drone);
            }
        });

        // randomly generate how many drones should be added
        let numNewDrones = Math.floor(Math.random()*(NEW_DRONE_MAX - NEW_DRONE_MIN + 1)) + NEW_DRONE_MIN
        // if <2 drones exist always create at least one
        if (detections.length < TOTAL_DRONE_MIN) numNewDrones = Math.max(numNewDrones,1);
            
        // create new drones
        for (let i=0; i < numNewDrones; i++) {
            const newDrone = createDrone(timestamp, droneIDs);
            // add drone to list of detected drones
            detections.push(newDrone);
        }

        // create message
        const msg = {
            msg_type: "detections",
            system: "detection_service",
            msg_id: generateUniqueID(msgIDs),
            detections: detections,
            timestamp: timestamp,
        }

        aliveDrones = detections;

        return {msg, newlyKilledDrones};
    }

    return {tick}
}

