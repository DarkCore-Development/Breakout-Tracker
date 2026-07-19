const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true });

// Raid Entry Schema
const RaidSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mapName: { type: String, required: true }, // e.g., Airport, Armory, Farm
  gameMode: { type: String, required: true }, // e.g., Normal, Lockdown, Forbidden
  status: { type: String, enum: ['Survived', 'KIA'], required: true },
  loadoutValue: { type: Number, required: true, min: 0 },
  extractedValue: { type: Number, default: 0, min: 0 },
  redItemsCount: { type: Number, default: 0, min: 0 },
  netProfit: { type: Number, default: 0 } // Calculado automaticamente via middleware abaixo
}, { timestamps: true });

// Middleware para calcular o Lucro Líquido automaticamente antes de salvar
RaidSchema.pre('save', function(next) {
  if (this.status === 'KIA') {
    this.extractedValue = 0;
    this.redItemsCount = 0;
    this.netProfit = -this.loadoutValue; // Se morreu, o prejuízo é o valor do loadout completo
  } else {
    this.netProfit = this.extractedValue - this.loadoutValue;
  }
  next();
});

const User = mongoose.model('User', UserSchema);
const Raid = mongoose.model('Raid', RaidSchema);

module.exports = { User, Raid };
