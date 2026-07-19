const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true });

// Raid Entry Schema
const RaidSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mapName: { type: String, required: true }, // e.g., Airport, Armory, Farm
  gameMode: { type: String, required: true }, // e.g., Normal, Lockdown, Forbidden
  status: { type: String, enum: ['Survived', 'KIA'], required: true },
  loadoutValue: { type: Number, required: true },
  extractedValue: { type: Number, default: 0 },
  redItemsCount: { type: Number, default: 0 },
  netProfit: { type: Number, required: true } // Automatically calculated (Extracted - Loadout)
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Raid = mongoose.model('Raid', RaidSchema);

module.exports = { User, Raid };