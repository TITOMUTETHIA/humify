import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

const shortCode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const callbackURL = process.env.MPESA_CALLBACK_URL;

// Generate Access Token
const getToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
};

// STK Push
app.post("/mpesa/stk", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const token = await getToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: "HumanLine",
      TransactionDesc: "Chat Access Payment"
    };

    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.ResponseCode === "0") {
      return res.json({ success: true, message: "STK Push sent" });
    } else {
      return res.json({ success: false, message: data.ResponseDescription });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, message: "STK Push failed" });
  }
});

// Path to the users.json file
const usersFilePath = path.join(__dirname, 'users.json');

// Get all users
app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read users file' });
        }
        const users = JSON.parse(data);
        res.json(users);
    });
});

// Add a new user
app.post('/users', (req, res) => {
    const newUser = req.body;

    // Validate the new user
    if (!newUser.username || !newUser.password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Read the existing users
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read users file' });
        }

        const users = JSON.parse(data);

        // Check if the username already exists
        if (users.some(user => user.username === newUser.username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Add the new user
        users.push(newUser);

        // Save the updated users list
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 4), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save user' });
            }
            res.status(201).json({ message: 'User added successfully' });
        });
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
