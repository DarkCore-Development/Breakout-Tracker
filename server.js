const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const nodemailer = require('nodemailer'); 
require('dotenv').config();

const app = express();

// Aumenta o limite do body-parser para aceitar uploads em Base64 sem estourar o limite do Express
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Permite conexões de qualquer origem
app.use(cors()); 

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERRO CRÍTICO: A variável de ambiente MONGO_URI não foi definida!");
  process.exit(1); 
}

// EVITE fallback hardcoded em produção para chaves secretas
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("⚠️ AVISO: JWT_SECRET não definida. Usando chave de fallback para desenvolvimento.");
}
const SEGREDO_JWT = JWT_SECRET || 'darkcore_secret_key_siege_123';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.EMAIL_PORT) || 2525,
  auth: {
    user: process.env.EMAIL_USER || "your_user",
    pass: process.env.EMAIL_PASS || "your_password"
  }
});

// ==========================================
// 1. MODELAGEM DE DADOS (SCHEMAS)
// ==========================================

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  isVerified: { type: Boolean, default: false },
  
  username: { type: String, default: 'Operator_Recruit' },
  avatarUrl: { type: String, default: 'https://i.imgur.com/6EH996s.png' }, 

  gameSettings: {
    sensitivity: { type: String, default: 'Standard' },
    dpi: { type: Number, default: 800 },
    resolution: { type: String, default: '1920x1080' },
    graphics: { type: String, default: 'Smooth (High FPS)' }
  },
  hardwareSpecs: {
    cpu: { type: String, default: '' },
    gpu: { type: String, default: '' },
    ram: { type: String, default: '' },
    os: { type: String, default: 'ZenithOS' } 
  },
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

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', UserSchema);

const RaidSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mapName: { type: String, enum: ['Airport', 'Armory', 'Farm', 'Northridge', 'TV Station', 'Valley'], required: true },
  gameMode: { type: String, enum: ['Normal', 'Lockdown (150k)', 'Forbidden (300k)', 'PVE'], required: true },
  status: { type: String, enum: ['Survived', 'KIA'], required: true },
  loadoutValue: { type: Number, default: 0 },   
  extractedValue: { type: Number, default: 0 }, 
  netProfit: { type: Number },                  
  redItemsCount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
});

RaidSchema.pre('save', function(next) {
  if (this.status === 'Survived') {
    this.netProfit = this.extractedValue - this.loadoutValue;
  } else {
    this.netProfit = -this.loadoutValue;
    this.extractedValue = 0; 
  }
  next();
});

const Raid = mongoose.model('Raid', RaidSchema);

// ==========================================
// 2. MIDDLEWARE DE AUTENTICAÇÃO (JWT)
// ==========================================
const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. Token missing.' });

  jwt.verify(token, SEGREDO_JWT, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.userId = decoded.id;
    next();
  });
};

// ==========================================
// 3. ROTAS DE AUTENTICAÇÃO & PERFIL
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Please fill in all mandatory fields.' });
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'This email address is already registered.' });

    const newUser = await User.create({ email, password, username: username || 'Operator_Recruit' });
    
    const userResponse = newUser.toObject();
    delete userResponse.password;

    const mailOptions = {
      from: '"Breakout Tracker" <no-reply@breakouttracker.com>',
      to: email,
      subject: '🎯 Welcome to Breakout Tracker!',
      html: `<div style="font-family: sans-serif; background-color: #0d0e12; color: #e2e8f0; padding: 20px; border-radius: 8px; max-width: 600px;">
          <h2>Account Created Successfully, Recruit!</h2>
          <p>Your statistical combat dashboard is fully unlocked and ready to log tactical deployments.</p>
        </div>`
    };

    // Dispara o e-mail em background sem travar a resposta para o usuário
    transporter.sendMail(mailOptions, (mailErr) => {
      if (mailErr) console.error("Email delivery failed:", mailErr.message);
    });
    
    return res.status(201).json({ message: 'User registered successfully!', user: userResponse });
  } catch (error) {
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Please fill in all mandatory fields.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid authentication credentials.' });
    }
    
    const token = jwt.sign({ id: user._id }, SEGREDO_JWT, { expiresIn: '1d' });
    return res.json({ message: 'Authentication successful!', token });
  } catch (error) {
    return res.status(500).json({ error: `Internal server error during login: ${error.message}` });
  }
});

app.get('/api/user/profile', autenticarToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile settings.' });
  }
});

app.put('/api/user/profile', autenticarToken, async (req, res) => {
  try {
    const { username, avatarUrl, gameSettings, hardwareSpecs, redItems } = req.body;
    
    const updateFields = {};
    if (username !== undefined) updateFields.username = username;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

    if (gameSettings) {
      for (const [key, value] of Object.entries(gameSettings)) {
        updateFields[`gameSettings.${key}`] = value;
      }
    }
    if (hardwareSpecs) {
      for (const [key, value] of Object.entries(hardwareSpecs)) {
        updateFields[`hardwareSpecs.${key}`] = value;
      }
    }
    if (redItems) {
      for (const [key, value] of Object.entries(redItems)) {
        updateFields[`redItems.${key}`] = value;
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return res.json({ message: 'Dashboard config synchronized!', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: `Failed to update operator profile: ${error.message}` });
  }
});

// ==========================================
// 4. ROTAS DE GERENCIAMENTO DE RAIDS
// ==========================================

app.post('/api/raids', autenticarToken, async (req, res) => {
  try {
    const { mapName, gameMode, status, loadoutValue, extractedValue, redItemsCount } = req.body;
    const novaRaid = await Raid.create({
      userId: req.userId, mapName, gameMode, status, loadoutValue, extractedValue, redItemsCount
    });
    return res.status(201).json({ message: 'Raid synchronized successfully!', raid: novaRaid });
  } catch (error) {
    return res.status(500).json({ error: `Failed to save combat report: ${error.message}` });
  }
});

app.get('/api/raids', autenticarToken, async (req, res) => {
  try {
    const listaRaids = await Raid.find({ userId: req.userId }).sort({ date: -1 }).limit(10);
    return res.json(listaRaids);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch raid activity logs.' });
  }
});

app.delete('/api/raids/:id', autenticarToken, async (req, res) => {
  try {
    const raidDeletada = await Raid.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!raidDeletada) return res.status(404).json({ error: 'Raid entry log not found.' });
    return res.json({ message: 'Raid entry deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal error deleting deployment log.' });
  }
});

app.get('/api/stats', autenticarToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    let totalFixoReds = 0;
    
    if (user && user.redItems) {
      const redItemsObj = user.redItems.toObject ? user.redItems.toObject() : user.redItems;
      for (const value of Object.values(redItemsObj)) {
        if (typeof value === 'number') {
          totalFixoReds += value;
        }
      }
    }

    // Correção essencial: usando instanciamento correto do ObjectId
    const stats = await Raid.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: {
          _id: null,
          totalRaids: { $sum: 1 },
          patrimonioLiquidoGeral: { $sum: "$netProfit" },
          totalExtraidoValue: { $sum: "$extractedValue" }
        }
      }
    ]);

    const resultadoFinal = stats[0] || { totalRaids: 0, patrimonioLiquidoGeral: 0, totalExtraidoValue: 0 };
    return res.json({
      totalRaids: resultadoFinal.totalRaids,
      totalVermelhos: totalFixoReds, 
      patrimonioLiquidoGeral: resultadoFinal.patrimonioLiquidoGeral,
      totalExtraidoValue: resultadoFinal.totalExtraidoValue
    });
  } catch (error) {
    return res.status(500).json({ error: `Failed to process tactical performance metrics: ${error.message}` });
  }
});

// Middleware Global de Erros
app.use((err, req, res, next) => {
  console.error("Global Error Catcher:", err.stack);
  res.status(500).json({ error: `Internal server error: ${err.message}` });
});

// Conecta ao Banco de Dados e então inicializa o servidor Express
const PORT = process.env.PORT || 5000;
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('🚀 Database successfully connected to Cloud Cluster!');
    app.listen(PORT, () => console.log(`🔥 Server smoothly executing on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1); // Encerra o processo caso falhe ao iniciar a conexão primária
  });

module.exports = app;
