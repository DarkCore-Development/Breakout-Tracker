const mongoose = require('mongoose');

// User Schema (Atualizado com Setup, Red Items e Perfil)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  
  // Customização de Perfil e Identidade
  username: { type: String, default: 'Operator_Recruit' },
  avatarUrl: { type: String, default: 'https://i.imgur.com/6EH996s.png' },
  twitchChannel: { type: String, default: '' },
  
  // Configurações de Entrada do Jogo
  gameSettings: {
    sensitivity: { type: String, default: '' },
    dpi: { type: Number, default: 800 }
  },
  
  // Ambiente de Hardware & Sistema Otimizado
  hardwareSpecs: {
    cpu: { type: String, default: 'Ryzen 5 5500' },
    gpu: { type: String, default: 'RTX 3060' },
    ram: { type: String, default: '16GB 3200MHz' },
    os: { type: String, default: 'ZenithOS' }
  },
  
  // Inventário de Itens Vermelhos do Cofre (Portfolio)
  redItems: {
    gold_lion: { type: Number, default: 0 },
    km903_jet: { type: Number, default: 0 },
    secret_document: { type: Number, default: 0 },
    utopia: { type: Number, default: 0 },
    replica_mask: { type: Number, default: 0 },
    alvorada_frame: { type: Number, default: 0 },
    capsule_tv: { type: Number, default: 0 },
    music_box: { type: Number, default: 0 },
    aerospace_navigator: { type: Number, default: 0 },
    majestic_sculpture: { type: Number, default: 0 },
    cls_satellite: { type: Number, default: 0 },
    faeton: { type: Number, default: 0 },
    eeg: { type: Number, default: 0 },
    prototype: { type: Number, default: 0 },
    matriz_verdad: { type: Number, default: 0 },
    chaotic_matter: { type: Number, default: 0 },
    target_module: { type: Number, default: 0 },
    gem_necklace: { type: Number, default: 0 },
    gold_snake: { type: Number, default: 0 },
    antique_teapot: { type: Number, default: 0 },
    clay_destiny: { type: Number, default: 0 },
    three_axis_gyro: { type: Number, default: 0 },
    amber_heart: { type: Number, default: 0 },
    quantum_2000: { type: Number, default: 0 },
    kamona_star: { type: Number, default: 0 },
    t008: { type: Number, default: 0 },
    vase: { type: Number, default: 0 },
    optoelectronic: { type: Number, default: 0 },
    peacock_fan: { type: Number, default: 0 },
    civ_voice: { type: Number, default: 0 },
    lyre: { type: Number, default: 0 },
    hefra_egg: { type: Number, default: 0 },
    thermal_module: { type: Number, default: 0 },
    champ_trophy: { type: Number, default: 0 },
    wave_steed: { type: Number, default: 0 },
    dz_penguin: { type: Number, default: 0 },
    golden_helmet: { type: Number, default: 0 },
    caliburn_model: { type: Number, default: 0 },
    luxury_chess: { type: Number, default: 0 },
    spark_steed: { type: Number, default: 0 },
    gold_com_board: { type: Number, default: 0 },
    anniv_gold_box: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Raid Entry Schema (Permanece consistente com o histórico)
const RaidSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mapName: { type: String, required: true }, 
  gameMode: { type: String, required: true }, 
  status: { type: String, enum: ['Survived', 'KIA'], required: true },
  loadoutValue: { type: Number, required: true },
  extractedValue: { type: Number, default: 0 },
  redItemsCount: { type: Number, default: 0 },
  netProfit: { type: Number, required: true } 
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Raid = mongoose.model('Raid', RaidSchema);

module.exports = { User, Raid };
