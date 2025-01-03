const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("foodie-react/dist"));

const port = process.env.PORT || 8080;

app.get("/api/restaurant/:id", (req, res) => {
  res.send({
    id: 1,
    name: "Campomar",
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
