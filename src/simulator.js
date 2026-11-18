import {createSimulator} from './message-generator.js' 

const sim = createSimulator();

// temp url for testing, need to switch to frontend express app
const url = 'https://httpbin.org/post'

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

// trigger initial message POST then send every 3 seconds
simMessage();
setInterval(simMessage, 3000);
