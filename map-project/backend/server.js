const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const points = [
  { id: 1, name: "Point A", lat: 40.7128, lng: -74.0060 },
  { id: 2, name: "Point B", lat: 34.0522, lng: -118.2437 }
];

app.get("/api/points", (req, res) => {
  res.json(points);
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
