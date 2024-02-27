const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

// Load the secret key for JWT from environment variables
const secretKey = process.env.MY_SECRET_KEY;

// MongoDB connection string
const mongoUri =
  "mongodb+srv://mayureshngorantiwar:4pH5dvC4d7XRUe8O@cluster0.sdnavtq.mongodb.net/user_jwt";

// Middleware to parse JSON in the request body
app.use(express.json());

// Endpoint for user login
app.get("/login", async (req, res) => {
  // Extract username and password from the query parameters
  const username = req.query.username;
  const password = req.query.password;

  try {
    // Connect to MongoDB
    const { db, client } = await connectToMongoDB();

    // Find the user in the user_data collection
    const user = await db.collection("user_data").findOne({ username });

    // Check if user exists and if the provided password is correct
    if (!user || user.password !== password) {
      res.status(401).send("Invalid credentials");
      return;
    }

    // Generate a JWT token with the username
    const token = jwt.sign({ username }, secretKey, { expiresIn: "1hr" });

    // Update the user_data document with the new token
    await db
      .collection("user_data")
      .updateOne({ username }, { $set: { token } });

    // Send the token as a response
    res.send(token);
  } catch (error) {
    // Handle errors during MongoDB connection or data retrieval
    console.error("Error connecting to MongoDB:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint for verifying a JWT token
app.get("/verify", async (req, res) => {
  // Extract the token from the query parameters
  const token = req.query.token;

  try {
    // Connect to MongoDB
    const { db } = await connectToMongoDB();
    const userCollection = db.collection("user_data");

    // Find the user by the provided token
    const user = await userCollection.findOne({ token });

    // Check if a user with the token exists
    if (!user) {
      res.status(401).send("Invalid token");
      return;
    }

    // Verify the JWT token
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", err.message);
        res.status(401).send("Invalid token");
      } else {
        // If token is valid, log the decoded information and send it as a response
        console.log("Decoded JWT:", decoded);
        res.send(`Decoded JWT: ${JSON.stringify(decoded)}`);
      }
    });
  } catch (error) {
    // Handle errors during MongoDB connection or data retrieval
    console.error("Error connecting to MongoDB:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Utility function to connect to MongoDB
async function connectToMongoDB() {
  const client = await MongoClient.connect(mongoUri);
  return { db: client.db(), client };
}
