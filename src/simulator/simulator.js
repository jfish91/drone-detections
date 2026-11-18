import 'dotenv/config'
import {createSimulator} from './message-generator.js' 

const sim = createSimulator();

const url = process.env.POST_URL || 'https://httpbin.org/post' // TODO: replace with express frontend app URL 

async function simMessage() {
    let timestamp = Math.floor(Date.now()/1000); // in seconds

    let {msg, newlyKilledDrones} = sim.tick(timestamp)

    // console.log(msg);
    // console.log(newlyKilledDrones)

    const headers = {"Content-Type": "application/json"}
    try {
        const resp = await fetch(url,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(msg)
            }
        );

        if (!resp.ok) {
            console.log(`POST failed: ${resp.status}`)
        } else {
            console.log(`POST success: ${resp.status}`);
        }

    } catch(err) {
        console.error(err)
    }
}

console.log(`simulator running... sending to ${url}`)

// trigger initial message POST then send every 3 seconds
simMessage();
setInterval(simMessage, 3000);
