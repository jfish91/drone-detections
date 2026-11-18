import express from "express";
import {createDetectionState} from './detection-state.js' 

const app = express();
const PORT = process.env.PORT || 3000

const detections = createDetectionState()

app.use(express.json());

app.get("/api/current", (req, res) => {
    const currentState = detections.currentState();
    res.json(currentState);
})

app.post("/api/detections", (req, res) => {
    const data = req.body;
    // console.log(data);

    detections.handleMessage(data);

    res.status(201).json({
        message: 'data recieved',
        recieved: data
    });

    
})


app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});