require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Referral = require("./models/Referral");
const Team = require("./models/Team");

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
  })
);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Simple shared-secret admin check — pass the key as header x-admin-key or ?key=
function requireAdmin(req, res, next) {
  const key = req.header("x-admin-key") || req.query.key;
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: "ADMIN_KEY is not configured on the server." });
  }
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid or missing admin key." });
  }
  next();
}

// Generate a short, human-friendly referral code, e.g. AR7X2K
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function generateUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await Referral.findOne({ code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique referral code, try again.");
}

// --- Create a referral code for a current student ---
app.post("/api/referral", async (req, res) => {
  try {
    const { studentName, department, year } = req.body;
    if (!studentName || !department || !year) {
      return res.status(400).json({ error: "studentName, department and year are required." });
    }
    const code = await generateUniqueCode();
    const referral = await Referral.create({ studentName, department, year, code });
    res.status(201).json({ code: referral.code, studentName: referral.studentName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Register a team, optionally crediting a referral code ---
app.post("/api/register", async (req, res) => {
  try {
    const {
      teamName,
      collegeName,
      category,
      problemStatement,
      idea,
      members, // array of {name, semester, phone, email}, members[0] = leader
      screenshotUrl,
      referralCode,
    } = req.body;

    if (!teamName || !collegeName || !category || !problemStatement || !idea) {
      return res.status(400).json({ error: "Missing required team fields." });
    }
    if (!screenshotUrl || !screenshotUrl.trim()) {
      return res.status(400).json({ error: "Payment screenshot is required." });
    }
    if (!Array.isArray(members) || members.length < 3 || members.length > 4) {
      return res.status(400).json({ error: "A team needs 3 to 4 members (including the leader)." });
    }
    for (const m of members) {
      if (!m.name || !m.semester) {
        return res.status(400).json({ error: "Every member needs a name and semester." });
      }
    }

    let referral = null;
    if (referralCode && referralCode.trim()) {
      referral = await Referral.findOne({ code: referralCode.trim().toUpperCase() });
      if (!referral) {
        return res.status(400).json({ error: "That referral code was not found." });
      }
    }

    const team = await Team.create({
      teamName,
      collegeName,
      category,
      problemStatement,
      idea,
      members,
      screenshotUrl,
      referralCode: referral ? referral.code : null,
      referredBy: referral ? referral._id : null,
    });

    if (referral) {
      referral.teamsReferred += 1;
      await referral.save();
    }

    res.status(201).json({ teamId: team._id, teamName: team.teamName });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// --- Leaderboard: top referrers by number of teams referred ---
app.get("/api/leaderboard", async (req, res) => {
  try {
    const top = await Referral.find({ teamsReferred: { $gt: 0 } })
      .sort({ teamsReferred: -1, createdAt: 1 })
      .limit(50)
      .select("studentName department year code teamsReferred");
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin: list all registered teams, newest first ---
app.get("/api/teams", requireAdmin, async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 }).populate("referredBy", "studentName code");
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
