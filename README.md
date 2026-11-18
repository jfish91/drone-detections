# Drone Detection Monitor

Simulates incoming drone detection messages and displays them in a real-time web UI.

- **Simulator** generates and POSTs a detections message every 3 seconds.
- **Server** (Node + Express) receives the messages, keeps the data in memory, and serves the UI.
- **UI** (plain HTML/JS + Chart.js) polls the server and shows the live data.

```
simulator ──POST /api/detections──▶ server ──serves──▶ browser UI
                                      ▲                    │
                                      └── GET /api/current ┘  (polled every second)
```

## Requirements

- Node.js 22 or newer (uses the built-in `fetch`, `--env-file-if-exists`, and the built-in test runner)

## Quick start

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

`npm start` runs the server and the simulator together in one terminal (logs are labeled by process). Press Ctrl+C to stop both.

### Other commands

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `npm run server`   | Run only the server and UI                       |
| `npm run simulate` | Run only the simulator                           |
| `npm test`         | Run the unit tests (Node's built-in test runner) |

### Configuration (optional)

Everything has a default, so no setup is required. To override, copy `.env.example` to `.env`:

| Variable     | Default                                | Used by   |
| ------------ | -------------------------------------- | --------- |
| `PORT`       | `3000`                                 | server    |
| `SERVER_URL` | `http://localhost:3000/api/detections` | simulator |

If you change `PORT`, change `SERVER_URL` to match.

## Project structure

```
src/
  server/
    server.js            Express app: API routes + static files
    detection-state.js   In-memory state and data logic (counts, active drones, histogram)
  simulator/
    simulator.js         Loop that POSTs a message every 3 seconds
    message-generator.js Generates drones and messages
public/
  index.html             UI layout
  styles.css             Styling
  app.js                 Polls the server and renders the UI
test/                    Unit tests
```

## How it works

### Simulator

Each message follows the spec (`msg_type`, `system`, `msg_id`, `detections`, `timestamp`). Per tick:

1. Every drone from the previous message has an 80% chance of appearing again; the rest are gone for good.
2. Surviving drones keep their `drone_id`, `start_time`, `band`, and `classification`. Only `rssi` changes, as a small random walk kept within -110 to -65.
3. 0 to 2 new drones are added. If fewer than 2 drones survived, at least 1 is guaranteed so the message is never empty.
4. A new drone's `start_time` equals the timestamp of the message it first appears in.

Drone IDs and message IDs are 8 random letters, checked for uniqueness.

### Server

| Endpoint               | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `POST /api/detections` | Receives a detections message from the simulator   |
| `GET /api/current`     | Returns the data the UI needs in one JSON response |

`GET /api/current` returns: message count, active drones, active count, top band counts, top classification counts, and the RSSI histogram (bin labels and counts).

### UI

- **Active detections table** with drone ID, start time, band, classification, RSSI, and a duration that updates every second.
- **RSSI histogram** of all readings from the last 5 minutes across all drones (5 dB bins).
- **Top bands and classifications**, counting each distinct `drone_id` once.
- **Message counter** for total messages received.

## Tests

```bash
npm test
```
