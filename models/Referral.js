const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    teamsReferred: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", ReferralSchema);
