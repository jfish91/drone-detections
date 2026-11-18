const RSSI_WINDOW_SECONDS = 5 * 60;
const RSSI_MIN = -110;
const RSSI_MAX = -65;
const BIN_SIZE = 5;
const RSSI_BINS = { min: RSSI_MIN, max: RSSI_MAX, binSize: BIN_SIZE };

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

                allDrones.set(droneID, newDrone);

                // update counts
                bandCounts[detection.band] += 1;
                classCounts[detection.classification] += 1;
            } else {
                // if existing, only update rssi 
                allDrones.get(droneID).rssi = detection.rssi;
            }

            // add rssi to list for histogram
            rssis.push(detection.rssi)

        });

        if (!timestamp) {
            console.log("No timestamp attached to message, rssi's not collected")
        } else {
            rssiHistory.push({timestamp:timestamp, rssis:rssis});
        }
        console.log(`message ${messageCount} handled`);
        // console.log(allDrones);
    }

    function currentState(now = Math.floor(Date.now() / 1000)) {

        const activeCount = activeDroneIDs.size;
        const activeDrones = [...activeDroneIDs].map(id => allDrones.get(id));

        // filter rssi vals to only pass through those in wanted timeframe 
        const cutoff = now - RSSI_WINDOW_SECONDS
        const rssiValues = rssiHistory.filter(group => Number(group.timestamp) >= cutoff).flatMap(group => group.rssis);
        // bin rssi values into histogram
        const histogram = binRssi(rssiValues, RSSI_BINS);
        
        const allDroneList = [...allDrones]

        return {activeDrones, activeCount, messageCount, bandCounts, classCounts, histogram, allDroneList};
    }

    function cleaner() {
        // TODO: implement cleaner, have it run every 5(?) minutes
        // delete any rssi groups > 5 mins old 
        // also delete old drones? need to set some kind of limit to avoid buildup
    }

    return {handleMessage, currentState}
}


export function binRssi(values, { min, max, binSize }) {
  if (!(binSize > 0) || !(max > min)) {
    throw new RangeError('binRssi: need binSize > 0 and max > min');
  }

  const binCount = Math.ceil((max - min) / binSize);
  const counts = new Array(binCount).fill(0);

  // create labels
  const labels = [];
  for (let i = 0; i < binCount; i++) {
    const lo = min + i * binSize;
    const hi = Math.min(lo + binSize, max);
    labels.push(`${lo} to ${hi}`);
  }

  for (const v of values) {
    // skip anything that isn't a real number or falls outside the range
    if (!Number.isFinite(v) || v < min || v > max) continue;

    // value of exactly `max` lands in the last bin
    const i = Math.min(Math.floor((v - min) / binSize), binCount - 1);
    counts[i]++;
  }

  return { labels, counts };
}