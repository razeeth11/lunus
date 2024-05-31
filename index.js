import bcrypt from "bcryptjs";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();
const PORT = 4002;
const MONGO_URL = process.env.MONGO_URL;
const secretKey = process.env.SECRET_KEY;

export const client = new MongoClient(MONGO_URL);
client.connect();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("hello world");
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const getUserEmail = async (email) => {
    const user = await client
      .db("lunu1")
      .collection("usersDetails")
      .findOne({ email: email });
    return user;
  };

  const userEmail = await getUserEmail(email);

  async function createCollectionByUserID(userID, username, email) {
    await client.db("lunu1").collection(`${userID}`).insertOne({
      username: username,
      email: email,
      userID: userID,
    });
  }

  async function signupUser(username, email, hashedPassword, userID) {
    await client.db("lunu1").collection("usersDetails").insertOne({
      username: username,
      email: email,
      password: hashedPassword,
      userID: userID,
      permissions: 21,
    });
  }

  if (userEmail) {
    res.send({ status: 0, message: "User already exists" }).status(400);
  } else {
    const userID = `${username.toUpperCase()}${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    await signupUser(username, email, hashedPassword, userID);
    await createCollectionByUserID(userID, username, email);
    res
      .send({ status: 1, message: "Successfully signed up", userID: userID })
      .status(200);
  }
});

app.listen(PORT, () => console.log(`The port is running on ${PORT}`));
