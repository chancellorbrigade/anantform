const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false }
);

const TeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true },
    collegeName: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["Hardware", "Software"] },
    problemStatement: { type: String, required: true, trim: true },
    idea: { type: String, required: true, trim: true },
    // leader is members[0]; total members.length must be 3-4
    members: {
      type: [MemberSchema],
      validate: {
        validator: (arr) => arr.length >= 3 && arr.length <= 4,
        message: "A team needs 3 to 4 members (including the leader).",
      },
    },
    screenshotUrl: { type: String, required: true, trim: true },
    referralCode: { type: String, uppercase: true, trim: true, default: null },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Referral", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
