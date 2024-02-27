const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

const secretKey = process.env.MY_SECRET_KEY;
const mongoUri =
  "mongodb+srv://mayureshngorantiwar:4pH5dvC4d7XRUe8O@cluster0.sdnavtq.mongodb.net/user_jwt";

app.use(express.json());

app.get("/login", async (req, res) => {
  const username = req.query.username;
  const password = req.query.password;
  
  try {
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();

    const user = await db.collection("user_data").findOne({ username });

    if (!user || user.password !== password) {
      res.status(401).send("Invalid credentials");
      return;
    }

    const token = jwt.sign({ username }, secretKey, { expiresIn: "1hr" });

    await db
      .collection("user_data")
      .updateOne({ username }, { $set: { token } });

    res.send(token);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/verify", (req, res) => {
  const token = req.query.token;

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      res.status(401).send("Invalid token");
    } else {
      console.log("Decoded JWT:", decoded);
      res.send(`Decoded JWT: ${JSON.stringify(decoded)}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
