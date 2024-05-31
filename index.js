import bcrypt from "bcryptjs";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();
const PORT = 4002;
const MONGO_URL = "mongodb+srv://lunu:lunu1234@cluster0.mxmqnga.mongodb.net/";
const secretKey = process.env.SECRET_KEY;
let client;

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // Exit the process if DB connection fails
  }
}

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const getUserEmail = async (email) => {
    return await client
      .db("lunu1")
      .collection("usersDetails")
      .findOne({ email: email });
  };

  const userEmail = await getUserEmail(email);

  const createCollectionByUserID = async (userID, username, email) => {
    await client.db("lunu1").collection(userID).insertOne({
      username: username,
      email: email,
      userID: userID,
    });
  };

  const signupUser = async (username, email, hashedPassword, userID) => {
    await client.db("lunu1").collection("usersDetails").insertOne({
      username: username,
      email: email,
      password: hashedPassword,
      userID: userID,
      permissions: 21,
    });
  };

  if (userEmail) {
    res.status(400).send({ status: 0, message: "User already exists" });
  } else {
    const userID = `${username.toUpperCase()}${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      await signupUser(username, email, hashedPassword, userID);
      await createCollectionByUserID(userID, username, email);
      res.status(200).send({ status: 1, message: "Successfully signed up", userID: userID });
    } catch (err) {
      console.error("Signup Error: ", err);
      res.status(500).send({ status: 0, message: "Internal Server Error" });
    }
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const getUserEmail = ()=>{
       async (email) => {
        const user = await client
          .db("lunu1")
          .collection("usersDetails")
          .findOne({ email });
        return user;
      };
    }
    const userEmail = await getUserEmail(email);

    if (!userEmail) {
      return res.status(400).send({ status: 0, message: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, userEmail.password);
    if (!isPasswordValid) {
      return res.status(400).send({ status: 0, message: "Invalid Credentials" });
    }

    const token = jwt.sign({ userID: userEmail.userID }, secretKey, {
      expiresIn: "1h",
    });
    res.status(200).send({
      status: 1,
      message: "Successfully logged in",
      userID: userEmail.userID,
      token,
    });
  } catch (error) {
    res.status(500).send({ status: 0, message: "Internal server error" });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize the server: ", err);
  process.exit(1);
});
