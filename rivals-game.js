// ==================== MLB 勁旅對決 (MLB RIVALS 3D SHOWDOWN) 互動棒球引擎 v2.7.0 ====================
// 深度參考官方《MLB 勁旅對決》畫面與操作：
// 1. 洛杉磯道奇球場 (Dodger Stadium) 晴空白天真實 3D 視角：藍天白雲、外野棕櫚樹、雙國旗、經典計分板、多層觀眾席、草地割草紋路
// 2. 正宗 MLB Rivals UI：左上官方記分板 (Scorebug + RIVALS標籤)、左側 Signature 球員卡 (大谷翔平/弗里曼) 與對戰打擊數據條、好球帶 Hot Zones 紅色打擊熱區、底部 PLAY BALL 縫線藥丸徽章
// 3. 擬真 3D 球員模型：道奇主場白球衣、經典藍色 LA 球帽與紅色胸號/背號、左打(LHB)/右打(RHB) 3D 揮棒站姿與全動態揮棒殘影
// 4. v2.7.0 實戰深度升級：
//    - 三大賽制選擇：🔥6局下逆轉劇本 (Clutch)、⚡3局快打賽 (3-Inning)、🏟️9局正規賽 (9-Inning) + 延長賽二壘突破僵局制
//    - 🎊 再見安打 / 再見全壘打 (Walk-Off) 慶祝煙火與賽後戰報 MVP 結算儀表板
//    - 🎥 全壘打慢動作「確信步 (No-Doubt Admire Cam)」特寫鏡頭與四段 3D 視角自由切換
//    - 🔊 主審真人感語音宣判 (STRIKE / BALL / OUT / SAFE / HOME RUN!) ＆ 棒球場管風琴號角音效

const RivalsSFX = {
  ctx: null,
  enabled: true,
  voiceEnabled: true,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById('rivals-sfx-btn');
    if (btn) btn.textContent = this.enabled ? '🔊 音效+主審' : '🔇 靜音';
  },
  speakUmpire(text, pitch = 0.85, rate = 1.08) {
    if (!this.enabled || !this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = 0.85;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  },
  playBatHit(isCrit) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isCrit ? 1320 : 760, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.19);
    gain.gain.setValueAtTime(isCrit ? 0.72 : 0.40, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    if (isCrit) {
      const crack = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      crack.type = 'sawtooth';
      crack.frequency.setValueAtTime(2200, now);
      crack.frequency.exponentialRampToValueAtTime(420, now + 0.08);
      cGain.gain.setValueAtTime(0.32, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      crack.connect(cGain);
      cGain.connect(this.ctx.destination);
      crack.start(now);
      crack.stop(now + 0.095);
    }
  },
  playMittPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.09);
    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  },
  playBounce() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.06);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  },
  playUmpireStrike(isStrikeout = false) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const notes = isStrikeout ? [440, 349.23, 261.63] : [392, 311.13];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.22, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.19);
      });
    }
    this.speakUmpire(isStrikeout ? "Strike three! You're out!" : "Strike!", 0.72, 1.05);
  },
  playUmpireBall(isWalk = false) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const notes = isWalk ? [392, 493.88, 587.33] : [440];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.16, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.15);
      });
    }
    if (isWalk) this.speakUmpire("Ball four! Take your base!", 0.85, 1.05);
  },
  playUmpireCall(isSafe = true) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const notes = isSafe ? [523.25, 659.25] : [330, 220];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.24, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.19);
      });
    }
    this.speakUmpire(isSafe ? "Safe!" : "Out!", 0.78, 1.08);
  },
  playHomeRunHorn(isWalkOff = false) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      // Stadium foghorn + Dodger organ chord progression
      const chord = isWalkOff
        ? [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5]
        : [261.63, 329.63, 392.00, 523.25, 659.25];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.16, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.66);
      });
    }
    this.speakUmpire(isWalkOff ? "It is gone! Walk off Home Run!" : "Big fly! Home Run!", 0.92, 1.02);
  },
  playCheer() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.18, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.39);
    });
  }
};

// ==================== MLB TEAMS & SIGNATURE PLAYERS (9 ICONIC FRANCHISES) ====================
const MLB_TEAMS = {
  LAD: {
    code: 'LAD',
    name: '洛杉磯道奇',
    enName: 'LA Dodgers',
    shortName: 'LAD',
    primary: '#005A9C',
    secondary: '#EF3E42',
    jerseyHome: '#f8fafc',
    capColor: '#005A9C',
    velMod: 4,
    aiSkill: 0.85,
    pitchers: [
      { num: '17', name: '大谷翔平 (S. Ohtani)', short: 'S. Ohtani \'24', hand: 'R', ovr: 128, tier: 'SIGNATURE', veloBonus: 5, pos: 'SP' },
      { num: '18', name: '山本由伸 (Y. Yamamoto)', short: 'Y. Yamamoto \'24', hand: 'R', ovr: 120, tier: 'PRIME', veloBonus: 2, pos: 'SP' }
    ],
    batters: [
      { num: '17', name: '大谷翔平 (S. Ohtani)', short: 'S. Ohtani \'24', hand: 'L', ovr: 128, tier: 'SIGNATURE', pwrBonus: 14, pos: 'DH', avg: '.310', hr: '54', rbi: '130', hitLog: '2打數1安打 1HR' },
      { num: '5',  name: '弗里曼 (F. Freeman)', short: 'F. Freeman \'22', hand: 'L', ovr: 121, tier: 'SIGNATURE', pwrBonus: 10, pos: '1B', avg: '.325', hr: '29', rbi: '102', hitLog: '2打數1安打' },
      { num: '50', name: '貝茲 (M. Betts)', short: 'M. Betts \'23', hand: 'R', ovr: 122, tier: 'PRIME', pwrBonus: 8, pos: 'SS', avg: '.307', hr: '39', rbi: '107', hitLog: '3打數2安打' },
      { num: '37', name: '赫南德茲 (T. Hernández)', short: 'T. Hernández \'24', hand: 'R', ovr: 116, tier: 'IMPACT', pwrBonus: 9, pos: 'RF', avg: '.272', hr: '33', rbi: '99', hitLog: '3打數1安打' }
    ]
  },
  SD: {
    code: 'SD',
    name: '聖地牙哥教士',
    enName: 'SD Padres',
    shortName: 'SD',
    primary: '#2F241D',
    secondary: '#FFC425',
    jerseyHome: '#fef3c7',
    capColor: '#451a03',
    velMod: -2,
    aiSkill: 0.68,
    pitchers: [
      { num: '11', name: '達比修有 (Y. Darvish)', short: 'Y. Darvish \'22', hand: 'R', ovr: 119, tier: 'PRIME', veloBonus: 0, pos: 'SP' }
    ],
    batters: [
      { num: '23', name: '塔提斯 (F. Tatis Jr.)', short: 'F. Tatis \'21', hand: 'R', ovr: 122, tier: 'SIGNATURE', pwrBonus: 9, pos: 'RF', avg: '.282', hr: '42', rbi: '97', hitLog: '2打數1安打' },
      { num: '13', name: '馬查多 (M. Machado)', short: 'M. Machado \'22', hand: 'R', ovr: 119, tier: 'PRIME', pwrBonus: 7, pos: '3B', avg: '.298', hr: '32', rbi: '102', hitLog: '3打數1安打' }
    ]
  },
  NYY: {
    code: 'NYY',
    name: '紐約洋基',
    enName: 'NY Yankees',
    shortName: 'NYY',
    primary: '#132448',
    secondary: '#C4CED3',
    jerseyHome: '#f1f5f9',
    capColor: '#0f172a',
    velMod: 2,
    aiSkill: 0.78,
    pitchers: [
      { num: '45', name: '柯爾 (G. Cole)', short: 'G. Cole \'23', hand: 'R', ovr: 122, tier: 'PRIME', veloBonus: 3, pos: 'SP' }
    ],
    batters: [
      { num: '99', name: '賈吉 (A. Judge)', short: 'A. Judge \'24', hand: 'R', ovr: 127, tier: 'SIGNATURE', pwrBonus: 14, pos: 'CF', avg: '.322', hr: '58', rbi: '144', hitLog: '3打數2安打 1HR' },
      { num: '22', name: '索托 (J. Soto)', short: 'J. Soto \'24', hand: 'L', ovr: 124, tier: 'PRIME', pwrBonus: 9, pos: 'RF', avg: '.288', hr: '41', rbi: '109', hitLog: '2打數1安打' }
    ]
  },
  ATL: {
    code: 'ATL',
    name: '亞特蘭大勇士',
    enName: 'Atlanta Braves',
    shortName: 'ATL',
    primary: '#13274F',
    secondary: '#CE1141',
    jerseyHome: '#f8fafc',
    capColor: '#13274F',
    velMod: 1,
    aiSkill: 0.72,
    pitchers: [{ num: '51', name: '塞爾 (C. Sale)', short: 'C. Sale \'24', hand: 'L', ovr: 123, tier: 'SIGNATURE', veloBonus: 2, pos: 'SP' }],
    batters: [{ num: '13', name: '阿庫尼亞 (R. Acuña Jr.)', short: 'R. Acuña \'23', hand: 'R', ovr: 125, tier: 'SIGNATURE', pwrBonus: 10, pos: 'RF', avg: '.337', hr: '41', rbi: '106', hitLog: '3打數2安打' }]
  },
  PHI: {
    code: 'PHI',
    name: '費城費城人',
    enName: 'Phila Phillies',
    shortName: 'PHI',
    primary: '#E81828',
    secondary: '#002D72',
    jerseyHome: '#fff1f2',
    capColor: '#E81828',
    velMod: 3,
    aiSkill: 0.78,
    pitchers: [{ num: '45', name: '惠勒 (Z. Wheeler)', short: 'Z. Wheeler \'24', hand: 'R', ovr: 122, tier: 'PRIME', veloBonus: 3, pos: 'SP' }],
    batters: [{ num: '3',  name: '哈波 (B. Harper)', short: 'B. Harper \'21', hand: 'L', ovr: 124, tier: 'SIGNATURE', pwrBonus: 10, pos: '1B', avg: '.309', hr: '35', rbi: '87', hitLog: '2打數1安打' }]
  },
  HOU: {
    code: 'HOU',
    name: '休士頓太空人',
    enName: 'Houston Astros',
    shortName: 'HOU',
    primary: '#002D62',
    secondary: '#EB6E1F',
    jerseyHome: '#f8fafc',
    capColor: '#002D62',
    velMod: 4,
    aiSkill: 0.82,
    pitchers: [{ num: '59', name: '瓦德茲 (F. Valdez)', short: 'F. Valdez \'22', hand: 'L', ovr: 119, tier: 'PRIME', veloBonus: 2, pos: 'SP' }],
    batters: [{ num: '44', name: '阿瓦瑞茲 (Y. Alvarez)', short: 'Y. Alvarez \'22', hand: 'L', ovr: 125, tier: 'SIGNATURE', pwrBonus: 12, pos: 'DH', avg: '.306', hr: '37', rbi: '97', hitLog: '3打數2安打' }]
  },
  BAL: {
    code: 'BAL',
    name: '巴爾的摩金鶯',
    enName: 'Baltimore Orioles',
    shortName: 'BAL',
    primary: '#DF4601',
    secondary: '#000000',
    jerseyHome: '#fff7ed',
    capColor: '#DF4601',
    velMod: 2,
    aiSkill: 0.76,
    pitchers: [{ num: '39', name: '柏恩斯 (C. Burnes)', short: 'C. Burnes \'24', hand: 'R', ovr: 121, tier: 'PRIME', veloBonus: 3, pos: 'SP' }],
    batters: [
      { num: '2', name: '韓德森 (G. Henderson)', short: 'G. Henderson \'24', hand: 'L', ovr: 124, tier: 'SIGNATURE', pwrBonus: 11, pos: 'SS', avg: '.281', hr: '37', rbi: '92', hitLog: '3打數2安打' },
      { num: '35', name: '拉奇曼 (A. Rutschman)', short: 'A. Rutschman \'23', hand: 'L', ovr: 118, tier: 'PRIME', pwrBonus: 8, pos: 'C', avg: '.277', hr: '20', rbi: '80', hitLog: '2打數1安打' }
    ]
  },
  BOS: {
    code: 'BOS',
    name: '波士頓紅襪',
    enName: 'Boston Red Sox',
    shortName: 'BOS',
    primary: '#BD3039',
    secondary: '#0C2340',
    jerseyHome: '#f8fafc',
    capColor: '#0C2340',
    velMod: 1,
    aiSkill: 0.74,
    pitchers: [{ num: '66', name: '貝洛 (B. Bello)', short: 'B. Bello \'24', hand: 'R', ovr: 117, tier: 'IMPACT', veloBonus: 2, pos: 'SP' }],
    batters: [
      { num: '11', name: '迪佛斯 (R. Devers)', short: 'R. Devers \'23', hand: 'L', ovr: 123, tier: 'SIGNATURE', pwrBonus: 12, pos: '3B', avg: '.272', hr: '33', rbi: '100', hitLog: '3打數2安打 1HR' },
      { num: '16', name: '杜蘭 (J. Duran)', short: 'J. Duran \'24', hand: 'L', ovr: 120, tier: 'PRIME', pwrBonus: 9, pos: 'CF', avg: '.285', hr: '21', rbi: '75', hitLog: '3打數1安打' }
    ]
  },
  CHC: {
    code: 'CHC',
    name: '芝加哥小熊',
    enName: 'Chicago Cubs',
    shortName: 'CHC',
    primary: '#0E3386',
    secondary: '#CC3433',
    jerseyHome: '#f8fafc',
    capColor: '#0E3386',
    velMod: 1,
    aiSkill: 0.75,
    pitchers: [{ num: '18', name: '今永昇太 (S. Imanaga)', short: 'S. Imanaga \'24', hand: 'L', ovr: 122, tier: 'SIGNATURE', veloBonus: 2, pos: 'SP' }],
    batters: [
      { num: '27', name: '鈴木誠也 (S. Suzuki)', short: 'S. Suzuki \'24', hand: 'R', ovr: 121, tier: 'SIGNATURE', pwrBonus: 10, pos: 'RF', avg: '.283', hr: '21', rbi: '73', hitLog: '2打數1安打' },
      { num: '8',  name: '哈普 (I. Happ)', short: 'I. Happ \'24', hand: 'L', ovr: 118, tier: 'PRIME', pwrBonus: 9, pos: 'LF', avg: '.248', hr: '25', rbi: '86', hitLog: '3打數1安打' }
    ]
  }
};

// Signature Pitch Repertoire
const RIVALS_PITCHES = {
  '4seam': {
    name: '🔥 四縫線火球',
    short: '4-SEAM',
    mlbSpeed: 162, // 101 mph
    simSpeed: 93,
    color: '#ef4444',
    breakX: 0.0,
    breakZ: 0.15,
    desc: '大谷翔平招牌 101 mph 剛猛火球，強烈正後旋進壘上浮！'
  },
  'sweeper': {
    name: '🌪️ 橫掃滑球 Sweeper',
    short: 'SWEEPER',
    mlbSpeed: 138, // 86 mph
    simSpeed: 81,
    color: '#38bdf8',
    breakX: 0.35,
    breakZ: -0.09,
    desc: '大谷翔平最具威力的王牌變化球！超大橫向位移橫掃好球帶外角！'
  },
  'splitter': {
    name: '🔱 高速指叉 Splitter',
    short: 'SPLIT',
    mlbSpeed: 145, // 90 mph
    simSpeed: 84,
    color: '#10b981',
    breakX: -0.08,
    breakZ: -0.29,
    desc: '進本壘板前瞬間急墜，製造大量揮棒落空三振！'
  },
  '2seam': {
    name: '⚡ 二縫伸卡 Sinker',
    short: 'SINKER',
    mlbSpeed: 156, // 97 mph
    simSpeed: 89,
    color: '#f59e0b',
    breakX: -0.24,
    breakZ: -0.14,
    desc: '高速往右打者內角下沉，引誘滾地球雙殺！'
  },
  'curve': {
    name: '🌈 動力曲球 Curve',
    short: 'CURVE',
    mlbSpeed: 127, // 79 mph
    simSpeed: 73,
    color: '#a855f7',
    breakX: 0.18,
    breakZ: -0.37,
    desc: '2500+ RPM 大弧度彩虹軌跡縱向下墜！'
  }
};

const RG = {
  userTeamCode: 'LAD',
  oppTeamCode: 'SD', // Matches the user reference image (SD vs LAD)!
  roleMode: 'twoway', // 'twoway', 'batter', 'pitcher'
  userRole: 'batter',
  lockOhtani: true,
  userBatterIdx: 0,
  userPitcherIdx: 0,
  cpuBatterIdx: 0,

  // Match Format & Game Over State (v2.7.0)
  matchFormat: 'clutch', // 'clutch' (6局下逆轉劇本), '3inn' (3局快打賽), '9inn' (9局正規賽)
  maxInnings: 6,
  isGameOver: false,
  isWalkOff: false,
  duelCamAngle: 'broadcast', // 'broadcast' | 'batter_pov' | 'pitcher_pov' | 'skycam'

  // Live Box Score & Match Telemetry
  matchStats: {
    userHits: 4,
    cpuHits: 6,
    userHR: 1,
    cpuHR: 1,
    userSO: 5,
    cpuSO: 3,
    maxExitVelo: 184,
    maxHrDistFt: 418,
    lastScoringPlay: '6局下關鍵追分時刻！'
  },

  // Simplified Assist & Automation Settings
  autoAimAssist: true,    // Bat sweet spot smoothly locks onto incoming pitch!
  autoFielding: true,     // Authentic MLB Rivals auto-fielding & auto-baserunning!
  pitchSpeedPreset: 'slow', // 'slow' (輕鬆慢速 1.8秒反應), 'normal' (標準 1.4秒), 'pro' (實戰 1.0秒)
  pitchSpeedMult: 0.52,   // Slows down pitch flight & windup so kids/players have plenty of time!
  autoBatter: false,      // AUTO 打者 ON / OFF
  autoPitcher: false,     // AUTO 投手 ON / OFF
  autoNextTimer: null,

  swingPowerMode: 'power',
  clutchEnergy: 60,
  isClutchActive: false,

  inning: 6,
  isTop: false, // Bottom of the 6th inning (▼ 6, matching reference image!)
  balls: 0,
  strikes: 0,
  outs: 1,      // 1 OUT (matching reference image!)
  scoreUser: 1, // LAD 1
  scoreCpu: 3,  // SD 3 (matching reference image!)

  phase: 'pre_pitch', // 'pre_pitch' -> 'windup' -> 'pinpoint_ring' -> 'pitch_flight' -> 'contact_slowmo' -> 'field_play' -> 'game_over'
  cameraMode: 'duel',
  windupProgress: 0,

  selectedPitch: '4seam',
  aimX: 0.05,
  aimZ: 0.72,
  ringRadius: 1.0,
  releaseQuality: 'GOOD',
  releaseMultiplier: 1.0,

  pitchPts: [],
  pitchGravityPts: [],
  pitchIdx: 0,
  pitchIdxProgress: 0,
  currentSpeedKmh: 158, // 98 mph

  batX: 0.0,
  batZ: 0.72,
  swingTriggered: false,
  swingAnimProgress: 0,
  swingTimingText: '',
  contactFlashTimer: 0,
  contactFlashMax: 12,
  lastContactInfo: null,

  fieldPts: [],
  fieldBounces: [],
  fieldIdx: 0,
  fieldIdxProgress: 0,
  ballPos: { x: 0, y: 0, z: 0, state: 'air', dist: 0 },
  camX: 0,
  camY: 0,
  camZ: 0,
  camZoom: 1.0,
  prePitchSecondsLeft: 0,
  countdownInterval: null,
  hitStatcast: null,
  projectedLanding: null,
  fielders: [],
  ballHolder: null,
  thrownBall: null,
  diveQteAvailable: false,
  diveFielder: null,
  slideQteAvailable: false,
  didSlide: false,
  fireworks: [],

  occupiedBases: [false, false, false], // 1B, 2B, 3B
  activeRunners: [],
  particles: [],

  touchDragging: false,
  animId: null
};

function getActiveUserTeam() {
  return MLB_TEAMS[RG.userTeamCode] || MLB_TEAMS.LAD;
}

function getActiveOppTeam() {
  return MLB_TEAMS[RG.oppTeamCode] || MLB_TEAMS.SD;
}

function getCurrentBatterInfo() {
  if (RG.userRole === 'batter') {
    const team = getActiveUserTeam();
    if (RG.lockOhtani && RG.userTeamCode === 'LAD') return team.batters[0];
    return team.batters[RG.userBatterIdx % team.batters.length];
  } else {
    const team = getActiveOppTeam();
    return team.batters[RG.cpuBatterIdx % team.batters.length];
  }
}

function getCurrentPitcherInfo() {
  if (RG.userRole === 'pitcher') {
    const team = getActiveUserTeam();
    if (RG.lockOhtani && RG.userTeamCode === 'LAD') return team.pitchers[0];
    return team.pitchers[RG.userPitcherIdx % team.pitchers.length];
  } else {
    const team = getActiveOppTeam();
    return team.pitchers[0];
  }
}

function initRivalsFielders() {
  RG.fielders = [
    { pos: 'P',  num: getCurrentPitcherInfo().num, x: 0, y: 14.0, homeX: 0, homeY: 14.0, speed: 6.0 },
    { pos: 'C',  num: '16', x: 0, y: -1.0, homeX: 0, homeY: -1.0, speed: 5.2 },
    { pos: '1B', num: '5',  x: 13.0, y: 15.5, homeX: 13.5, homeY: 13.5, speed: 5.8 },
    { pos: '2B', num: '9',  x: 6.8, y: 23.5, homeX: 0, homeY: 27.0, speed: 6.4 },
    { pos: 'SS', num: '50', x: -6.8, y: 23.5, homeX: 0, homeY: 27.0, speed: 6.6 },
    { pos: '3B', num: '13', x: -13.0, y: 15.5, homeX: -13.5, homeY: 13.5, speed: 6.0 },
    { pos: 'LF', num: '37', x: -21.0, y: 43.0, homeX: -21.0, homeY: 43.0, speed: 7.0 },
    { pos: 'CF', num: '25', x: 0.0, y: 49.0, homeX: 0.0, homeY: 49.0, speed: 7.4 },
    { pos: 'RF', num: '17', x: 21.0, y: 43.0, homeX: 21.0, homeY: 43.0, speed: 7.1 }
  ];
}

function getBaseCoordsMeters(baseIndex) {
  if (baseIndex === 1) return { x: 13.5, y: 13.5 };
  if (baseIndex === 2) return { x: 0.0, y: 27.0 };
  if (baseIndex === 3) return { x: -13.5, y: 13.5 };
  return { x: 0.0, y: 0.0 };
}

function getRunnerXY(posFloat) {
  const b0 = Math.floor(posFloat);
  const b1 = Math.min(4, b0 + 1);
  const frac = posFloat - b0;
  const c0 = getBaseCoordsMeters(b0);
  const c1 = getBaseCoordsMeters(b1);
  return {
    x: c0.x + (c1.x - c0.x) * frac,
    y: c0.y + (c1.y - c0.y) * frac
  };
}

// ==================== SIMPLIFIED INTUITIVE CONTROL HANDLER ====================
// One universal button or screen tap handles everything in fluid flow:
function handleRivalsPrimaryButton() {
  if (RG.isGameOver) {
    resetRivalsMatch();
    return;
  }
  if (RG.phase === 'pinpoint_ring') {
    lockPinpointRelease();
  } else if (RG.phase === 'pitch_flight') {
    if (RG.userRole === 'batter') {
      triggerRivalsSwing();
    }
  } else if (RG.phase === 'windup') {
    // Allow batter to wait for pitch release
  } else if (RG.phase === 'pre_pitch') {
    clearTimeout(RG.autoNextTimer);
    clearInterval(RG.countdownInterval);
    RG.prePitchSecondsLeft = 0;
    startRivalsPitchAction();
  } else if (RG.phase === 'field_play') {
    if (RG.slideQteAvailable && !RG.didSlide) {
      triggerRivalsSlideQTE();
    } else if (RG.diveQteAvailable) {
      triggerRivalsDiveQTE();
    }
  }
}

function setRivalsMatchFormat(fmt) {
  RG.matchFormat = fmt || 'clutch';
  ['clutch', '3inn', '9inn'].forEach(k => {
    const btn = document.getElementById('rivals-fmt-' + k);
    if (btn) btn.classList.toggle('active', k === RG.matchFormat);
  });
  resetRivalsMatch();
}

function cycleRivalsCameraAngle() {
  const order = ['broadcast', 'batter_pov', 'pitcher_pov', 'skycam'];
  const labels = {
    broadcast: '🎥 中外野經典轉播視角 (Broadcast)',
    batter_pov: '👁️ 打者主觀特寫視角 (Batter POV)',
    pitcher_pov: '⚾ 投手丘背後視角 (Pitcher View)',
    skycam: '🦅 球場內野高空視角 (High Skycam)'
  };
  const shortLabels = {
    broadcast: '🎥中外野',
    batter_pov: '👁️打者POV',
    pitcher_pov: '⚾投手視角',
    skycam: '🦅高空鳥瞰'
  };
  const next = order[(order.indexOf(RG.duelCamAngle) + 1) % order.length];
  RG.duelCamAngle = next;
  const camBtn = document.getElementById('rivals-cam-btn');
  if (camBtn) camBtn.textContent = shortLabels[next];
  showRivalsBanner(`🎥 攝影機視角已切換：${labels[next]}`, 1500);
  renderRivalsCanvas();
}

function setRivalsPitchSpeed(preset) {
  const presets = {
    slow:   { mult: 0.48, label: '🐢 輕鬆慢速 (約1.8秒反應・最推薦)' },
    normal: { mult: 0.68, label: '⚾ 舒適標準 (約1.3秒反應)' },
    pro:    { mult: 0.92, label: '🔥 大聯盟實戰 (快速挑戰)' }
  };
  const cfg = presets[preset] || presets.slow;
  RG.pitchSpeedPreset = preset;
  RG.pitchSpeedMult = cfg.mult;
  ['slow', 'normal', 'pro'].forEach(k => {
    const btn = document.getElementById('rivals-spd-' + k);
    if (btn) btn.classList.toggle('active', k === preset);
  });
  showRivalsBanner(`⏱️ 投打節奏已切換：${cfg.label}`, 1600);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function cycleRivalsPitchSpeed() {
  const order = ['slow', 'normal', 'pro'];
  const next = order[(order.indexOf(RG.pitchSpeedPreset) + 1) % order.length];
  setRivalsPitchSpeed(next);
}

// Toggle Auto Batter ON/OFF
function toggleAutoBatter() {
  RG.autoBatter = !RG.autoBatter;
  showRivalsBanner(RG.autoBatter ? '🤖 打者 AUTO：開啟（AI 自動看準時機揮棒）' : '✋ 打者 手動：開啟（點擊螢幕一鍵揮棒）', 1500);
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop(3800);
}

// Toggle Auto Pitcher ON/OFF
function toggleAutoPitcher() {
  RG.autoPitcher = !RG.autoPitcher;
  showRivalsBanner(RG.autoPitcher ? '🤖 投手 AUTO：開啟（AI 自動精準配球）' : '✋ 投手 手動：開啟（玩家手動一鍵投球）', 1500);
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop(3800);
}

function toggleAutoAimAssist() {
  RG.autoAimAssist = !RG.autoAimAssist;
  const chk = document.getElementById('chk-auto-aim');
  if (chk) chk.checked = RG.autoAimAssist;
  showRivalsBanner(RG.autoAimAssist ? '🎯 智慧自動瞄準：開啟（只需抓時機點一下揮棒！）' : '✋ 手動游標瞄準：開啟（滑動好球帶瞄準）', 1600);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function toggleAutoFielding(checked) {
  RG.autoFielding = (typeof checked === 'boolean') ? checked : !RG.autoFielding;
  const chk = document.getElementById('chk-auto-fielding');
  if (chk) chk.checked = RG.autoFielding;
  showRivalsBanner(RG.autoFielding ? '🏟️ MLB 勁旅對決模式：守備與跑壘全自動（專注投打對決！）' : '🧤 手動進階守備與跑壘控制：開啟', 1600);
  updateRivalsHUD();
  renderRivalsCanvas();
}

// Relaxed MLB TV Broadcast Tempo between pitches (Default: 3.8s, or tap anytime to pitch)
function checkAutoLoop(delayMs = 3800) {
  clearTimeout(RG.autoNextTimer);
  clearInterval(RG.countdownInterval);
  if (RG.isGameOver || RG.phase !== 'pre_pitch') return;

  if (RG.userRole === 'batter' || RG.autoPitcher) {
    let remainMs = delayMs;
    RG.prePitchSecondsLeft = (remainMs / 1000).toFixed(1);

    RG.countdownInterval = setInterval(() => {
      remainMs -= 200;
      if (remainMs <= 0) {
        clearInterval(RG.countdownInterval);
        RG.prePitchSecondsLeft = 0;
      } else {
        RG.prePitchSecondsLeft = (remainMs / 1000).toFixed(1);
      }
      if (RG.phase === 'pre_pitch' && RG.cameraMode === 'duel' && !RG.isGameOver) {
        renderRivalsCanvas();
      }
    }, 200);

    RG.autoNextTimer = setTimeout(() => {
      clearInterval(RG.countdownInterval);
      RG.prePitchSecondsLeft = 0;
      if (RG.phase === 'pre_pitch' && !RG.isGameOver) {
        startRivalsPitchAction();
      }
    }, delayMs);
  }
}

function setRivalsUserTeam(teamCode) {
  RG.userTeamCode = teamCode;
  RG.userBatterIdx = 0;
  RG.userPitcherIdx = 0;
  if (teamCode !== 'LAD') {
    RG.lockOhtani = false;
    const chk = document.getElementById('chk-ohtani-lock');
    if (chk) chk.checked = false;
  }
  updateRivalsHUD();
  renderRivalsCanvas();
}

function setRivalsOpponentTeam(teamCode) {
  RG.oppTeamCode = teamCode;
  RG.cpuBatterIdx = 0;
  resetRivalsMatch();
}

function setRivalsOpponent(idx) {
  const codes = ['SD', 'NYY', 'HOU'];
  setRivalsOpponentTeam(codes[idx] || 'SD');
}

function toggleOhtaniLock(checked) {
  RG.lockOhtani = checked;
  if (checked && RG.userTeamCode !== 'LAD') {
    RG.userTeamCode = 'LAD';
    const sel = document.getElementById('rivals-user-team-select');
    if (sel) sel.value = 'LAD';
  }
  RG.userBatterIdx = 0;
  RG.userPitcherIdx = 0;
  updateRivalsHUD();
  renderRivalsCanvas();
}

function switchDodgersBatter() {
  const team = getActiveUserTeam();
  RG.lockOhtani = false;
  const chk = document.getElementById('chk-ohtani-lock');
  if (chk) chk.checked = false;
  RG.userBatterIdx = (RG.userBatterIdx + 1) % team.batters.length;
  const b = getCurrentBatterInfo();
  showRivalsBanner(`🏏 切換打者：#${b.num} ${b.name.split(' ')[0]} (${b.hand === 'L' ? '左打' : '右打'})`, 1600);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function setRivalsRole(mode) {
  RG.roleMode = mode;
  if (mode === 'twoway') {
    // Home team (User) pitches in Top of inning (isTop=true) and bats in Bottom (isTop=false)!
    RG.userRole = RG.isTop ? 'pitcher' : 'batter';
    showRivalsBanner('🦄 大谷翔平 #17 二刀流模式：上半局投球守備・下半局上場打擊！', 1800);
  } else {
    RG.userRole = mode;
    RG.isTop = (mode === 'pitcher');
  }

  ['twoway', 'bat', 'pitch'].forEach(k => {
    const btn = document.getElementById('rivals-role-' + k);
    if (btn) {
      const isAct = (k === 'twoway' && mode === 'twoway') || (k === 'bat' && mode === 'batter') || (k === 'pitch' && mode === 'pitcher');
      btn.classList.toggle('active', isAct);
    }
  });

  RG.phase = 'pre_pitch';
  RG.cameraMode = 'duel';
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop();
}

function setRivalsSwingMode(mode) {
  RG.swingPowerMode = mode;
  const cBtn = document.getElementById('swing-mode-contact');
  const pBtn = document.getElementById('swing-mode-power');
  if (cBtn) cBtn.classList.toggle('active', mode === 'contact');
  if (pBtn) pBtn.classList.toggle('active', mode === 'power');

  const hcBtn = document.getElementById('hud-swing-contact');
  const hpBtn = document.getElementById('hud-swing-power');
  if (hcBtn && hpBtn) {
    hcBtn.className = mode === 'contact'
      ? 'px-2.5 py-1 rounded-lg bg-sky-500/30 border border-sky-400 text-sky-200 font-extrabold text-[11px] cursor-pointer'
      : 'px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-600 text-slate-300 font-bold text-[11px] cursor-pointer';
    hpBtn.className = mode === 'power'
      ? 'px-2.5 py-1 rounded-lg bg-rose-500/30 border border-rose-400 text-rose-200 font-extrabold text-[11px] cursor-pointer'
      : 'px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-600 text-slate-300 font-bold text-[11px] cursor-pointer';
  }
  renderRivalsCanvas();
}

function selectRivalsPitchCard(pKey) {
  if (!RIVALS_PITCHES[pKey]) pKey = '4seam';
  RG.selectedPitch = pKey;
  ['4seam', 'sweeper', 'splitter', '2seam', 'curve'].forEach(k => {
    const btn = document.getElementById('rcard-' + k);
    if (btn) btn.classList.toggle('active', k === pKey);
    const hbtn = document.getElementById('hud-card-' + k);
    if (hbtn) {
      hbtn.className = k === pKey
        ? 'hud-pcard active px-2 py-1 rounded-lg bg-blue-500/30 border border-amber-400 text-[11px] font-extrabold text-amber-200 whitespace-nowrap cursor-pointer'
        : 'hud-pcard px-2 py-1 rounded-lg bg-slate-800/90 border border-slate-600 text-[11px] font-bold text-slate-300 whitespace-nowrap cursor-pointer';
    }
  });
  const p = RIVALS_PITCHES[pKey];
  const descEl = document.getElementById('rivals-pitch-card-desc');
  if (descEl) descEl.textContent = `${p.name}：${p.desc}`;
  renderRivalsCanvas();
}

function toggleRivalsFullscreen() {
  const wrap = document.getElementById('rivals-viewport-wrap');
  if (!wrap) return;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else if (wrap.requestFullscreen) {
    wrap.requestFullscreen().catch(() => {
      wrap.classList.toggle('fixed');
      wrap.classList.toggle('inset-0');
      wrap.classList.toggle('z-50');
    });
  } else {
    wrap.classList.toggle('fixed');
    wrap.classList.toggle('inset-0');
    wrap.classList.toggle('z-50');
  }
}

function activateClutchSpecial() {
  if (RG.clutchEnergy < 100) return;
  RG.isClutchActive = true;
  RG.clutchEnergy = 0;
  RivalsSFX.playCheer();
  showRivalsBanner('🦄 OHTANI SHOWTIME 必殺時刻啟動！190km/h 擊球初速＆102mph 極限球威！', 2600);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function addClutchEnergy(amount) {
  RG.clutchEnergy = Math.min(100, RG.clutchEnergy + amount);
  updateRivalsHUD();
}

function updateRivalsHUD() {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();

  const uLbl = document.getElementById('rivals-user-team-label');
  if (uLbl) uLbl.textContent = `${uTeam.name} ${uTeam.code}`;
  const oLbl = document.getElementById('rivals-opp-name');
  if (oLbl) oLbl.textContent = `${oTeam.name} ${oTeam.code}`;

  const extraTag = RG.inning > RG.maxInnings ? ' (延長)' : '';
  document.getElementById('rivals-inning').textContent = `${RG.inning}局${RG.isTop ? '上' : '下'}${extraTag}`;
  document.getElementById('rivals-score-user').textContent = RG.scoreUser;
  document.getElementById('rivals-score-cpu').textContent = RG.scoreCpu;

  document.getElementById('rivals-b').textContent = '●'.repeat(RG.balls) + '○'.repeat(Math.max(0, 4 - RG.balls));
  document.getElementById('rivals-s').textContent = '●'.repeat(RG.strikes) + '○'.repeat(Math.max(0, 3 - RG.strikes));
  document.getElementById('rivals-o').textContent = '●'.repeat(RG.outs) + '○'.repeat(Math.max(0, 3 - RG.outs));

  const activeHero = RG.userRole === 'batter' ? getCurrentBatterInfo() : getCurrentPitcherInfo();
  const cardOvr = document.getElementById('rivals-card-ovr');
  const cardPlayer = document.getElementById('rivals-card-player');
  const cardSub = document.getElementById('rivals-card-sub');
  if (cardOvr) cardOvr.textContent = `OVR ${activeHero.ovr}`;
  if (cardPlayer) cardPlayer.textContent = `#${activeHero.num} ${activeHero.name}`;
  if (cardSub) {
    cardSub.textContent = RG.userRole === 'batter'
      ? `${uTeam.name}｜${activeHero.hand === 'L' ? '左打 LHB' : '右打 RHB'}・強振加成 +${activeHero.pwrBonus}`
      : `${uTeam.name}｜${activeHero.hand === 'L' ? '左投 LHP' : '右投 RHP'}・極速 101 mph 二刀流`;
  }

  const batPanel = document.getElementById('rivals-batter-panel');
  const pitchPanel = document.getElementById('rivals-pitcher-panel');
  if (batPanel) batPanel.classList.toggle('hidden', RG.userRole !== 'batter');
  if (pitchPanel) pitchPanel.classList.toggle('hidden', RG.userRole !== 'pitcher');

  const hudPitchCards = document.getElementById('rivals-hud-pitch-cards');
  const hudBatModes = document.getElementById('rivals-hud-bat-modes');
  const hudActionWrap = document.getElementById('rivals-hud-action-wrap');
  const mainIcon = document.getElementById('rivals-hud-main-icon');
  const mainLabel = document.getElementById('rivals-hud-main-label');

  if (RG.cameraMode === 'duel' && !RG.isGameOver) {
    if (hudActionWrap) hudActionWrap.classList.remove('hidden');
    if (RG.userRole === 'pitcher') {
      if (hudPitchCards) hudPitchCards.classList.remove('hidden');
      if (hudBatModes) hudBatModes.classList.add('hidden');
      if (mainIcon) mainIcon.textContent = RG.phase === 'pinpoint_ring' ? '🎯' : '⚾';
      if (mainLabel) mainLabel.textContent = RG.phase === 'pinpoint_ring' ? '放球！' : '一鍵投球';
    } else {
      if (hudPitchCards) hudPitchCards.classList.add('hidden');
      if (hudBatModes) hudBatModes.classList.remove('hidden');
      if (mainIcon) mainIcon.textContent = RG.phase === 'pitch_flight' ? '🏏' : (RG.phase === 'windup' ? '👀' : '⚾');
      if (mainLabel) mainLabel.textContent = RG.phase === 'pitch_flight' ? '揮棒 SWING' : (RG.phase === 'windup' ? '看球準備...' : '點擊開打');
    }
  } else {
    if (hudPitchCards) hudPitchCards.classList.add('hidden');
    if (hudBatModes) hudBatModes.classList.add('hidden');
    if (hudActionWrap) hudActionWrap.classList.add('hidden');
  }

  const bar = document.getElementById('rivals-clutch-bar');
  const btn = document.getElementById('rivals-clutch-btn');
  const hudClutch = document.getElementById('hud-clutch-quick');
  if (bar) bar.style.width = `${RG.clutchEnergy}%`;
  if (btn) {
    if (RG.clutchEnergy >= 100) {
      btn.disabled = false;
      btn.className = 'px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow animate-bounce cursor-pointer whitespace-nowrap';
      btn.textContent = '🔥 SHOWTIME!(MAX)';
      if (hudClutch) hudClutch.classList.remove('hidden');
    } else {
      btn.disabled = true;
      btn.className = 'px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-400 font-bold text-xs cursor-not-allowed whitespace-nowrap';
      btn.textContent = RG.isClutchActive ? '🔥 SHOWTIME 中' : `⚡ 能量 ${RG.clutchEnergy}%`;
      if (hudClutch) hudClutch.classList.add('hidden');
    }
  }

  const fieldRunningBar = document.getElementById('rivals-running-actions');
  const fieldDefenseBar = document.getElementById('rivals-defense-actions');
  if (RG.cameraMode === 'field' && RG.phase === 'field_play' && !RG.autoFielding) {
    fieldRunningBar.classList.toggle('hidden', RG.userRole !== 'batter');
    fieldDefenseBar.classList.toggle('hidden', RG.userRole !== 'pitcher');
  } else {
    fieldRunningBar.classList.add('hidden');
    fieldDefenseBar.classList.add('hidden');
  }
}

function showRivalsBanner(text, ms = 2200) {
  const el = document.getElementById('rivals-center-banner');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), ms);
}

function setRivalsLog(text) {
  const el = document.getElementById('rivals-live-log');
  if (el) el.innerHTML = text;
}

function closeRivalsPostGameModal() {
  const modal = document.getElementById('rivals-postgame-modal');
  if (modal) modal.classList.add('hidden');
  RG.isGameOver = false;
}

function openRivalsPostGameModal(headline, subline) {
  RG.isGameOver = true;
  RG.phase = 'game_over';
  clearTimeout(RG.autoNextTimer);
  clearInterval(RG.countdownInterval);
  RG.prePitchSecondsLeft = 0;
  updateRivalsHUD();

  const modal = document.getElementById('rivals-postgame-modal');
  if (!modal) return;

  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const userWon = RG.scoreUser > RG.scoreCpu;
  const mvp = uTeam.batters[0];

  const titleEl = document.getElementById('rivals-pg-title');
  const subEl = document.getElementById('rivals-pg-sub');
  const oppCodeEl = document.getElementById('rivals-pg-opp-code');
  const oppRunsEl = document.getElementById('rivals-pg-opp-r');
  const oppHitsEl = document.getElementById('rivals-pg-opp-h');
  const oppHrEl = document.getElementById('rivals-pg-opp-hr');
  const oppSoEl = document.getElementById('rivals-pg-opp-so');

  const usrCodeEl = document.getElementById('rivals-pg-usr-code');
  const usrRunsEl = document.getElementById('rivals-pg-usr-r');
  const usrHitsEl = document.getElementById('rivals-pg-usr-h');
  const usrHrEl = document.getElementById('rivals-pg-usr-hr');
  const usrSoEl = document.getElementById('rivals-pg-usr-so');

  const mvpNameEl = document.getElementById('rivals-pg-mvp-name');
  const mvpStatEl = document.getElementById('rivals-pg-mvp-stat');

  if (titleEl) {
    titleEl.textContent = headline || (userWon ? (RG.isWalkOff ? '🎊 WALK-OFF! 再見逆轉勝利！' : '🏆 VICTORY! 比賽結束・我方獲勝！') : '⚾ GAME OVER! 惜敗對手・再接再厲！');
    titleEl.className = userWon
      ? 'text-lg sm:text-2xl font-black text-amber-300 tracking-wide'
      : 'text-lg sm:text-2xl font-black text-sky-300 tracking-wide';
  }
  if (subEl) subEl.textContent = subline || RG.matchStats.lastScoringPlay;

  if (oppCodeEl) oppCodeEl.textContent = `${oTeam.name} (${oTeam.shortName})`;
  if (oppRunsEl) oppRunsEl.textContent = RG.scoreCpu;
  if (oppHitsEl) oppHitsEl.textContent = RG.matchStats.cpuHits;
  if (oppHrEl) oppHrEl.textContent = RG.matchStats.cpuHR;
  if (oppSoEl) oppSoEl.textContent = RG.matchStats.userSO;

  if (usrCodeEl) usrCodeEl.textContent = `${uTeam.name} (${uTeam.shortName})`;
  if (usrRunsEl) usrRunsEl.textContent = RG.scoreUser;
  if (usrHitsEl) usrHitsEl.textContent = RG.matchStats.userHits;
  if (usrHrEl) usrHrEl.textContent = RG.matchStats.userHR;
  if (usrSoEl) usrSoEl.textContent = RG.matchStats.cpuSO;

  if (mvpNameEl) mvpNameEl.textContent = `#${mvp.num} ${mvp.name} (${uTeam.shortName})`;
  if (mvpStatEl) {
    mvpStatEl.textContent = `單場戰報：${mvp.hitLog}｜最快初速 ${RG.matchStats.maxExitVelo} km/h｜最遠全壘打 ${RG.matchStats.maxHrDistFt} FT`;
  }

  modal.classList.remove('hidden');
}

function checkWalkOffCondition(playDesc, isHR = false) {
  // Walk-Off occurs when in the bottom of the final regulation (or extra) inning, Home (scoreUser) takes the lead!
  if (!RG.isTop && RG.inning >= RG.maxInnings && RG.scoreUser > RG.scoreCpu) {
    RG.isWalkOff = true;
    RG.matchStats.lastScoringPlay = playDesc;
    RivalsSFX.playHomeRunHorn(true);
    const bannerMsg = isHR
      ? `🎊 WALK-OFF HOME RUN! 再見全壘打逆轉勝！(${RG.scoreUser} : ${RG.scoreCpu})`
      : `🎊 WALK-OFF WINNER! 再見安打逆轉勝！(${RG.scoreUser} : ${RG.scoreCpu})`;
    showRivalsBanner(bannerMsg, 4000);
    setRivalsLog(`🏆 <strong>${bannerMsg}</strong> ${playDesc}`);
    setTimeout(() => {
      openRivalsPostGameModal(bannerMsg, playDesc);
    }, isHR ? 2400 : 1800);
    return true;
  }
  return false;
}

function resetRivalsMatch() {
  if (RG.animId) cancelAnimationFrame(RG.animId);
  clearTimeout(RG.autoNextTimer);
  clearInterval(RG.countdownInterval);
  RG.prePitchSecondsLeft = 0;
  closeRivalsPostGameModal();

  RG.isGameOver = false;
  RG.isWalkOff = false;

  if (RG.matchFormat === '3inn') {
    RG.maxInnings = 3;
    RG.inning = 1;
    RG.isTop = (RG.roleMode === 'pitcher' || RG.roleMode === 'twoway');
    RG.outs = 0;
    RG.scoreUser = 0;
    RG.scoreCpu = 0;
    RG.occupiedBases = [false, false, false];
    RG.matchStats = { userHits: 0, cpuHits: 0, userHR: 0, cpuHR: 0, userSO: 0, cpuSO: 0, maxExitVelo: 165, maxHrDistFt: 395, lastScoringPlay: '3局快打賽正式開打！' };
  } else if (RG.matchFormat === '9inn') {
    RG.maxInnings = 9;
    RG.inning = 1;
    RG.isTop = (RG.roleMode === 'pitcher' || RG.roleMode === 'twoway');
    RG.outs = 0;
    RG.scoreUser = 0;
    RG.scoreCpu = 0;
    RG.occupiedBases = [false, false, false];
    RG.matchStats = { userHits: 0, cpuHits: 0, userHR: 0, cpuHR: 0, userSO: 0, cpuSO: 0, maxExitVelo: 165, maxHrDistFt: 395, lastScoringPlay: '9局大聯盟正規賽開戰！' };
  } else {
    // Default 'clutch': Classic MLB Rivals 6th-inning comeback scenario (SD 3 - 1 LAD, Bottom 6th, 1 Out, Runner on 1B!)
    RG.maxInnings = 6;
    RG.inning = 6;
    RG.isTop = (RG.roleMode === 'pitcher');
    RG.outs = 1;
    RG.scoreUser = 1;
    RG.scoreCpu = 3;
    RG.occupiedBases = [true, false, false]; // Runner on 1st base (#50 Betts) so a Home Run ties the game 3-3!
    RG.matchStats = { userHits: 4, cpuHits: 6, userHR: 1, cpuHR: 1, userSO: 5, cpuSO: 3, maxExitVelo: 184, maxHrDistFt: 418, lastScoringPlay: '6局下 1出局一壘有人・再見逆轉關鍵局！' };
  }

  RG.balls = 0;
  RG.strikes = 0;
  RG.activeRunners = [];
  RG.fireworks = [];

  if (RG.roleMode === 'twoway') {
    RG.userRole = RG.isTop ? 'pitcher' : 'batter';
  } else {
    RG.userRole = RG.roleMode;
  }

  RG.phase = 'pre_pitch';
  RG.cameraMode = 'duel';
  RG.pitchPts = [];
  RG.fieldPts = [];
  initRivalsFielders();
  updateRivalsHUD();
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const fmtName = RG.matchFormat === '3inn' ? '⚡3局快打賽' : (RG.matchFormat === '9inn' ? '🏟️9局正規賽' : '🔥6局下關鍵逆轉賽');
  setRivalsLog(`🏟️ <strong>《MLB 勁旅對決 v2.7.0》${fmtName}開戰！</strong> ${oTeam.shortName} ${RG.scoreCpu} - ${RG.scoreUser} ${uTeam.shortName}（${RG.inning}局${RG.isTop ? '上' : '下'}）點擊螢幕即可投打對決！`);
  renderRivalsCanvas();
  checkAutoLoop(3800);
}

// ==================== PITCHING & PINPOINT RING ====================
function startRivalsPitchAction() {
  if (RG.isGameOver) return;
  if (RG.phase !== 'pre_pitch') {
    if (RG.phase === 'pinpoint_ring') {
      lockPinpointRelease();
    }
    return;
  }

  clearTimeout(RG.autoNextTimer);
  clearInterval(RG.countdownInterval);
  RG.prePitchSecondsLeft = 0;

  initRivalsFielders();
  RG.cameraMode = 'duel';
  RG.swingTriggered = false;
  RG.swingAnimProgress = 0;
  RG.swingTimingText = '';
  RG.lastContactInfo = null;
  RG.fieldPts = [];
  RG.thrownBall = null;
  RG.ballHolder = null;
  RG.diveQteAvailable = false;
  RG.slideQteAvailable = false;
  RG.didSlide = false;
  RG.fireworks = [];

  if (RG.userRole === 'pitcher' && !RG.autoPitcher) {
    RG.phase = 'pinpoint_ring';
    RG.ringRadius = 1.0;
    const btn = document.getElementById('btn-rivals-pitch-main');
    if (btn) btn.textContent = '🎯 看準縮圈重合時點擊：放球！(空白鍵 / 點畫面)';
    updateRivalsHUD();

    if (RG.animId) cancelAnimationFrame(RG.animId);
    let lastRingTime = performance.now();
    function ringLoop(now) {
      if (RG.phase !== 'pinpoint_ring') return;
      const curTime = now || performance.now();
      const dtMs = curTime - lastRingTime;
      lastRingTime = curTime;
      const timeScale = Math.min(2.0, Math.max(0.4, dtMs / 16.67));

      RG.ringRadius -= 0.012 * timeScale;
      renderRivalsCanvas();
      if (RG.phase === 'pinpoint_ring') {
        if (RG.ringRadius <= 0.04) {
          lockPinpointRelease();
        } else {
          RG.animId = requestAnimationFrame(ringLoop);
        }
      }
    }
    RG.animId = requestAnimationFrame(ringLoop);
  } else {
    // AI Pitcher (or Auto-Pitcher): Play authentic MLB Rivals Windup & Pre-Pitch Preview first!
    const keys = ['4seam', 'sweeper', 'splitter', '2seam', 'curve'];
    RG.selectedPitch = keys[Math.floor(Math.random() * keys.length)];
    RG.aimX = (Math.random() * 0.44) - 0.22;
    RG.aimZ = 0.52 + Math.random() * 0.40;
    RG.releaseQuality = 'GOOD';
    RG.releaseMultiplier = 1.0;

    RG.phase = 'windup';
    RG.windupProgress = 0;
    updateRivalsHUD();

    const pInfo = RIVALS_PITCHES[RG.selectedPitch] || RIVALS_PITCHES['4seam'];
    showRivalsBanner(`👀 投手抬腿蓄力中... 準備迎擊【${pInfo.name}】！`, 1100);

    if (RG.animId) cancelAnimationFrame(RG.animId);
    let lastWindupTime = performance.now();
    function windupLoop(now) {
      if (RG.phase !== 'windup') return;
      const curTime = now || performance.now();
      const dtMs = curTime - lastWindupTime;
      lastWindupTime = curTime;
      const timeScale = Math.min(2.0, Math.max(0.4, dtMs / 16.67));

      RG.windupProgress += 0.022 * timeScale;
      if (RG.autoAimAssist && RG.userRole === 'batter' && !RG.touchDragging) {
        RG.batX += (RG.aimX * 0.65 - RG.batX) * (0.12 * timeScale);
        RG.batZ += (RG.aimZ * 0.65 + 0.25 - RG.batZ) * (0.12 * timeScale);
      }
      renderRivalsCanvas();
      if (RG.phase !== 'windup') return;
      if (RG.windupProgress < 1.0) {
        RG.animId = requestAnimationFrame(windupLoop);
      } else {
        launchRivals3DPitch();
      }
    }
    RG.animId = requestAnimationFrame(windupLoop);
  }
}

function lockPinpointRelease() {
  if (RG.phase !== 'pinpoint_ring') return;
  const btn = document.getElementById('btn-rivals-pitch-main');
  if (btn) btn.textContent = '⚾ 啟動縮圈投球 (再按一次鎖定完美放球！)';

  const diff = Math.abs(RG.ringRadius - 0.28);
  if (diff <= 0.16 || RG.isClutchActive) {
    RG.releaseQuality = 'PERFECT';
    RG.releaseMultiplier = 1.25;
    addClutchEnergy(20);
    showRivalsBanner('✨ PERFECT 完美放球！球威與尾勁 +25%！', 1500);
  } else if (diff <= 0.32) {
    RG.releaseQuality = 'GOOD';
    RG.releaseMultiplier = 1.0;
    showRivalsBanner('👍 GOOD 良好放球！', 1100);
  } else {
    RG.releaseQuality = 'WILD';
    RG.releaseMultiplier = 0.82;
    RG.aimZ += (Math.random() < 0.5 ? -0.18 : 0.14);
    showRivalsBanner('⚠️ 放球稍偏！', 1300);
  }
  launchRivals3DPitch();
}

function launchRivals3DPitch() {
  RG.phase = 'pitch_flight';
  updateRivalsHUD();

  const pInfo = RIVALS_PITCHES[RG.selectedPitch] || RIVALS_PITCHES['4seam'];
  const pitcher = getCurrentPitcherInfo();
  const clutchBoost = (RG.isClutchActive && RG.userRole === 'pitcher') ? 6 : 0;

  const displayKmh = Math.round(pInfo.mlbSpeed + (pitcher.veloBonus || 0) + clutchBoost);
  const displayMph = Math.round(displayKmh / 1.609);
  RG.currentSpeedKmh = displayKmh;

  const simSpd = pInfo.simSpeed + (RG.userRole === 'batter' ? getActiveOppTeam().velMod : clutchBoost);
  const breakMult = RG.releaseMultiplier;
  const startSightX = RG.aimX - pInfo.breakX * breakMult;
  const startSightZ = RG.aimZ - pInfo.breakZ * breakMult;

  const v0 = simSpd / 3.6;
  const distToPlate = 14.0;
  const tEst = distToPlate / v0;
  const x0 = pitcher.hand === 'L' ? 0.16 : -0.16;
  const y0 = 0, z0 = 1.52;

  const gravComp = 0.5 * 9.81 * tEst * tEst;
  const vx0 = (startSightX - x0) / tEst;
  const vz0 = (startSightZ + gravComp - z0) / tEst;
  const vy0 = Math.sqrt(Math.max(10, v0 * v0 - vx0 * vx0 - vz0 * vz0));

  const dt = 0.0085;
  RG.pitchPts = [];
  RG.pitchGravityPts = [];

  let x = x0, y = y0, z = z0;
  let vx = vx0, vy = vy0, vz = vz0;
  let gx = x0, gy = y0, gz = z0;
  let gvx = vx0, gvy = vy0, gvz = vz0;

  const axBreak = (2 * pInfo.breakX * breakMult) / (tEst * tEst);
  const azBreak = (2 * pInfo.breakZ * breakMult) / (tEst * tEst);

  let bounced = false;
  for (let i = 0; i < 240; i++) {
    RG.pitchPts.push({ x, y, z, vx, vy, vz, bounced });
    RG.pitchGravityPts.push({ x: gx, y: gy, z: Math.max(0, gz) });
    if (y >= 14.8) break;

    vx += axBreak * dt;
    vz += (-9.81 + azBreak) * dt;
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;

    if (z <= 0.03) {
      z = 0.03;
      if (!bounced) RivalsSFX.playBounce();
      bounced = true;
      vz = -vz * 0.45;
      vy *= 0.78;
      vx *= 0.82;
    }

    gvz += -9.81 * dt;
    gx += gvx * dt;
    gy += gvy * dt;
    gz += gvz * dt;
  }

  RG.pitchIdx = 0;
  RG.pitchIdxProgress = 0;
  document.getElementById('rivals-tele-pitch').textContent = `${displayKmh} km/h (${displayMph} mph ${pInfo.short})`;
  document.getElementById('rivals-tele-hit').textContent = '--';
  document.getElementById('rivals-tele-dist').textContent = '--';

  if (RG.animId) cancelAnimationFrame(RG.animId);
  let lastFlightTime = performance.now();

  function flightLoop(now) {
    if (RG.phase !== 'pitch_flight') return;
    const curTime = now || performance.now();
    const dtMs = curTime - lastFlightTime;
    lastFlightTime = curTime;
    const timeScale = Math.min(2.0, Math.max(0.4, dtMs / 16.67));

    RG.pitchIdx += (1.15 * RG.pitchSpeedMult * timeScale);
    RG.pitchIdxProgress = RG.pitchIdx;
    if (RG.swingTriggered && RG.swingAnimProgress < 1) {
      RG.swingAnimProgress = Math.min(1, RG.swingAnimProgress + 0.16 * timeScale);
    }
    const idx = Math.min(Math.floor(RG.pitchIdx), RG.pitchPts.length - 1);
    const curP = RG.pitchPts[idx];
    const platePt = RG.pitchPts.find(p => p.y >= 13.85) || RG.pitchPts[RG.pitchPts.length - 1];

    // Auto-Aim Assist: Lock sweet spot onto plate arrival coordinates so user ONLY needs to tap on time!
    if (RG.autoAimAssist && RG.userRole === 'batter' && !RG.touchDragging && !RG.swingTriggered) {
      RG.batX += (platePt.x - RG.batX) * (0.25 * timeScale);
      RG.batZ += (platePt.z - RG.batZ) * (0.25 * timeScale);
    }

    // Auto Batter Trigger (If Auto Batter is enabled)
    if (RG.autoBatter && RG.userRole === 'batter' && !RG.swingTriggered && curP.y >= 13.4 && curP.y <= 14.1) {
      const inStrikeZone = !curP.bounced && Math.abs(curP.x) <= 0.36 && curP.z >= 0.40 && curP.z <= 1.06;
      if (inStrikeZone || Math.random() < 0.25) {
        RG.batX = curP.x + (Math.random() * 0.06 - 0.03);
        RG.batZ = curP.z + (Math.random() * 0.06 - 0.03);
        triggerRivalsSwing();
        return;
      }
    }

    // AI Batter Trigger (When player is pitcher)
    if (RG.userRole === 'pitcher' && !RG.swingTriggered && curP.y >= 13.4 && curP.y <= 14.1) {
      const oppSkill = getActiveOppTeam().aiSkill;
      const inStrikeZone = !curP.bounced && Math.abs(curP.x) <= 0.34 && curP.z >= 0.42 && curP.z <= 1.04;
      const swingProb = inStrikeZone ? 0.74 : 0.28;
      if (Math.random() < swingProb) {
        const err = (1 - oppSkill) * 0.24;
        RG.batX = curP.x + (Math.random() * 2 - 1) * err;
        RG.batZ = curP.z + (Math.random() * 2 - 1) * err;
        triggerRivalsSwing();
        return;
      }
    }

    renderRivalsCanvas();

    if (RG.phase !== 'pitch_flight') return;
    if (RG.pitchIdx < RG.pitchPts.length - 1) {
      RG.animId = requestAnimationFrame(flightLoop);
    } else {
      RivalsSFX.playMittPop();
      resolveRivalsPitchTaken();
    }
  }
  RG.animId = requestAnimationFrame(flightLoop);
}

// ==================== BATTING & SWEET SPOT + NO-DOUBT HR ADMIRE CAM ====================
function triggerRivalsSwing() {
  if (RG.phase !== 'pitch_flight' || RG.swingTriggered) return;
  RG.swingTriggered = true;
  RG.swingAnimProgress = 0.25;

  const idx = Math.min(Math.floor(RG.pitchIdx), RG.pitchPts.length - 1);
  const curP = RG.pitchPts[idx];
  const platePt = RG.pitchPts.find(p => p.y >= 13.85) || RG.pitchPts[RG.pitchPts.length - 1];
  const batter = getCurrentBatterInfo();

  if (RG.autoAimAssist && RG.userRole === 'batter' && !RG.touchDragging) {
    RG.batX = curP.x * 0.3 + platePt.x * 0.7;
    RG.batZ = curP.z * 0.3 + platePt.z * 0.7;
  }

  const yDiff = curP.y - 13.65;
  const distXZ = Math.hypot(curP.x - RG.batX, curP.z - RG.batZ);
  const maxContactRadius = (RG.swingPowerMode === 'contact' ? 0.44 : 0.38) + (batter.num === '17' ? 0.06 : 0.03);
  const maxTimingWindow = 3.25;

  if (Math.abs(yDiff) <= maxTimingWindow && distXZ <= maxContactRadius) {
    const isSweetSpot = distXZ <= 0.18 && Math.abs(yDiff) <= 1.15;
    const isCrit = isSweetSpot || (RG.isClutchActive && RG.userRole === 'batter');
    RG.isClutchActive = false;
    RG.swingAnimProgress = 1.0;
    RivalsSFX.playBatHit(isCrit);

    const dz = curP.z - RG.batZ;
    let launchDeg = 18 - dz * 145;
    if (isCrit) launchDeg = Math.max(19, Math.min(30, launchDeg));
    launchDeg = Math.max(-15, Math.min(58, launchDeg));

    const timingQuality = Math.max(0.2, 1 - Math.abs(yDiff) / maxTimingWindow);
    const centerQuality = Math.max(0.25, 1 - distXZ / maxContactRadius);
    const pwrBonus = batter.pwrBonus || 8;

    const simExitVelo = Math.round(82 + (timingQuality * 0.45 + centerQuality * 0.55) * 42 + (RG.swingPowerMode === 'power' ? 11 : 3) + (isCrit ? 13 : 0) + pwrBonus * 0.45);
    const statcastKmh = Math.round(simExitVelo * 1.48);
    if (statcastKmh > RG.matchStats.maxExitVelo) RG.matchStats.maxExitVelo = statcastKmh;

    const pullSign = batter.hand === 'L' ? -1 : 1;
    const sprayDeg = Math.max(-38, Math.min(38, yDiff * 16 * pullSign + (curP.x - RG.batX) * 55));

    // Check if this contact is a No-Doubt Home Run for dramatic slow-mo admire cam!
    const previewBackspin = launchDeg < 6 ? -0.55 : 0.88;
    const previewSim = simulateBattedBallPhysics(launchDeg, simExitVelo, previewBackspin, sprayDeg);
    const isNoDoubtHR = previewSim.carryDist >= 75;
    const estDistFt = Math.round(previewSim.carryDist * 5.3);

    RG.swingTimingText = Math.abs(yDiff) <= 1.15 ? '⚡ PERFECT 完美時機！' : (yDiff < 0 ? '◀ 拉打 GOOD (EARLY)' : '推打 GOOD (LATE) ▶');
    RG.lastContactInfo = {
      isCrit,
      isNoDoubtHR,
      estDistFt,
      exitVelo: simExitVelo,
      statcastKmh,
      launchDeg: Math.round(launchDeg),
      x: curP.x,
      z: curP.z
    };

    if (RG.userRole === 'batter') addClutchEnergy(isCrit ? 35 : 20);

    RG.phase = 'contact_slowmo';
    RG.contactFlashMax = isNoDoubtHR ? 40 : (isCrit ? 22 : 12);
    RG.contactFlashTimer = RG.contactFlashMax;

    if (isNoDoubtHR) {
      RivalsSFX.playHomeRunHorn(false);
      showRivalsBanner(
        `🎥 NO-DOUBT HOME RUN! #${batter.num} ${batter.short} 確信步目送特寫！初速 ${statcastKmh} km/h・預估 ${estDistFt} FT`,
        2800
      );
    } else {
      showRivalsBanner(
        isCrit
          ? `💥 #${batter.num} ${batter.short} 完美擊中甜蜜點！初速 ${statcastKmh} km/h・仰角 ${Math.round(launchDeg)}°`
          : `🏏 強勁擊球 (${RG.swingTimingText})！初速 ${statcastKmh} km/h・仰角 ${Math.round(launchDeg)}°`,
        2200
      );
    }

    if (RG.animId) cancelAnimationFrame(RG.animId);
    function slowMoLoop() {
      RG.contactFlashTimer--;
      renderRivalsCanvas();
      if (RG.contactFlashTimer > 0) {
        RG.animId = requestAnimationFrame(slowMoLoop);
      } else {
        startRivalsFieldPlay(launchDeg, simExitVelo, sprayDeg, statcastKmh);
      }
    }
    RG.animId = requestAnimationFrame(slowMoLoop);
  } else {
    RG.isClutchActive = false;
    RG.swingTimingText = Math.abs(yDiff) > maxTimingWindow ? (yDiff < 0 ? '💨 太早揮棒了！等球飛近本壘紅框再按' : '💨 太晚揮棒了！') : '💨 揮棒落空 (SWING & MISS)';
    showRivalsBanner(RG.swingTimingText, 1800);
  }
}

function resolveRivalsPitchTaken() {
  RG.phase = 'pre_pitch';
  const plateP = RG.pitchPts.find(p => p.y >= 14.0) || RG.pitchPts[RG.pitchPts.length - 1];
  const inZone = !plateP.bounced && Math.abs(plateP.x) <= 0.33 && plateP.z >= 0.44 && plateP.z <= 1.02;

  if (RG.swingTriggered || inZone) {
    RG.strikes++;
    const isSO = RG.strikes >= 3;
    RivalsSFX.playUmpireStrike(isSO);
    if (!RG.swingTriggered && !isSO) {
      showRivalsBanner('🟡 主審宣判：STRIKE 好球！', 1400);
      setRivalsLog(`⚾ <strong>好球進壘 (STRIKE)！</strong> ${RIVALS_PITCHES[RG.selectedPitch].name} 壓在好球帶邊角！`);
    }
    if (isSO) {
      RG.strikes = 0;
      RG.balls = 0;
      if (RG.userRole === 'pitcher') {
        RG.matchStats.userSO++;
        addClutchEnergy(28);
      } else {
        RG.matchStats.cpuSO++;
      }
      recordRivalsOut('🔥 STRIKE THREE! 三振出局 (STRIKEOUT)！');
    }
  } else {
    RG.balls++;
    const isWalk = RG.balls >= 4;
    RivalsSFX.playUmpireBall(isWalk);
    if (RG.userRole === 'batter') addClutchEnergy(12);
    showRivalsBanner(isWalk ? '🚶 BALL FOUR! 四壞球保送上壘！' : '🟢 主審宣判：BALL 壞球！', 1500);
    setRivalsLog(plateP.bounced ? '👀 <strong>選球漂亮！</strong> 挖地瓜壞球！' : '👀 <strong>選球精準！</strong> 壞球偏出九宮格！');
    if (isWalk) {
      RG.balls = 0;
      RG.strikes = 0;
      advanceRivalsWalk();
    }
  }
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop(3800);
}

// ==================== 3D FIELD PLAY & BASERUNNING ====================
function startRivalsFieldPlay(launchDeg, simExitVelo, sprayDeg, statcastKmh) {
  RG.phase = 'field_play';
  RG.cameraMode = 'field';

  const backspin = launchDeg < 6 ? -0.55 : 0.88;
  const sim = simulateBattedBallPhysics(launchDeg, simExitVelo, backspin, sprayDeg);
  RG.fieldPts = sim.pts;
  RG.fieldBounces = sim.bounces;
  RG.fieldIdx = 0;
  RG.fieldIdxProgress = 0;
  RG.particles = [];

  const mlbDistFt = Math.round(sim.totalDist * 5.3);
  const exitMph = Math.round((statcastKmh || simExitVelo * 1.48) / 1.609);
  RG.hitStatcast = {
    exitVeloKmh: statcastKmh || Math.round(simExitVelo * 1.48),
    exitVeloMph: exitMph,
    launchDeg: Math.round(launchDeg),
    totalDistM: sim.totalDist,
    totalDistFt: mlbDistFt,
    carryDistM: sim.carryDist,
    carryDistFt: Math.round(sim.carryDist * 5.3),
    isHomeRun: sim.carryDist >= 74
  };

  const firstBounce = sim.bounces[0] || sim.pts[Math.min(sim.pts.length - 1, 48)];
  RG.projectedLanding = {
    x: firstBounce ? firstBounce.x : 0,
    y: firstBounce ? firstBounce.y : 60,
    dist: firstBounce ? firstBounce.dist : sim.carryDist
  };

  RG.camX = 0;
  RG.camY = 0;
  RG.camZ = 0;

  document.getElementById('rivals-tele-hit').textContent = `${statcastKmh || simExitVelo} km/h / ${Math.round(launchDeg)}°`;
  document.getElementById('rivals-tele-dist').textContent = `${sim.totalDist}m (${mlbDistFt} ft)`;

  RG.activeRunners = [];
  const isFlyBall = launchDeg >= 22 && sim.carryDist < 75;
  const shouldTagUpWait = isFlyBall && RG.outs < 2;

  for (let b = 2; b >= 0; b--) {
    if (RG.occupiedBases[b]) {
      const baseNum = b + 1;
      const forced = (b === 0) || (b === 1 && RG.occupiedBases[0]) || (b === 2 && RG.occupiedBases[1] && RG.occupiedBases[0]);
      const target = sim.carryDist >= 74 ? 4 : ((shouldTagUpWait && !forced) ? baseNum : baseNum + 1);
      RG.activeRunners.push({
        id: 'R' + baseNum,
        num: b === 0 ? '50' : (b === 1 ? '5' : '37'),
        startBase: baseNum,
        pos: baseNum + (shouldTagUpWait ? 0.05 : 0.12),
        targetBase: target,
        safe: false,
        out: false
      });
    }
  }

  const batter = getCurrentBatterInfo();
  RG.activeRunners.push({
    id: `#${batter.num}`,
    num: batter.num,
    startBase: 0,
    pos: 0.0,
    targetBase: sim.carryDist >= 74 ? 4 : (sim.totalDist >= 54 && launchDeg < 26 ? 2 : 1),
    safe: false,
    out: false
  });

  updateRivalsHUD();
  setRivalsLog(
    sim.carryDist >= 74
      ? `🚀 <strong>深遠飛球直奔外野看台！</strong> 仰角 ${Math.round(launchDeg)}°・預估飛行 ${Math.round(sim.carryDist * 5.3)} FT！`
      : '🏟️ <strong>球打進場內！</strong> 電視轉播廣角追球鏡頭、連續彈跳與草地滾動！'
  );

  if (RG.animId) cancelAnimationFrame(RG.animId);
  let lastStadiumTime = performance.now();
  let lastBounceCount = 0;

  function stadiumLoop(now) {
    if (RG.phase !== 'field_play') return;
    const curTime = now || performance.now();
    const dtMs = curTime - lastStadiumTime;
    lastStadiumTime = curTime;
    const timeScale = Math.min(2.0, Math.max(0.4, dtMs / 16.67));

    if (!RG.ballHolder && !RG.thrownBall) {
      RG.fieldIdxProgress += 0.56 * timeScale;
      RG.fieldIdx = Math.min(Math.floor(RG.fieldIdxProgress), RG.fieldPts.length - 1);

      const frac = RG.fieldIdxProgress - Math.floor(RG.fieldIdxProgress);
      const pt0 = RG.fieldPts[RG.fieldIdx];
      const pt1 = RG.fieldPts[Math.min(RG.fieldIdx + 1, RG.fieldPts.length - 1)];
      const bx = pt0.x + (pt1.x - pt0.x) * frac;
      const by = pt0.y + (pt1.y - pt0.y) * frac;
      const bz = pt0.z + (pt1.z - pt0.z) * frac;
      const bDist = pt0.dist + (pt1.dist - pt0.dist) * frac;
      RG.ballPos = { x: bx, y: by, z: bz, state: pt0.state, dist: bDist };

      const curBounces = RG.fieldBounces.filter(b => bDist >= b.dist).length;
      if (curBounces > lastBounceCount) {
        lastBounceCount = curBounces;
        RivalsSFX.playBounce();
        spawnBounceParticles(bx, by, bDist < 26);
      }

      if (bDist >= 74 && pt0.state === 'air') {
        finishHomeRun(sim.carryDist);
        return;
      }
    }

    updateFieldersAndCheckCatch(launchDeg, sim.carryDist);

    if (RG.thrownBall) {
      RG.thrownBall.progress += 0.036 * timeScale;
      if (RG.thrownBall.progress >= 1.0) {
        RivalsSFX.playMittPop();
        handleThrowArrival(RG.thrownBall.targetBase);
      }
    }

    let anyRunnerMoving = false;
    RG.activeRunners.forEach(r => {
      if (r.out) return;
      if (Math.abs(r.pos - r.targetBase) > 0.015) {
        anyRunnerMoving = true;
        const dir = r.targetBase > r.pos ? 1 : -1;
        const speedStep = ((RG.didSlide && r.targetBase - r.pos < 0.35) ? 0.019 : 0.011) * timeScale;
        r.pos += dir * speedStep;
        if ((dir > 0 && r.pos >= r.targetBase) || (dir < 0 && r.pos <= r.targetBase)) {
          r.pos = r.targetBase;
          if (r.pos >= 4) r.safe = true;
        }
      }
    });

    if (RG.userRole === 'batter' && RG.thrownBall && !RG.didSlide) {
      RG.slideQteAvailable = true;
    } else {
      RG.slideQteAvailable = false;
    }
    const slideBtn = document.getElementById('btn-rivals-slide');
    if (slideBtn) slideBtn.classList.toggle('animate-bounce', RG.slideQteAvailable);

    renderRivalsCanvas();

    const ballStopped = (RG.fieldIdx >= RG.fieldPts.length - 1) || (RG.ballHolder && !RG.thrownBall);
    if (ballStopped && !anyRunnerMoving && !RG.thrownBall) {
      concludeFieldPlay();
      return;
    }

    RG.animId = requestAnimationFrame(stadiumLoop);
  }
  RG.animId = requestAnimationFrame(stadiumLoop);
}

function spawnBounceParticles(x, y, isDirt) {
  for (let i = 0; i < 10; i++) {
    RG.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4.0,
      vy: (Math.random() - 0.5) * 4.0,
      life: 20,
      color: isDirt ? '#d97706' : '#4ade80'
    });
  }
}

function updateFieldersAndCheckCatch(launchDeg, carryDist) {
  if (RG.ballHolder || RG.thrownBall) return;

  let closestF = null;
  let minD = 999;
  RG.fielders.forEach(f => {
    if (f.pos === 'C') return;
    const d = Math.hypot(RG.ballPos.x - f.x, RG.ballPos.y - f.y);
    if (d < minD) {
      minD = d;
      closestF = f;
    }
  });

  RG.fielders.forEach(f => {
    if (f === closestF) {
      const ang = Math.atan2(RG.ballPos.y - f.y, RG.ballPos.x - f.x);
      const step = f.speed * 0.042;
      f.x += Math.cos(ang) * step;
      f.y += Math.sin(ang) * step;
    } else {
      let target = null;
      if (f.pos === '1B') target = getBaseCoordsMeters(1);
      else if (f.pos === '2B' || f.pos === 'SS') target = getBaseCoordsMeters(2);
      else if (f.pos === '3B') target = getBaseCoordsMeters(3);
      if (target) {
        const dBase = Math.hypot(target.x - f.x, target.y - f.y);
        if (dBase > 0.4) {
          f.x += ((target.x - f.x) / dBase) * 0.22;
          f.y += ((target.y - f.y) / dBase) * 0.22;
        }
      }
    }
  });

  RG.diveQteAvailable = (RG.userRole === 'pitcher' && RG.ballPos.z < 1.8 && minD > 1.6 && minD < 4.4);
  RG.diveFielder = closestF;
  const diveBtn = document.getElementById('btn-rivals-dive');
  if (diveBtn) diveBtn.classList.toggle('animate-bounce', RG.diveQteAvailable);

  if (closestF && minD <= 1.65 && RG.ballPos.z <= 2.3) {
    RivalsSFX.playMittPop();
    RG.ballHolder = closestF;

    if (RG.ballPos.state === 'air' && RG.fieldIdx > 8) {
      const batter = RG.activeRunners.find(r => r.startBase === 0);
      if (batter) batter.out = true;
      RivalsSFX.playUmpireCall(false);
      recordRivalsOut(`🧤 OUT! 美技接殺！${closestF.pos} 直接接殺飛球！`);

      RG.activeRunners.forEach(r => {
        if (!r.out && r.startBase >= 2 && RG.outs < 3) {
          r.targetBase = r.startBase + 1;
          setRivalsLog(`🏃‍♂️ <strong>高飛犧牲推進 (Tag Up)！</strong> 跑者起跑衝向下一個壘包！`);
        }
      });

      if (RG.outs >= 3) {
        concludeFieldPlay();
        return;
      }
    }

    if (RG.userRole === 'batter' || RG.autoFielding) {
      const movingRunner = RG.activeRunners.find(r => !r.out && Math.abs(r.pos - r.targetBase) > 0.04);
      const targetB = movingRunner ? movingRunner.targetBase : 1;
      setTimeout(() => {
        if (RG.phase === 'field_play' && RG.ballHolder) {
          rivalsThrowToBase(targetB);
        }
      }, 160);
    } else {
      setRivalsLog(`🧤 <strong>${closestF.pos} 接到球了！</strong> 請點擊按鈕傳球殺跑者！`);
    }
  }
}

function triggerRivalsDiveQTE() {
  if (!RG.diveFielder || RG.ballHolder) return;
  const d = Math.hypot(RG.ballPos.x - RG.diveFielder.x, RG.ballPos.y - RG.diveFielder.y);
  if (d <= 4.8) {
    RG.diveFielder.x = RG.ballPos.x;
    RG.diveFielder.y = RG.ballPos.y;
    RG.ballHolder = RG.diveFielder;
    RivalsSFX.playMittPop();
    addClutchEnergy(22);
    showRivalsBanner(`🦸‍♂️ ${RG.diveFielder.pos} 超級飛撲美技攔截！`, 1600);
  }
}

function rivalsThrowToBase(baseNum) {
  if (RG.phase !== 'field_play' || !RG.ballHolder) return;
  const dest = getBaseCoordsMeters(baseNum);
  RG.thrownBall = {
    fromX: RG.ballHolder.x,
    fromY: RG.ballHolder.y,
    toX: dest.x,
    toY: dest.y,
    progress: 0.0,
    targetBase: baseNum
  };
  RG.ballHolder = null;
}

function handleThrowArrival(baseNum) {
  RG.thrownBall = null;
  const runner = RG.activeRunners.find(r => !r.out && r.targetBase === baseNum);
  if (runner) {
    const distRemaining = Math.abs(runner.targetBase - runner.pos);
    const slideBonus = RG.didSlide ? 0.09 : 0.0;
    if (distRemaining > (0.04 + slideBonus)) {
      runner.out = true;
      RivalsSFX.playUmpireCall(false);
      const baseNames = ['本壘', '一壘', '二壘', '三壘', '本壘'];
      recordRivalsOut(`⚡ OUT! 傳球刺殺出局！球比跑者早一步到達${baseNames[baseNum]}！`);

      if (RG.outs < 3 && baseNum === 2) {
        const batter = RG.activeRunners.find(r => !r.out && r.targetBase === 1 && r.pos < 0.96);
        if (batter && RG.userRole === 'batter') {
          const b2 = getBaseCoordsMeters(2);
          const b1 = getBaseCoordsMeters(1);
          RG.thrownBall = { fromX: b2.x, fromY: b2.y, toX: b1.x, toY: b1.y, progress: 0, targetBase: 1 };
        }
      }
    } else {
      RivalsSFX.playUmpireCall(true);
      showRivalsBanner(RG.didSlide ? '💨 SAFE! 神級曲腿滑壘閃過觸殺！' : '🙌 SAFE! 跑者安全踏上壘包！', 1600);
      if (RG.didSlide && RG.userRole === 'batter') addClutchEnergy(18);
    }
  }
}

function commandRivalsRunnersAdvance() {
  if (RG.phase !== 'field_play') return;
  RG.activeRunners.forEach(r => {
    if (!r.out && r.targetBase < 4) {
      r.targetBase = Math.min(4, Math.floor(r.pos) + 1 === r.targetBase ? r.targetBase + 1 : Math.floor(r.pos) + 1);
    }
  });
  showRivalsBanner('🏃‍♂️ 指揮跑者：全員全力衝刺！', 1200);
}

function commandRivalsRunnersHold() {
  if (RG.phase !== 'field_play') return;
  RG.activeRunners.forEach(r => {
    if (!r.out && r.startBase > 0) {
      r.targetBase = Math.max(r.startBase, Math.round(r.pos));
    }
  });
  showRivalsBanner('🛑 指揮跑者：踩住壘包等待！', 1200);
}

function triggerRivalsSlideQTE() {
  if (RG.phase !== 'field_play') return;
  RG.didSlide = true;
  showRivalsBanner('🦶 曲腿滑壘！衝刺速度加成＋閃避觸殺！', 1400);
}

function finishHomeRun(carryDist) {
  let runs = 1;
  RG.occupiedBases.forEach(occ => { if (occ) runs++; });

  const batter = getCurrentBatterInfo();
  const mlbDistFt = Math.round(carryDist * 5.3);
  if (mlbDistFt > RG.matchStats.maxHrDistFt) RG.matchStats.maxHrDistFt = mlbDistFt;

  if (RG.userRole === 'batter') {
    RG.scoreUser += runs;
    RG.matchStats.userHits++;
    RG.matchStats.userHR++;
    batter.hitLog = `${RG.matchStats.userHits}安打 ${RG.matchStats.userHR}HR (${runs}打點)`;
  } else {
    RG.scoreCpu += runs;
    RG.matchStats.cpuHits++;
    RG.matchStats.cpuHR++;
  }

  const isWalkOffHR = (!RG.isTop && RG.inning >= RG.maxInnings && RG.scoreUser > RG.scoreCpu);
  RivalsSFX.playHomeRunHorn(isWalkOffHR);

  RG.occupiedBases = [false, false, false];
  RG.balls = 0;
  RG.strikes = 0;

  if (!RG.lockOhtani) {
    if (RG.userRole === 'batter') RG.userBatterIdx++;
    else RG.cpuBatterIdx++;
  }

  RG.fireworks = [];
  const fwCount = isWalkOffHR ? 72 : 42;
  for (let i = 0; i < fwCount; i++) {
    RG.fireworks.push({
      x: 120 + Math.random() * 720,
      y: 30 + Math.random() * 160,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      color: ['#facc15', '#38bdf8', '#f43f5e', '#4ade80', '#c084fc'][i % 5]
    });
  }

  const hrTitle = isWalkOffHR
    ? `🎊 WALK-OFF HOME RUN! #${batter.num} ${batter.short} 轟出 ${mlbDistFt} FT 再見逆轉全壘打！+${runs}分！`
    : `🎆 BIG FLY! #${batter.num} 轟出 ${mlbDistFt} 英尺 (${carryDist}m) 特大號全壘打！+${runs} 分！`;
  showRivalsBanner(hrTitle, 3600);
  setRivalsLog(`🎆 <strong>${isWalkOffHR ? 'WALK-OFF HOME RUN 再見全壘打！' : 'HOME RUN 全壘打！'}</strong> #${batter.num} ${batter.short} 轟上看台（${mlbDistFt} ft），進帳 <strong>${runs} 分</strong>！`);

  let fwFrames = isWalkOffHR ? 75 : 55;
  let lastFwTime = performance.now();
  function fwLoop(now) {
    const curTime = now || performance.now();
    const dtMs = curTime - lastFwTime;
    lastFwTime = curTime;
    const timeScale = Math.min(2.0, Math.max(0.4, dtMs / 16.67));

    fwFrames -= timeScale;
    renderRivalsCanvas();
    if (fwFrames > 0) {
      RG.animId = requestAnimationFrame(fwLoop);
    } else {
      if (checkWalkOffCondition(`#${batter.num} ${batter.short} 轟出 ${mlbDistFt} FT 再見全壘打！`, true)) {
        return;
      }
      RG.phase = 'pre_pitch';
      RG.cameraMode = 'duel';
      updateRivalsHUD();
      renderRivalsCanvas();
      checkAutoLoop(3800);
    }
  }
  RG.animId = requestAnimationFrame(fwLoop);
}

function concludeFieldPlay() {
  const newBases = [false, false, false];
  let runsScored = 0;
  let batterReachedBase = false;

  RG.activeRunners.forEach(r => {
    if (r.out) return;
    const finalB = Math.round(r.pos);
    if (r.startBase === 0 && finalB >= 1) batterReachedBase = true;
    if (finalB >= 4) {
      runsScored++;
    } else if (finalB >= 1 && finalB <= 3) {
      newBases[finalB - 1] = true;
    }
  });

  const batter = getCurrentBatterInfo();
  if (batterReachedBase && RG.outs < 3) {
    if (RG.userRole === 'batter') {
      RG.matchStats.userHits++;
      batter.hitLog = `${RG.matchStats.userHits}安打 ${RG.matchStats.userHR}HR`;
    } else {
      RG.matchStats.cpuHits++;
    }
  }

  if (runsScored > 0 && RG.outs < 3) {
    RivalsSFX.playCheer();
    if (RG.userRole === 'batter') RG.scoreUser += runsScored;
    else RG.scoreCpu += runsScored;
    showRivalsBanner(`🎉 安打推進！跑者回本壘得 ${runsScored} 分！`, 2400);
  }

  if (!RG.lockOhtani) {
    if (RG.userRole === 'batter') RG.userBatterIdx++;
    else RG.cpuBatterIdx++;
  }

  RG.occupiedBases = newBases;
  RG.balls = 0;
  RG.strikes = 0;

  if (runsScored > 0 && RG.outs < 3) {
    if (checkWalkOffCondition(`#${batter.num} ${batter.short} 敲出再見安打送回致勝分！`, false)) {
      return;
    }
  }

  RG.phase = 'pre_pitch';
  // Allow players 2.4s to enjoy the field play outcome before returning camera
  setTimeout(() => {
    if (RG.isGameOver) return;
    RG.cameraMode = 'duel';
    updateRivalsHUD();
    renderRivalsCanvas();
    checkAutoLoop(3800);
  }, 2400);
}

function advanceRivalsWalk() {
  let runs = 0;
  if (RG.occupiedBases[0] && RG.occupiedBases[1] && RG.occupiedBases[2]) {
    runs = 1;
  } else if (RG.occupiedBases[0] && RG.occupiedBases[1]) {
    RG.occupiedBases[2] = true;
  } else if (RG.occupiedBases[0]) {
    RG.occupiedBases[1] = true;
  }
  RG.occupiedBases[0] = true;
  if (runs > 0) {
    if (RG.userRole === 'batter') RG.scoreUser += runs;
    else RG.scoreCpu += runs;
    checkWalkOffCondition('滿壘四壞球保送擠回再見致勝分！', false);
  }
}

function recordRivalsOut(msg) {
  RG.outs++;
  showRivalsBanner(msg, 2200);
  setRivalsLog(`📣 <strong>裁判判決：</strong> ${msg}`);
  if (RG.outs >= 3) {
    RG.outs = 0;
    RG.balls = 0;
    RG.strikes = 0;
    RG.occupiedBases = [false, false, false];
    RG.activeRunners = [];

    // Check end of half-inning & regulation / extra innings rules!
    if (RG.isTop) {
      // Top of final inning just ended: if Home team (scoreUser) is already ahead, Home team wins without batting in bottom!
      if (RG.inning >= RG.maxInnings && RG.scoreUser > RG.scoreCpu) {
        RG.matchStats.lastScoringPlay = `${RG.inning}局上守備完美關門！終場 ${RG.scoreUser} : ${RG.scoreCpu} 獲勝！`;
        RivalsSFX.playCheer();
        setTimeout(() => {
          openRivalsPostGameModal('🏆 VICTORY! 成功守住勝果・完賽獲勝！', RG.matchStats.lastScoringPlay);
        }, 1200);
        updateRivalsHUD();
        return;
      }

      if (RG.roleMode === 'pitcher') {
        // Pitcher-only mode: quick-sim bottom half offense and advance to next inning top
        const simRuns = Math.random() < 0.42 ? 1 : 0;
        RG.scoreUser += simRuns;
        if (RG.inning >= RG.maxInnings && RG.scoreUser !== RG.scoreCpu) {
          RG.matchStats.lastScoringPlay = `終場比數 ${RG.scoreUser} : ${RG.scoreCpu}`;
          setTimeout(() => openRivalsPostGameModal(null, RG.matchStats.lastScoringPlay), 1200);
          updateRivalsHUD();
          return;
        }
        RG.inning++;
        RG.isTop = true;
      } else {
        RG.isTop = false;
      }
    } else {
      // Bottom of inning just ended (3 outs)
      if (RG.inning >= RG.maxInnings && RG.scoreUser !== RG.scoreCpu) {
        RG.matchStats.lastScoringPlay = `${RG.inning}局結束・終場比數 ${RG.scoreUser} : ${RG.scoreCpu}`;
        if (RG.scoreUser > RG.scoreCpu) RivalsSFX.playCheer();
        setTimeout(() => {
          openRivalsPostGameModal(null, RG.matchStats.lastScoringPlay);
        }, 1200);
        updateRivalsHUD();
        return;
      }

      if (RG.roleMode === 'batter') {
        // Batter-only mode: quick-sim top of next inning and stay in bottom for user to bat!
        RG.inning++;
        const cpuScored = Math.random() < 0.35 ? 1 : 0;
        RG.scoreCpu += cpuScored;
        RG.isTop = false;
      } else {
        RG.inning++;
        RG.isTop = true;
      }
    }

    // Extra Innings Ghost Runner on 2nd Base (MLB Tiebreaker Rule!)
    const isExtraInning = RG.inning > RG.maxInnings;
    if (isExtraInning) {
      RG.occupiedBases = [false, true, false];
    }

    if (RG.roleMode === 'twoway') {
      RG.userRole = RG.isTop ? 'pitcher' : 'batter';
    }

    setTimeout(() => {
      if (RG.isGameOver) return;
      let roleMsg = RG.roleMode === 'twoway'
        ? (RG.userRole === 'pitcher' ? `🦄 ${RG.inning}局上攻守交換！大谷翔平 #17 登板投球！` : `🦄 ${RG.inning}局下攻守交換！大谷翔平 #17 上場打擊！`)
        : `🔄 三人出局！進入第 ${RG.inning} 局${RG.isTop ? '上' : '下'}！`;
      if (isExtraInning) {
        roleMsg = `🔥 延長賽第 ${RG.inning} 局突破僵局制（二壘自動配置跑者）！`;
      }
      showRivalsBanner(roleMsg, 2600);
      updateRivalsHUD();
      renderRivalsCanvas();
      checkAutoLoop(3800);
    }, 1800);
  } else {
    setTimeout(() => {
      if (!RG.isGameOver && RG.phase === 'pre_pitch') checkAutoLoop(3800);
    }, 1400);
  }
  updateRivalsHUD();
}

// ==================== 3D SUNNY DODGER STADIUM BROADCAST RENDERER ====================
// Matches the user reference image (Dodger Stadium, Day, Blue Sky, Palms, Flag, Scoreboards)
function renderRivalsCanvas() {
  const canvas = document.getElementById('rivalsBroadcastCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (RG.cameraMode === 'duel') {
    drawRivalsDuelCameraDay(ctx, W, H);
    drawRivalsOfficialHUD(ctx, W, H);
  } else {
    drawRivalsStadiumCamera3D(ctx, W, H);
    drawRivalsStadiumHUD(ctx, W, H);
  }
}

// 3D Player Renderer
function draw3DBaseballPlayer(ctx, opts) {
  const {
    x, y, scale = 1.0,
    jerseyColor = '#f8fafc',
    accentColor = '#005A9C',
    numberColor = '#EF3E42',
    capColor = '#005A9C',
    number = '17',
    name = '',
    role = 'pitcher',
    animPhase = 0
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft sunlit ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (role === 'pitcher') {
    // 3D Pitcher on mound in distance
    const kick = animPhase > 0 && animPhase < 0.45 ? Math.sin((animPhase / 0.45) * Math.PI) : 0;
    const stride = animPhase >= 0.45 ? Math.min(1, (animPhase - 0.45) / 0.4) : 0;

    // Legs
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -26);
    ctx.lineTo(-7, -2);
    ctx.moveTo(5, -26);
    ctx.lineTo(6 + stride * 12, -2 - kick * 18 + stride * 3);
    ctx.stroke();

    // Cleats
    ctx.fillStyle = accentColor;
    ctx.fillRect(-11, -3, 8, 4);
    ctx.fillRect(3 + stride * 12, -3 - kick * 18 + stride * 3, 8, 4);

    // Jersey
    ctx.fillStyle = jerseyColor;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-12, -52 + stride * 4, 24, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = numberColor;
    ctx.font = '900 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(number, 0, -34 + stride * 4);

    // Arms
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(11, -46 + stride * 4);
    ctx.lineTo(18 - stride * 8, -36 + stride * 6);
    const armX = -14 - Math.sin(animPhase * Math.PI) * 14;
    const armY = -48 - Math.sin(animPhase * Math.PI) * 18 + stride * 12;
    ctx.moveTo(-11, -46 + stride * 4);
    ctx.lineTo(armX, armY);
    ctx.stroke();

    // Glove
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(18 - stride * 8, -36 + stride * 6, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Cap & Head
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -60 + stride * 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(0, -62 + stride * 4, 8.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-9, -62 + stride * 4, 18, 3);
  } else if (role === 'batter_L' || role === 'batter_R') {
    // 3D Batter in Batter's Box (Exact proportion and posture as Freeman/Ohtani in reference image)
    const isLHB = (role === 'batter_L');
    const dir = isLHB ? -1 : 1;
    const swing = animPhase;

    // Legs: Crisp white pants with blue piping
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Back leg
    ctx.moveTo(-dir * 9, -46);
    ctx.lineTo(-dir * 13, -20);
    ctx.lineTo(-dir * 11, -3);
    // Front leg
    ctx.moveTo(dir * 8, -46);
    ctx.lineTo(dir * 12, -22);
    ctx.lineTo(dir * 14, -5);
    ctx.stroke();

    // Dark grey/black cleats
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-dir * 16, -4, 14, 5);
    ctx.fillRect(dir * 8, -6, 14, 5);

    // Blue Dodgers belt
    ctx.fillStyle = accentColor;
    ctx.fillRect(-17, -50, 34, 5.5);

    // 3D White Dodgers Home Jersey (Back view)
    const twist = swing * dir * 10;
    ctx.fillStyle = jerseyColor;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-21 + twist * 0.3, -95, 42, 48, 10);
    ctx.fill();
    ctx.stroke();

    // Blue Compression Sleeves on shoulders/arms (Dodgers Blue)
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(-25 + twist * 0.3, -93, 10, 22, 5);
    ctx.roundRect(15 + twist * 0.3, -93, 10, 22, 5);
    ctx.fill();

    // Iconic Red Back Number (#17 or #5) & Name
    ctx.fillStyle = accentColor;
    ctx.font = '800 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name || 'OHTANI', twist * 0.4, -81);

    ctx.fillStyle = numberColor;
    ctx.font = '900 22px sans-serif';
    ctx.fillText(number, twist * 0.4, -59);

    // 3D Glossy Dodgers Blue Batting Helmet with White LA Emblem
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(twist * 0.3, -107, 14, 0, Math.PI * 2);
    ctx.fill();

    // Helmet brim
    ctx.fillRect(twist * 0.3 + (isLHB ? -17 : 2), -111, 15, 4.5);

    // Helmet glossy sunlight highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(twist * 0.3 - 4, -112, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // White LA logo on helmet
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('LA', twist * 0.3 + (isLHB ? 4 : -4), -106);

    // Hands, Stance Rhythm & 3D Pro Wood Bat (raised high in ready posture like reference image!)
    const wag = Math.sin(Date.now() * 0.007) * 3.5;
    let handsX, handsY, batTipX, batTipY;
    if (swing <= 0.01) {
      // High cocked batting stance as in the reference image!
      handsX = -dir * 18;
      handsY = -92 + wag * 0.3;
      batTipX = -dir * 10 + wag * 0.8;
      batTipY = -145;
    } else if (swing < 0.55) {
      const p = swing / 0.55;
      handsX = -dir * 10 + dir * p * 28;
      handsY = -80;
      batTipX = dir * (22 + p * 60);
      batTipY = -82 + (p - 0.3) * 16;

      // Golden swing blur arc
      ctx.fillStyle = 'rgba(250, 204, 21, 0.38)';
      ctx.beginPath();
      ctx.moveTo(handsX, handsY);
      ctx.lineTo(-dir * 16, -132);
      ctx.lineTo(batTipX, batTipY);
      ctx.closePath();
      ctx.fill();
    } else {
      handsX = dir * 20;
      handsY = -88;
      batTipX = dir * 52;
      batTipY = -132;
    }

    // Arms reaching to handle
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(dir * 14, -86);
    ctx.lineTo(handsX, handsY);
    ctx.stroke();

    // Two-tone Pro Maple Bat
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.moveTo(handsX, handsY);
    ctx.lineTo((handsX + batTipX) * 0.45, (handsY + batTipY) * 0.45);
    ctx.stroke();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 8.2;
    ctx.beginPath();
    ctx.moveTo((handsX + batTipX) * 0.45, (handsY + batTipY) * 0.45);
    ctx.lineTo(batTipX, batTipY);
    ctx.stroke();

    // White batting gloves
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(handsX, handsY, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 3D Fielder / Runner in Stadium view
    const bob = Math.abs(Math.sin(Date.now() * 0.012)) * 3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-3, -12 - bob);
    ctx.lineTo(-4, 0);
    ctx.moveTo(3, -12 - bob);
    ctx.lineTo(4, -bob);
    ctx.stroke();

    ctx.fillStyle = jerseyColor;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-7, -25 - bob, 14, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -30 - bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(0, -31.5 - bob, 5.2, Math.PI, 0);
    ctx.fill();
  }

  ctx.restore();
}

// 3D Sunny Dodger Stadium Duel Camera
function drawRivalsDuelCameraDay(ctx, W, H) {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const batterTeam = RG.userRole === 'batter' ? uTeam : oTeam;
  const pitcherTeam = RG.userRole === 'pitcher' ? uTeam : oTeam;
  const batter = getCurrentBatterInfo();
  const pitcher = getCurrentPitcherInfo();

  // 1. California Dodger Blue Sunny Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 210);
  skyGrad.addColorStop(0, '#2563eb');
  skyGrad.addColorStop(0.45, '#60a5fa');
  skyGrad.addColorStop(0.85, '#bae6fd');
  skyGrad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, 210);

  // Soft California Summer Cumulus Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  [[120, 48, 65, 22], [320, 36, 85, 26], [680, 52, 95, 28], [860, 42, 70, 20]].forEach(([cx, cy, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Center Field Batter's Eye, Dual Flagpoles (USA & California Flags!) & Palm Trees
  const cx = W * 0.48;

  // Palm Trees behind outfield pavilion (Signature Dodger Stadium feature!)
  const drawPalm = (px, py, h) => {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + 4, py - h * 0.6, px + 8, py - h);
    ctx.stroke();

    ctx.fillStyle = '#15803d';
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3;
      ctx.beginPath();
      ctx.ellipse(px + 8 + Math.cos(ang) * 12, py - h + Math.sin(ang) * 8, 12, 4, ang, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  [cx - 240, cx - 180, cx - 145, cx + 145, cx + 185, cx + 240].forEach((px, idx) => {
    drawPalm(px, 145, 42 + (idx % 3) * 6);
  });

  // Centerfield Batter's Eye Structure
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 75, 120, 150, 45);

  // Tall Dual Flagpoles flying American Flag & California Flag (matching image!)
  // Flagpole 1: USA Flag
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, 145);
  ctx.lineTo(cx - 20, 68);
  ctx.stroke();
  // USA flag rectangle with red/white stripes & blue canton
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(cx - 19, 72, 28, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 19, 75, 28, 3);
  ctx.fillRect(cx - 19, 81, 28, 3);
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(cx - 19, 72, 12, 8);

  // Flagpole 2: California / Dodgers Flag
  ctx.beginPath();
  ctx.moveTo(cx + 42, 145);
  ctx.lineTo(cx + 42, 68);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + 43, 72, 28, 16);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(cx + 43, 85, 28, 3);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(cx + 52, 77, 8, 4);

  // Left Scoreboard / Billboard with "RIVALS" (Exact match to reference image!)
  const lbX = 40, lbY = 95, lbW = 195, lbH = 68;
  ctx.fillStyle = '#005A9C';
  ctx.fillRect(lbX, lbY, lbW, lbH);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(lbX, lbY, lbW, lbH);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RIVALS 3D', lbX + lbW / 2, lbY + 34);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('★ MLB OFFICIAL LICENSED • v2.7.0 ★', lbX + lbW / 2, lbY + 52);

  // Right Outfield Dodger Stadium Hexagonal Lineup Scoreboard (Exact match to reference image!)
  const rbX = W - 235, rbY = 70, rbW = 195, rbH = 92;
  ctx.fillStyle = '#005A9C';
  ctx.beginPath();
  ctx.roundRect(rbX, rbY, rbW, rbH, 8);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(rbX + 4, rbY + 4, rbW - 8, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 10px sans-serif';
  ctx.fillText('DODGER STADIUM LINEUP', rbX + rbW / 2, rbY + 16);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('1. BETTS SS     6. HERNANDEZ CF', rbX + rbW / 2, rbY + 34);
  ctx.fillText('2. OHTANI DH    7. LUX 2B', rbX + rbW / 2, rbY + 48);
  ctx.fillText('3. FREEMAN 1B   8. TAYLOR LF', rbX + rbW / 2, rbY + 62);
  ctx.fillText('4. TEOSCAR RF   9. BARNES C', rbX + rbW / 2, rbY + 76);

  // 3. Multi-tier Sunlit Dodger Stadium Seating & Spectators (Yellow, Blue, White)
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, 142);
  ctx.quadraticCurveTo(cx, 162, W, 142);
  ctx.lineTo(W, 192);
  ctx.lineTo(0, 192);
  ctx.closePath();
  ctx.fill();

  for (let row = 0; row < 5; row++) {
    const ry = 148 + row * 8;
    ctx.strokeStyle = ['#005A9C', '#facc15', '#ef4444', '#005A9C', '#f8fafc'][row];
    ctx.lineWidth = 4;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(10, ry);
    ctx.quadraticCurveTo(cx, ry + 12, W - 10, ry);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 4. Outfield Green Padded Wall with Yellow Home Run Line & Distance Markers
  ctx.fillStyle = '#166534';
  ctx.fillRect(0, 185, W, 22);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 185);
  ctx.lineTo(W, 185);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 10.5px sans-serif';
  ctx.fillText('330 FT', 90, 199);
  ctx.fillText('385 FT', 270, 199);
  ctx.fillText('395 FT', cx, 199);
  ctx.fillText('385 FT', 700, 199);
  ctx.fillText('330 FT', 880, 199);

  // 5. Sunlit Green Field with Mower Stripes
  const baseY = RG.duelCamAngle === 'batter_pov' ? 430 : (RG.duelCamAngle === 'skycam' ? 448 : 412);
  const grassGrad = ctx.createLinearGradient(0, 207, 0, H);
  grassGrad.addColorStop(0, '#22c55e');
  grassGrad.addColorStop(0.4, '#16a34a');
  grassGrad.addColorStop(1, '#15803d');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 207, W, H - 207);

  // Radial Mower Cut Patterns
  for (let s = -7; s <= 7; s += 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.beginPath();
    ctx.moveTo(cx + s * 24, 207);
    ctx.lineTo(cx + (s + 1) * 24, 207);
    ctx.lineTo(cx + (s + 1) * 155, H);
    ctx.lineTo(cx + s * 155, H);
    ctx.closePath();
    ctx.fill();
  }

  // 3D Projection function for Home Plate Duel View (Supports 4 Broadcast Camera Angles!)
  const proj = (x, y, z) => {
    if (RG.duelCamAngle === 'batter_pov') {
      const depth = Math.max(0.95, 15.65 - y);
      const scale = 475 / depth;
      return {
        px: W * 0.50 + x * scale,
        py: baseY - (z - 0.58) * scale - (14.0 - y) * 2.1,
        scale
      };
    } else if (RG.duelCamAngle === 'pitcher_pov') {
      const depth = Math.max(1.15, 16.2 - y);
      const scale = 395 / depth;
      return {
        px: W * 0.46 + x * scale,
        py: baseY - (z - 0.52) * scale - (14.0 - y) * 4.8,
        scale
      };
    } else if (RG.duelCamAngle === 'skycam') {
      const depth = Math.max(1.20, 16.5 - y);
      const scale = 410 / depth;
      return {
        px: cx + x * scale,
        py: baseY - (z - 0.50) * scale - (14.0 - y) * 6.2,
        scale
      };
    }
    const depth = Math.max(1.10, 16.0 - y);
    const scale = 430 / depth;
    return {
      px: cx + x * scale,
      py: baseY - (z - 0.55) * scale - (14.0 - y) * 3.4,
      scale
    };
  };

  // Infield Clay & Pitcher's Mound
  const moundP = proj(0, 0, 0);
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(cx, moundP.py + 8, 380, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  const moundGrad = ctx.createRadialGradient(moundP.px, moundP.py - 3, 6, moundP.px, moundP.py + 4, 88);
  moundGrad.addColorStop(0, '#d97706');
  moundGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = moundGrad;
  ctx.beginPath();
  ctx.ellipse(moundP.px, moundP.py + 2, 86, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(moundP.px - 14, moundP.py - 2, 28, 3.5);

  // Warm Reddish Clay around Home Plate (Matching Reference Image!)
  const dirtGrad = ctx.createRadialGradient(cx, 452, 40, cx, 452, 420);
  dirtGrad.addColorStop(0, '#c2410c');
  dirtGrad.addColorStop(1, '#9a3412');
  ctx.fillStyle = dirtGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 458, 410, 110, 0, 0, Math.PI * 2);
  ctx.fill();

  // White Chalk Foul Lines & Home Plate Area
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 45, 442);
  ctx.lineTo(0, 245);
  ctx.moveTo(cx + 45, 442);
  ctx.lineTo(W, 245);
  ctx.stroke();

  // White Chalk Batter's Boxes
  const hp = proj(0, 13.75, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.8;
  ctx.strokeRect(hp.px - 152, hp.py - 24, 95, 72); // RHB box
  ctx.strokeRect(hp.px + 57, hp.py - 24, 95, 72);  // LHB box

  // Home Plate Pentagon
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hp.px - 40, hp.py);
  ctx.lineTo(hp.px + 40, hp.py);
  ctx.lineTo(hp.px + 40, hp.py + 16);
  ctx.lineTo(hp.px, hp.py + 32);
  ctx.lineTo(hp.px - 40, hp.py + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Draw 3D Pitcher on Mound
  const pitchAnim = RG.phase === 'pitch_flight'
    ? 0.45 + Math.min(0.55, (RG.pitchIdx / 18) * 0.55)
    : (RG.phase === 'windup' ? RG.windupProgress * 0.45 : (RG.phase === 'pinpoint_ring' ? (1 - RG.ringRadius) * 0.45 : 0));
  draw3DBaseballPlayer(ctx, {
    x: moundP.px,
    y: moundP.py,
    scale: 1.08,
    jerseyColor: pitcherTeam.jerseyHome,
    accentColor: pitcherTeam.primary,
    numberColor: pitcherTeam.secondary,
    capColor: pitcherTeam.capColor,
    number: pitcher.num,
    role: 'pitcher',
    animPhase: pitchAnim
  });

  // 7. 3D Strike Zone with Red Hot-Zones (Exact match to reference image!)
  const szTL = proj(-0.33, 14.0, 1.02);
  const szBR = proj(0.33, 14.0, 0.44);
  const szW = szBR.px - szTL.px;
  const szH = szBR.py - szTL.py;
  const cellW = szW / 3;
  const cellH = szH / 3;

  // Red Hot Zones (T-shape hot zone just like in user's MLB Rivals screenshot!)
  const hotZones = [
    [true, true, true],
    [false, true, false],
    [false, true, false]
  ];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (hotZones[r][c]) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.58)'; // Vibrant ruby red
        ctx.fillRect(szTL.px + c * cellW, szTL.py + r * cellH, cellW, cellH);
      }
    }
  }

  // Crisp White Outer Strike Zone Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(szTL.px, szTL.py, szW, szH);

  // Subtle 9-Grid Dividers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(szTL.px + cellW * i, szTL.py);
    ctx.lineTo(szTL.px + cellW * i, szTL.py + szH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(szTL.px, szTL.py + cellH * i);
    ctx.lineTo(szTL.px + szW, szTL.py + cellH * i);
    ctx.stroke();
  }

  // 8. Pitcher Pinpoint Release Ring (Pitcher Mode) or Windup Target Preview (Batter Mode)
  const pInfo = RIVALS_PITCHES[RG.selectedPitch] || RIVALS_PITCHES['4seam'];
  if (RG.userRole === 'pitcher' && (RG.phase === 'pre_pitch' || RG.phase === 'pinpoint_ring')) {
    const finalAim = proj(RG.aimX, 14.0, RG.aimZ);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(finalAim.px, finalAim.py, 25, 0, Math.PI * 2);
    ctx.stroke();

    if (RG.phase === 'pinpoint_ring') {
      const shrinkPx = Math.max(4, RG.ringRadius * 88);
      const isSweet = Math.abs(RG.ringRadius - 0.28) <= 0.16;
      ctx.strokeStyle = isSweet ? '#4ade80' : '#38bdf8';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(finalAim.px, finalAim.py, shrinkPx, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (RG.phase === 'windup') {
    // MLB Rivals Pre-Pitch Windup Ring: Show batter that pitch is about to be released!
    const previewPr = proj(RG.aimX, 14.0, RG.aimZ);
    const windupR = Math.max(22, (1 - RG.windupProgress) * 60 + 24);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(previewPr.px, previewPr.py, windupR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 9. Ball Flight, Ground Shadow & MLB Rivals Timing Ring
  if (RG.pitchPts.length > 0 && (RG.phase === 'pitch_flight' || RG.phase === 'contact_slowmo')) {
    const maxI = Math.min(Math.floor(RG.pitchIdx), RG.pitchPts.length - 1);

    for (let i = 1; i <= maxI; i++) {
      const p0 = RG.pitchPts[i - 1];
      const p1 = RG.pitchPts[i];
      const pr0 = proj(p0.x, p0.y, p0.z);
      const pr1 = proj(p1.x, p1.y, p1.z);

      const sh0 = proj(p0.x, p0.y, 0);
      const sh1 = proj(p1.x, p1.y, 0);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sh0.px, sh0.py);
      ctx.lineTo(sh1.px, sh1.py);
      ctx.stroke();

      ctx.strokeStyle = p1.bounced ? '#34d399' : pInfo.color;
      ctx.lineWidth = Math.max(2, (pr1.scale / 145) * 5.8);
      ctx.beginPath();
      ctx.moveTo(pr0.px, pr0.py);
      ctx.lineTo(pr1.px, pr1.py);
      ctx.stroke();
    }

    // MLB Rivals Signature Shrinking Timing Ring at Arrival Spot!
    const platePt = RG.pitchPts.find(p => p.y >= 13.85) || RG.pitchPts[RG.pitchPts.length - 1];
    const predPr = proj(platePt.x, 14.0, platePt.z);
    const curP = RG.pitchPts[maxI];
    const flightRatio = Math.min(1, curP.y / 13.65);

    if (RG.phase === 'pitch_flight') {
      const targetRingR = 22;
      const shrinkingR = Math.max(10, (1 - flightRatio) * 68 + targetRingR);
      const isSwingNowWindow = Math.abs(curP.y - 13.65) <= 2.3;

      // Target inner circle
      ctx.strokeStyle = isSwingNowWindow ? '#4ade80' : 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = isSwingNowWindow ? 3.5 : 2;
      ctx.beginPath();
      ctx.arc(predPr.px, predPr.py, targetRingR, 0, Math.PI * 2);
      ctx.stroke();

      // Shrinking outer timing ring
      ctx.strokeStyle = isSwingNowWindow ? '#4ade80' : 'rgba(250, 204, 21, 0.92)';
      ctx.lineWidth = isSwingNowWindow ? 4.5 : 3;
      ctx.beginPath();
      ctx.arc(predPr.px, predPr.py, shrinkingR, 0, Math.PI * 2);
      ctx.stroke();

      if (isSwingNowWindow && RG.userRole === 'batter' && !RG.swingTriggered) {
        ctx.fillStyle = '#4ade80';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 點擊揮棒 HIT!', predPr.px, predPr.py - targetRingR - 10);
      }
    }

    const curPr = proj(curP.x, curP.y, curP.z);
    const ballR = Math.max(5.5, (curPr.scale / 145) * 15.5);
    drawSpinningBaseball(ctx, curPr.px, curPr.py, ballR, maxI * 0.7, pInfo.color);
  }

  // 10. Draw 3D Batter Model (Freeman #5 or Ohtani #17 standing in LHB or RHB box)
  const isLHB = (batter.hand === 'L');
  const batterBoxX = isLHB ? hp.px + 108 : hp.px - 108;
  const batterBoxY = hp.py + 26;
  draw3DBaseballPlayer(ctx, {
    x: batterBoxX,
    y: batterBoxY,
    scale: 1.54,
    jerseyColor: batterTeam.jerseyHome,
    accentColor: batterTeam.primary,
    numberColor: batterTeam.secondary,
    capColor: batterTeam.capColor,
    number: batter.num,
    name: batter.num === '17' ? 'OHTANI' : (batter.num === '5' ? 'FREEMAN' : batter.name.split('(')[0]),
    role: isLHB ? 'batter_L' : 'batter_R',
    animPhase: RG.swingTriggered ? RG.swingAnimProgress : 0
  });

  // 11. Bat Reticle & Sweet Spot Cursor
  const batPr = proj(RG.batX, 14.0, RG.batZ);
  const outerRad = RG.swingPowerMode === 'contact' ? 46 : 38;
  ctx.strokeStyle = RG.swingTriggered ? '#facc15' : (RG.autoAimAssist ? '#38bdf8' : '#ffffff');
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(batPr.px, batPr.py, outerRad, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = RG.swingPowerMode === 'power' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.38)';
  ctx.beginPath();
  ctx.arc(batPr.px, batPr.py, 15, 0, Math.PI * 2);
  ctx.fill();

  // Contact Slow-Mo Shockwave & No-Doubt Home Run Admire Cam Overlay!
  if (RG.phase === 'contact_slowmo' && RG.lastContactInfo) {
    const cp = proj(RG.lastContactInfo.x, 14.0, RG.lastContactInfo.z);
    const elapsed = (RG.contactFlashMax || 22) - RG.contactFlashTimer;

    if (RG.lastContactInfo.isNoDoubtHR) {
      // Golden Spotlight Beam on Batter for No-Doubt HR Admire Cam!
      const spotGrad = ctx.createLinearGradient(batterBoxX, 0, batterBoxX, H);
      spotGrad.addColorStop(0, 'rgba(250, 204, 21, 0.32)');
      spotGrad.addColorStop(1, 'rgba(250, 204, 21, 0.04)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(batterBoxX - 45, 0);
      ctx.lineTo(batterBoxX + 45, 0);
      ctx.lineTo(batterBoxX + 135, H);
      ctx.lineTo(batterBoxX - 135, H);
      ctx.closePath();
      ctx.fill();

      // Dual Golden Shockwave Rings
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cp.px, cp.py, elapsed * 4.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cp.px, cp.py, Math.max(8, elapsed * 2.6), 0, Math.PI * 2);
      ctx.stroke();

      // Cinematic No-Doubt HR Statcast Badge
      const badgeW = 390, badgeH = 56;
      const badgeX = W / 2 - badgeW / 2, badgeY = 82;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = '900 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎥 NO-DOUBT HOME RUN! 確信步慢動作鏡頭', W / 2, badgeY + 23);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`擊球初速 ${RG.lastContactInfo.statcastKmh} km/h  |  發射仰角 ${RG.lastContactInfo.launchDeg}°  |  預估飛行 ${RG.lastContactInfo.estDistFt} FT`, W / 2, badgeY + 43);
    } else {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cp.px, cp.py, elapsed * 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Timing Bar on Left Edge
  drawRivalsTimingBar(ctx, 20, 195, 20, 190);
}

// Draw Authentic MLB Rivals Scorebug, Player Card & Bottom PLAY BALL Pill!
function drawRivalsOfficialHUD(ctx, W, H) {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const batter = getCurrentBatterInfo();
  const batterTeam = RG.userRole === 'batter' ? uTeam : oTeam;

  // 1. TOP-LEFT SCOREBUG (Exact match to reference image: SD 3 - 1 LAD, ▼ 6, 0-0, 1 OUT, Diamonds, RIVALS)
  const sbX = 14, sbY = 14, sbW = 280, sbH = 58;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sbX, sbY, sbW, sbH, 8);
  ctx.fill();
  ctx.stroke();

  // Team 1: SD (or Opponent)
  ctx.fillStyle = '#FFC425';
  ctx.font = '900 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(oTeam.shortName, sbX + 12, sbY + 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 20px sans-serif';
  ctx.fillText(RG.scoreCpu, sbX + 66, sbY + 29);

  // Score Separator
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('-', sbX + 88, sbY + 28);

  // Team 2: LAD (or User Team)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 20px sans-serif';
  ctx.fillText(RG.scoreUser, sbX + 104, sbY + 29);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 15px sans-serif';
  ctx.fillText(uTeam.shortName, sbX + 126, sbY + 28);

  // Base Runner Diamond inside Scorebug
  const dX = sbX + 225, dY = sbY + 24;
  const drawBaseDiamond = (bx, by, filled) => {
    ctx.fillStyle = filled ? '#facc15' : 'rgba(255,255,255,0.2)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, by - 6);
    ctx.lineTo(bx + 6, by);
    ctx.lineTo(bx, by + 6);
    ctx.lineTo(bx - 6, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawBaseDiamond(dX + 9, dY, RG.occupiedBases[0]);      // 1B
  drawBaseDiamond(dX, dY - 9, RG.occupiedBases[1]);      // 2B
  drawBaseDiamond(dX - 9, dY, RG.occupiedBases[2]);      // 3B

  // Lower Row: Inning, Count, Outs
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${RG.isTop ? '▲' : '▼'} ${RG.inning}`, sbX + 12, sbY + 48);
  ctx.fillText(`${RG.balls}-${RG.strikes}`, sbX + 78, sbY + 48);
  ctx.fillStyle = '#f87171';
  ctx.fillText(`${RG.outs} OUT`, sbX + 140, sbY + 48);

  // "RIVALS" Logo badge directly beneath scorebug
  ctx.fillStyle = 'rgba(0, 90, 156, 0.9)';
  ctx.beginPath();
  ctx.roundRect(sbX, sbY + sbH + 2, 92, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RIVALS v2.7', sbX + 46, sbY + sbH + 15);

  // 2. LEFT PLAYER CARD & MATCHUP STAT BOX (Exact match to reference image!)
  const cardX = 14, cardY = 145, cardW = 120, cardH = 175;
  // Card outer frame with Signature purple/gold border
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 8);
  ctx.fill();
  ctx.stroke();

  // Top Left OVR badge & Position
  ctx.fillStyle = '#7e22ce';
  ctx.font = '900 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(batter.ovr, cardX + 8, cardY + 22);

  ctx.fillStyle = batterTeam.primary;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${batterTeam.shortName} ${batter.pos}`, cardX + 8, cardY + 38);

  // Player Avatar Silhouette / Portrait
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(cardX + cardW / 2 + 10, cardY + 68, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = batterTeam.capColor;
  ctx.beginPath();
  ctx.arc(cardX + cardW / 2 + 10, cardY + 65, 25, Math.PI, 0);
  ctx.fill();
  // Jersey bust
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = batterTeam.primary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX + cardW / 2 - 18, cardY + 86, 56, 55, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = batterTeam.primary;
  ctx.font = 'bold 9px cursive';
  ctx.fillText(batterTeam.shortName, cardX + cardW / 2 + 10, cardY + 108);

  // Card Bottom Name Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cardX + 2, cardY + cardH - 24, cardW - 4, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(batter.short, cardX + cardW / 2, cardY + cardH - 8);

  // Attached Live Matchup Stats Panel
  const panelX = cardX + cardW + 4, panelY = cardY + 28, panelW = 230, panelH = 120;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 8);
  ctx.fill();
  ctx.stroke();

  // Matchup Today Log
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`今日紀錄  ${batter.hitLog || '2打數1安打'}`, panelX + 12, panelY + 18);

  // Stats columns (打擊率 / 全壘打 / 打點)
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText('打擊率', panelX + 16, panelY + 36);
  ctx.fillText('全壘打', panelX + 88, panelY + 36);
  ctx.fillText('打點', panelX + 160, panelY + 36);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(batter.avg || '.310', panelX + 16, panelY + 52);
  ctx.fillText(batter.hr || '54', panelX + 94, panelY + 52);
  ctx.fillText(batter.rbi || '130', panelX + 164, panelY + 52);

  // Signature Skill Tags (初球攻略 / 開路先鋒 / 拉打)
  const skills = ['★ 初球攻略', '★ 開路先鋒', '★ 勁旅強拉'];
  skills.forEach((sk, idx) => {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(panelX + 8, panelY + 62 + idx * 18, panelW - 16, 15);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillText(sk, panelX + 14, panelY + 73 + idx * 18);
  });

  // 3. TOP-RIGHT BROADCAST BUTTONS (Speed/Tempo, 打者ON, 投手ON, Cam Angle)
  const trX = W - 265, trY = 14;

  // Pitch Tempo / Speed Preset Button (Clickable!)
  const spdLabel = RG.pitchSpeedPreset === 'slow' ? '🐢慢速' : (RG.pitchSpeedPreset === 'normal' ? '⚾標準' : '🔥快速');
  ctx.fillStyle = RG.pitchSpeedPreset === 'slow' ? '#0284c7' : (RG.pitchSpeedPreset === 'normal' ? '#d97706' : '#e11d48');
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(trX, trY, 84, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 10.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`節奏:${spdLabel}`, trX + 42, trY + 18);

  // Auto Batter Toggle Button (打者 ON / OFF)
  ctx.fillStyle = RG.autoBatter ? '#10b981' : 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(trX + 90, trY, 52, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('打者', trX + 116, trY + 12);
  ctx.fillText(RG.autoBatter ? 'ON' : 'OFF', trX + 116, trY + 24);

  // Auto Pitcher Toggle Button (投手 ON / OFF)
  ctx.fillStyle = RG.autoPitcher ? '#10b981' : 'rgba(30, 41, 59, 0.85)';
  ctx.beginPath();
  ctx.roundRect(trX + 148, trY, 52, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('投手', trX + 174, trY + 12);
  ctx.fillText(RG.autoPitcher ? 'ON' : 'OFF', trX + 174, trY + 24);

  // Camera Angle Switcher icon
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.beginPath();
  ctx.roundRect(trX + 206, trY, 44, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px sans-serif';
  const camShort = RG.duelCamAngle === 'batter_pov' ? '🎥POV' : (RG.duelCamAngle === 'pitcher_pov' ? '🎥投手' : (RG.duelCamAngle === 'skycam' ? '🎥高空' : '🎥轉播'));
  ctx.fillText(camShort, trX + 228, trY + 18);

  // 4. BOTTOM-CENTER "PLAY BALL" SEAM PILL, BROADCAST COUNTDOWN, OR "ONE-TAP SWING" GUIDE!
  if (RG.phase === 'pre_pitch' || RG.phase === 'windup' || RG.phase === 'pinpoint_ring') {
    const isWaiting = (RG.phase === 'pre_pitch' && Number(RG.prePitchSecondsLeft) > 0);
    const pillW = isWaiting ? 310 : 240, pillH = 36;
    const pillX = W / 2 - pillW / 2, pillY = H - 56;

    if (isWaiting) {
      // Sleek Glass Tempo Countdown Pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱️ 投手準備就位中 (${RG.prePitchSecondsLeft}s) • 點擊立即投球`, W / 2, pillY + 23);
    } else {
      // Glossy pill body
      const pGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 18);
      ctx.fill();
      ctx.stroke();

      // Red baseball seam stitching at ends
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      for (let s = 0; s < 5; s++) {
        ctx.beginPath();
        ctx.moveTo(pillX + 12 + s * 4, pillY + 10 + (s % 2) * 14);
        ctx.lineTo(pillX + 16 + s * 4, pillY + 16 + (s % 2) * 14);
        ctx.stroke();
      }
      for (let s = 0; s < 5; s++) {
        ctx.beginPath();
        ctx.moveTo(pillX + pillW - 32 + s * 4, pillY + 10 + (s % 2) * 14);
        ctx.lineTo(pillX + pillW - 28 + s * 4, pillY + 16 + (s % 2) * 14);
        ctx.stroke();
      }

      ctx.fillStyle = '#7e22ce';
      ctx.font = '900 14px sans-serif';
      ctx.textAlign = 'center';
      const pillText = RG.phase === 'pinpoint_ring'
        ? '🎯 鎖定放球點'
        : (RG.phase === 'windup' ? '👀 看準縮圈重合時點擊！' : 'PLAY BALL・點擊開球');
      ctx.fillText(pillText, W / 2, pillY + 23);
    }
  } else if (RG.phase === 'pitch_flight' && RG.userRole === 'batter' && !RG.swingTriggered) {
    const pillW = 280, pillH = 34;
    const pillX = W / 2 - pillW / 2, pillY = H - 54;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 17);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 甜蜜點已自動鎖定！圈圈縮小重合時點一下揮棒', W / 2, pillY + 22);
  }

  // 5. BOTTOM-RIGHT MLB WATERMARK (Matching reference image with version)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('iPLAYERS ⚾ MLB Rivals 3D v2.7.0', W - 18, H - 16);
}

function drawRivalsTimingBar(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  const sweetY = y + h * 0.72;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.48)';
  ctx.fillRect(x + 2, sweetY - 18, w - 4, 36);

  if (RG.pitchPts.length > 0) {
    const ratio = Math.min(1, RG.pitchIdx / (RG.pitchPts.length * 0.92));
    const markerY = y + 12 + ratio * (h - 24);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x + w / 2, markerY, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('時機', x + w / 2, y - 8);
}

// 3D Stadium Play View (Ball in play - Dynamic TV Broadcast Camera)
function drawRivalsStadiumCamera3D(ctx, W, H) {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const offenseTeam = RG.userRole === 'batter' ? uTeam : oTeam;
  const defenseTeam = RG.userRole === 'pitcher' ? uTeam : oTeam;

  // 1. DYNAMIC BROADCAST CAMERA TRACKING (Smoothly pans, tilts and follows the ball)
  const ball = RG.ballPos || { x: 0, y: 0, z: 0 };
  const targetCamX = Math.max(-28, Math.min(28, ball.x * 0.45));
  const targetCamY = Math.max(0, Math.min(52, ball.y * 0.32));
  const targetCamZ = Math.max(0, Math.min(22, ball.z * 0.40));
  if (RG.camX === undefined) { RG.camX = 0; RG.camY = 0; RG.camZ = 0; }
  RG.camX += (targetCamX - RG.camX) * 0.08;
  RG.camY += (targetCamY - RG.camY) * 0.08;
  RG.camZ += (targetCamZ - RG.camZ) * 0.08;

  const hx = W / 2 - RG.camX * 6.5;
  const hy = H * 0.88 + RG.camY * 2.8 + RG.camZ * 2.2;
  const zoom = 1.0 + Math.min(0.28, ball.y / 130);

  const toScreen3D = (x, y, z = 0) => {
    const depthScale = 1 - (y / 185);
    const scX = 6.8 * Math.max(0.48, depthScale) * zoom;
    const scY = 4.75 * Math.max(0.50, depthScale) * zoom;
    const groundX = hx + x * scX;
    const groundY = hy - y * scY;
    return {
      px: groundX,
      py: groundY - z * (5.5 * Math.max(0.50, depthScale) * zoom),
      groundY,
      scale: Math.max(0.50, depthScale) * zoom
    };
  };

  // 2. DAYTIME SUNNY CALIFORNIA BLUE SKY
  const skyH = Math.max(140, toScreen3D(0, 78, 18).py);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
  skyGrad.addColorStop(0, '#1d4ed8');
  skyGrad.addColorStop(0.55, '#60a5fa');
  skyGrad.addColorStop(1, '#bae6fd');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Sunlight flare top-left
  const sunFlare = ctx.createRadialGradient(100, 45, 10, 100, 45, 160);
  sunFlare.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
  sunFlare.addColorStop(0.4, 'rgba(253, 224, 71, 0.25)');
  sunFlare.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sunFlare;
  ctx.beginPath();
  ctx.arc(100, 45, 160, 0, Math.PI * 2);
  ctx.fill();

  // Drifting Cumulus Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  [
    { cx: W * 0.18, cy: 38, r: 28 },
    { cx: W * 0.22, cy: 30, r: 38 },
    { cx: W * 0.27, cy: 36, r: 26 },
    { cx: W * 0.72, cy: 45, r: 32 },
    { cx: W * 0.77, cy: 36, r: 42 },
    { cx: W * 0.82, cy: 44, r: 28 }
  ].forEach(c => {
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. DODGER STADIUM OUTFIELD PAVILIONS & ARCHITECTURE
  // Left Field Pavilion (Wavy white canopy & blue seats)
  const lfPavP0 = toScreen3D(-58, 76, 0);
  const lfPavP1 = toScreen3D(-16, 76, 0);
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(lfPavP0.px - 30, lfPavP0.groundY);
  ctx.lineTo(lfPavP0.px - 30, lfPavP0.groundY - 38);
  ctx.lineTo(lfPavP1.px, lfPavP1.groundY - 32);
  ctx.lineTo(lfPavP1.px, lfPavP1.groundY);
  ctx.closePath();
  ctx.fill();

  // Wavy Canopy Roof
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lfPavP0.px - 34, lfPavP0.groundY - 38);
  for (let wX = lfPavP0.px - 34; wX <= lfPavP1.px; wX += 16) {
    ctx.quadraticCurveTo(wX + 8, lfPavP0.groundY - 44, wX + 16, lfPavP0.groundY - 38);
  }
  ctx.lineTo(lfPavP1.px, lfPavP1.groundY - 30);
  ctx.lineTo(lfPavP0.px - 34, lfPavP0.groundY - 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Field Pavilion
  const rfPavP0 = toScreen3D(16, 76, 0);
  const rfPavP1 = toScreen3D(58, 76, 0);
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(rfPavP0.px, rfPavP0.groundY);
  ctx.lineTo(rfPavP0.px, rfPavP0.groundY - 32);
  ctx.lineTo(rfPavP1.px + 30, rfPavP1.groundY - 38);
  ctx.lineTo(rfPavP1.px + 30, rfPavP1.groundY);
  ctx.closePath();
  ctx.fill();

  // Wavy Canopy Roof RF
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(rfPavP0.px, rfPavP0.groundY - 32);
  for (let wX = rfPavP0.px; wX <= rfPavP1.px + 30; wX += 16) {
    ctx.quadraticCurveTo(wX + 8, rfPavP0.groundY - 44, wX + 16, rfPavP0.groundY - 38);
  }
  ctx.lineTo(rfPavP1.px + 30, rfPavP1.groundY - 30);
  ctx.lineTo(rfPavP0.px, rfPavP0.groundY - 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center Field Plaza: Giant Scoreboard & Hexagonal Lineup Board
  const cfP0 = toScreen3D(-16, 78, 0);
  const cfP1 = toScreen3D(16, 78, 0);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cfP0.px - 4, cfP0.groundY - 55, (cfP1.px - cfP0.px) + 8, 55);

  // Scoreboard Screen: "DODGERS" & live text
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(cfP0.px + 4, cfP0.groundY - 50, (cfP1.px - cfP0.px) - 8, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚾ DODGER STADIUM • STATCAST 3D', (cfP0.px + cfP1.px) / 2, cfP0.groundY - 32);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('OFFICIAL BROADCAST TRACKER', (cfP0.px + cfP1.px) / 2, cfP0.groundY - 20);

  // California Palm Trees behind Pavilion Walls
  [-62, -50, -38, -25, 25, 38, 50, 62].forEach(pX => {
    const ptSp = toScreen3D(pX, 80, 0);
    // Trunk
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ptSp.px, ptSp.groundY - 30);
    ctx.quadraticCurveTo(ptSp.px + (pX < 0 ? -4 : 4), ptSp.groundY - 60, ptSp.px, ptSp.groundY - 78);
    ctx.stroke();
    // Palm Fronds
    ctx.fillStyle = '#15803d';
    const topY = ptSp.groundY - 78;
    for (let f = 0; f < 6; f++) {
      const fAng = (f * Math.PI) / 3;
      ctx.beginPath();
      ctx.ellipse(ptSp.px + Math.cos(fAng) * 12, topY + Math.sin(fAng) * 6, 12, 4.5, fAng, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Dual Flagpoles (USA & CA Flags)
  const flagP = toScreen3D(0, 80, 0);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(flagP.px - 14, flagP.groundY - 55);
  ctx.lineTo(flagP.px - 14, flagP.groundY - 95);
  ctx.moveTo(flagP.px + 14, flagP.groundY - 55);
  ctx.lineTo(flagP.px + 14, flagP.groundY - 95);
  ctx.stroke();
  // USA flag
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(flagP.px - 14, flagP.groundY - 95, 14, 9);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(flagP.px - 14, flagP.groundY - 95, 6, 5);
  // CA flag
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(flagP.px + 14, flagP.groundY - 95, 14, 9);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(flagP.px + 14, flagP.groundY - 88, 14, 2);

  // 4. EMERALD OUTFIELD TURF WITH ALTERNATING MOWING STRIPES
  const outWallRad = 74.0;
  // Draw base green field
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, lfPavP0.groundY, W, H - lfPavP0.groundY);

  // Fan-shaped alternating lawn mowing stripes radiating from behind home
  for (let sDeg = -45; sDeg < 45; sDeg += 6) {
    const isLight = Math.floor((sDeg + 45) / 6) % 2 === 0;
    ctx.fillStyle = isLight ? '#22c55e' : '#16a34a';
    ctx.beginPath();
    const hPt = toScreen3D(0, 0, 0);
    ctx.moveTo(hPt.px, hPt.groundY);
    const r0 = (sDeg * Math.PI) / 180;
    const r1 = ((sDeg + 6) * Math.PI) / 180;
    const sp0 = toScreen3D(outWallRad * Math.sin(r0), outWallRad * Math.cos(r0), 0);
    const sp1 = toScreen3D(outWallRad * Math.sin(r1), outWallRad * Math.cos(r1), 0);
    ctx.lineTo(sp0.px, sp0.groundY);
    ctx.lineTo(sp1.px, sp1.groundY);
    ctx.closePath();
    ctx.fill();
  }

  // 5. TERRA-COTTA WARNING TRACK (Clay strip along the outfield fence)
  ctx.fillStyle = '#9a3412';
  ctx.beginPath();
  for (let deg = -45; deg <= 45; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const sp = toScreen3D(outWallRad * Math.sin(rad), outWallRad * Math.cos(rad), 0);
    if (deg === -45) ctx.moveTo(sp.px, sp.groundY);
    else ctx.lineTo(sp.px, sp.groundY);
  }
  for (let deg = 45; deg >= -45; deg -= 2) {
    const rad = (deg * Math.PI) / 180;
    const sp = toScreen3D((outWallRad - 4.8) * Math.sin(rad), (outWallRad - 4.8) * Math.cos(rad), 0);
    ctx.lineTo(sp.px, sp.groundY);
  }
  ctx.closePath();
  ctx.fill();

  // 6. ROYAL BLUE PADDED OUTFIELD WALL (Curved arc with distance markers)
  ctx.strokeStyle = '#005a9c';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let deg = -45; deg <= 45; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const sp = toScreen3D(outWallRad * Math.sin(rad), outWallRad * Math.cos(rad), 0);
    if (deg === -45) ctx.moveTo(sp.px, sp.groundY - 3);
    else ctx.lineTo(sp.px, sp.groundY - 3);
  }
  ctx.stroke();

  // Yellow Top Rail on Outfield Wall
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let deg = -45; deg <= 45; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const sp = toScreen3D(outWallRad * Math.sin(rad), outWallRad * Math.cos(rad), 0);
    if (deg === -45) ctx.moveTo(sp.px, sp.groundY - 8);
    else ctx.lineTo(sp.px, sp.groundY - 8);
  }
  ctx.stroke();

  // Yellow Distance Markers on Wall (330, 385, 395, 385, 330)
  const distSigns = [
    { deg: -42, text: '330' },
    { deg: -22, text: '385' },
    { deg: 0, text: '395' },
    { deg: 22, text: '385' },
    { deg: 42, text: '330' }
  ];
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  distSigns.forEach(ds => {
    const rad = (ds.deg * Math.PI) / 180;
    const sp = toScreen3D(outWallRad * Math.sin(rad), outWallRad * Math.cos(rad), 0);
    ctx.fillText(ds.text, sp.px, sp.groundY - 2);
  });

  // Yellow Foul Poles on LF & RF Lines
  const lfPole = toScreen3D(outWallRad * Math.sin((-45 * Math.PI) / 180), outWallRad * Math.cos((-45 * Math.PI) / 180), 0);
  const rfPole = toScreen3D(outWallRad * Math.sin((45 * Math.PI) / 180), outWallRad * Math.cos((45 * Math.PI) / 180), 0);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(lfPole.px, lfPole.groundY);
  ctx.lineTo(lfPole.px, lfPole.groundY - 58);
  ctx.moveTo(rfPole.px, rfPole.groundY);
  ctx.lineTo(rfPole.px, rfPole.groundY - 58);
  ctx.stroke();

  // 7. INFIELD CLAY DIAMOND & WHITE FOUL LINES
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  const homeSp = toScreen3D(0, -2, 0);
  ctx.moveTo(homeSp.px, homeSp.groundY);
  for (let deg = -45; deg <= 45; deg += 3) {
    const rad = (deg * Math.PI) / 180;
    const sp = toScreen3D(26.5 * Math.sin(rad), 26.5 * Math.cos(rad), 0);
    ctx.lineTo(sp.px, sp.groundY);
  }
  ctx.closePath();
  ctx.fill();

  // Diamond Grass Infield Island
  const b1 = toScreen3D(13.5, 13.5, 0);
  const b2 = toScreen3D(0, 27.0, 0);
  const b3 = toScreen3D(-13.5, 13.5, 0);
  const bHome = toScreen3D(0, 0, 0);
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.moveTo(bHome.px, bHome.groundY - 12);
  ctx.lineTo(b1.px - 12, b1.groundY);
  ctx.lineTo(b2.px, b2.groundY + 10);
  ctx.lineTo(b3.px + 12, b3.groundY);
  ctx.closePath();
  ctx.fill();

  // Pitcher's Mound Dirt Circle & Rubber
  const moundSp = toScreen3D(0, 18.4, 0);
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(moundSp.px, moundSp.groundY, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(moundSp.px - 4, moundSp.groundY - 2, 8, 3);

  // White Baselines Extending from Home to Foul Poles
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bHome.px, bHome.groundY);
  ctx.lineTo(lfPole.px, lfPole.groundY);
  ctx.moveTo(bHome.px, bHome.groundY);
  ctx.lineTo(rfPole.px, rfPole.groundY);
  ctx.stroke();

  // White Base Bags
  [b1, b2, b3, bHome].forEach((b) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(b.px - 7, b.groundY - 5, 14, 10);
    ctx.strokeRect(b.px - 7, b.groundY - 5, 14, 10);
  });

  // 8. STATCAST 3D TRAJECTORY RIBBON, SHADOW & LANDING BULLSEYE
  if (RG.fieldPts.length > 0) {
    const maxI = Math.min(RG.fieldIdx, RG.fieldPts.length - 1);

    // Ground Drop Shadow directly under ball path
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= maxI; i++) {
      const p = RG.fieldPts[i];
      const sp = toScreen3D(p.x, p.y, 0);
      if (i === 0) ctx.moveTo(sp.px, sp.groundY);
      else ctx.lineTo(sp.px, sp.groundY);
    }
    ctx.stroke();

    // 3D Statcast Glowing Ribbon Trajectory
    for (let i = 1; i <= maxI; i++) {
      const p0 = RG.fieldPts[i - 1];
      const p1 = RG.fieldPts[i];
      const s0 = toScreen3D(p0.x, p0.y, p0.z);
      const s1 = toScreen3D(p1.x, p1.y, p1.z);

      if (p1.state === 'air') {
        // Outer Glow
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s0.px, s0.py);
        ctx.lineTo(s1.px, s1.py);
        ctx.stroke();

        // Inner Sharp Golden-White Core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(s0.px, s0.py);
        ctx.lineTo(s1.px, s1.py);
        ctx.stroke();
      } else if (p1.state === 'bouncing') {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(s0.px, s0.py);
        ctx.lineTo(s1.px, s1.py);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(s0.px, s0.py);
        ctx.lineTo(s1.px, s1.py);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // PROJECTED STATCAST LANDING BULLSEYE TARGET (Pulsing concentric circles)
    if (RG.projectedLanding && RG.ballPos && RG.ballPos.state === 'air') {
      const landSp = toScreen3D(RG.projectedLanding.x, RG.projectedLanding.y, 0);
      const pulse = (Math.sin(Date.now() / 140) + 1) * 0.5;

      // Outer ring
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(landSp.px, landSp.groundY, 18 + pulse * 6, 8 + pulse * 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      ctx.ellipse(landSp.px, landSp.groundY, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(landSp.px - 22, landSp.groundY);
      ctx.lineTo(landSp.px + 22, landSp.groundY);
      ctx.moveTo(landSp.px, landSp.groundY - 10);
      ctx.lineTo(landSp.px, landSp.groundY + 10);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('落點預測', landSp.px, landSp.groundY - 14);
    }
  }

  // 9. DRAW DEFENSIVE FIELDERS & OFFENSIVE RUNNERS
  RG.fielders.forEach(f => {
    const fp = toScreen3D(f.x, f.y, 0);
    draw3DBaseballPlayer(ctx, {
      x: fp.px,
      y: fp.groundY,
      scale: fp.scale * 0.95,
      jerseyColor: defenseTeam.jerseyHome,
      accentColor: defenseTeam.primary,
      numberColor: defenseTeam.secondary,
      capColor: defenseTeam.capColor,
      number: f.num,
      role: 'fielder'
    });
  });

  RG.activeRunners.forEach(r => {
    if (r.out) return;
    const rxy = getRunnerXY(r.pos);
    const sp = toScreen3D(rxy.x, rxy.y, 0);
    draw3DBaseballPlayer(ctx, {
      x: sp.px,
      y: sp.groundY,
      scale: sp.scale * 1.0,
      jerseyColor: offenseTeam.jerseyHome,
      accentColor: offenseTeam.primary,
      numberColor: offenseTeam.secondary,
      capColor: offenseTeam.capColor,
      number: r.num || '17',
      role: 'runner'
    });
  });

  // 10. ACTIVE BALL (Spinning 3D Baseball & Drop Shadow)
  if (RG.thrownBall) {
    const tb = RG.thrownBall;
    const bx = tb.fromX + (tb.toX - tb.fromX) * tb.progress;
    const by = tb.fromY + (tb.toY - tb.fromY) * tb.progress;
    const bz = 1.2 + Math.sin(tb.progress * Math.PI) * 2.4;
    const spCur = toScreen3D(bx, by, bz);

    // Laser Throw Line
    const spFrom = toScreen3D(tb.fromX, tb.fromY, 1.2);
    const spTo = toScreen3D(tb.toX, tb.toY, 1.0);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(spFrom.px, spFrom.py);
    ctx.lineTo(spTo.px, spTo.py);
    ctx.stroke();
    ctx.setLineDash([]);

    drawSpinningBaseball(ctx, spCur.px, spCur.py, 8.5, tb.progress * 28, '#f43f5e');
  } else if (RG.ballPos) {
    const bSp = toScreen3D(RG.ballPos.x, RG.ballPos.y, RG.ballPos.z);
    // Dynamic ground shadow directly under ball
    const shadowScale = Math.max(0.35, 1 - RG.ballPos.z / 18);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(bSp.px, bSp.groundY, 8 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Spinning Baseball with red seams
    const ballR = Math.max(5.5, 8.5 * bSp.scale);
    drawSpinningBaseball(ctx, bSp.px, bSp.py, ballR, (RG.fieldIdxProgress || RG.fieldIdx || 0) * 0.75, '#ef4444');
  }

  // 11. BOUNCE & SLIDE DUST PARTICLES
  if (RG.particles && RG.particles.length > 0) {
    RG.particles.forEach(p => {
      p.x += p.vx * 0.35;
      p.y += p.vy * 0.35;
      p.life--;
      const pSp = toScreen3D(p.x, p.y, 0);
      ctx.fillStyle = p.color || '#d97706';
      ctx.beginPath();
      ctx.arc(pSp.px, pSp.groundY, Math.max(1, (p.life / 20) * 4), 0, Math.PI * 2);
      ctx.fill();
    });
    RG.particles = RG.particles.filter(p => p.life > 0);
  }

  // 12. FIREWORKS (Home Run Celebration)
  if (RG.fireworks && RG.fireworks.length > 0) {
    RG.fireworks.forEach(fw => {
      fw.x += fw.vx * 0.5;
      fw.y += fw.vy * 0.5;
      ctx.fillStyle = fw.color;
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Dedicated TV Broadcast Statcast HUD Overlay during Field Play
function drawRivalsStadiumHUD(ctx, W, H) {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const batter = getCurrentBatterInfo();

  // 1. TOP-LEFT COMPACT SCOREBUG
  const sbX = 14, sbY = 14, sbW = 205, sbH = 46;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sbX, sbY, sbW, sbH, 8);
  ctx.fill();
  ctx.stroke();

  // Team Scores
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${oTeam.shortName} ${RG.scoreCpu} - ${RG.scoreUser} ${uTeam.shortName}`, sbX + 10, sbY + 20);

  // Inning & Count
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${RG.isTop ? '▲' : '▼'} ${RG.inning}局  ${RG.balls}-${RG.strikes}  ${RG.outs} OUT`, sbX + 10, sbY + 38);

  // Base Diamond
  const bRadX = sbX + sbW - 32, bRadY = sbY + 23;
  const drawBase = (bx, by, filled) => {
    ctx.fillStyle = filled ? '#facc15' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx + 4, by);
    ctx.lineTo(bx, by + 4);
    ctx.lineTo(bx - 4, by);
    ctx.closePath();
    ctx.fill();
  };
  drawBase(bRadX + 7, bRadY, RG.occupiedBases[0]);
  drawBase(bRadX, bRadY - 7, RG.occupiedBases[1]);
  drawBase(bRadX - 7, bRadY, RG.occupiedBases[2]);

  // 2. TOP-CENTER STATCAST™ REAL-TIME TELEMETRY PILL
  const scW = 340, scH = 46;
  const scX = W / 2 - scW / 2, scY = 14;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(scX, scY, scW, scH, 10);
  ctx.fill();
  ctx.stroke();

  // Statcast Header
  ctx.fillStyle = '#facc15';
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚾ STATCAST™ 實戰物理即時追蹤', W / 2, scY + 16);

  // Dynamic Metrics
  const sc = RG.hitStatcast || { exitVeloMph: 104, exitVeloKmh: 167, launchDeg: 28, totalDistFt: 412 };
  const curDistFt = Math.round((RG.ballPos ? RG.ballPos.dist : 0) * 5.3);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(
    `初速 ${sc.exitVeloMph} MPH  •  仰角 ${sc.launchDeg}°  •  飛行 ${curDistFt} FT`,
    W / 2,
    scY + 36
  );

  // 3. HOME RUN FULL-SCREEN BROADCAST SPLASH (When hit clears the wall!)
  if (sc.isHomeRun && RG.ballPos && RG.ballPos.dist >= 72) {
    const hrW = Math.min(540, W - 30);
    const hrH = 92;
    const hrX = W / 2 - hrW / 2;
    const hrY = H * 0.32;

    const isWalkOffSplash = (!RG.isTop && RG.inning >= RG.maxInnings && RG.scoreUser > RG.scoreCpu);
    const hrGrad = ctx.createLinearGradient(hrX, hrY, hrX + hrW, hrY);
    hrGrad.addColorStop(0, isWalkOffSplash ? '#7c2d12' : '#1e3a8a');
    hrGrad.addColorStop(0.5, isWalkOffSplash ? '#e11d48' : '#0284c7');
    hrGrad.addColorStop(1, isWalkOffSplash ? '#7c2d12' : '#1e3a8a');
    ctx.fillStyle = hrGrad;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(hrX, hrY, hrW, hrH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isWalkOffSplash ? '🎊 WALK-OFF HOME RUN! 再見全壘打！ 🎊' : '🎆 HOME RUN! 全壘打！ 🎆',
      W / 2,
      hrY + 42
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(
      `#${batter.num} ${batter.short} 轟上看台！ 飛行距離 ${sc.totalDistFt} FT (${sc.totalDistM}m) • 初速 ${sc.exitVeloMph} MPH`,
      W / 2,
      hrY + 74
    );
  }

  // 4. TOP-RIGHT CAMERA & AUTO CONTROLS (Consistent with v2.7.0 Duel HUD)
  const trX = W - 265, trY = 14;
  const spdLabel = RG.pitchSpeedPreset === 'slow' ? '🐢慢速' : (RG.pitchSpeedPreset === 'normal' ? '⚾標準' : '🔥快速');
  ctx.fillStyle = RG.pitchSpeedPreset === 'slow' ? '#0284c7' : (RG.pitchSpeedPreset === 'normal' ? '#d97706' : '#e11d48');
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(trX, trY, 84, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 10.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`節奏:${spdLabel}`, trX + 42, trY + 18);

  ctx.fillStyle = RG.autoBatter ? '#10b981' : 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(trX + 90, trY, 52, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('打者', trX + 116, trY + 12);
  ctx.fillText(RG.autoBatter ? 'ON' : 'OFF', trX + 116, trY + 24);

  ctx.fillStyle = RG.autoPitcher ? '#10b981' : 'rgba(30, 41, 59, 0.85)';
  ctx.beginPath();
  ctx.roundRect(trX + 148, trY, 52, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('投手', trX + 174, trY + 12);
  ctx.fillText(RG.autoPitcher ? 'ON' : 'OFF', trX + 174, trY + 24);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.beginPath();
  ctx.roundRect(trX + 206, trY, 44, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('🎥追球', trX + 228, trY + 18);

  // 5. BOTTOM-RIGHT WATERMARK (v2.7.0)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('iPLAYERS ⚾ MLB Rivals 3D v2.7.0', W - 18, H - 16);
}

// Setup Mouse, Touch & Simplified Single-Tap Controls
window.addEventListener('DOMContentLoaded', () => {
  initRivalsFielders();
  const canvas = document.getElementById('rivalsBroadcastCanvas');
  if (!canvas) return;

  const mapPointerToZone = (clientX, clientY, isTouch, isClick = false) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((clientY - rect.top) / rect.height) * canvas.height;

    // Check click on top-right quick action buttons
    if (isClick) {
      const trX = canvas.width - 265, trY = 14;
      if (cy >= trY && cy <= trY + 32) {
        if (cx >= trX && cx <= trX + 84) {
          cycleRivalsPitchSpeed();
          return true;
        }
        if (cx >= trX + 90 && cx <= trX + 142) {
          toggleAutoBatter();
          return true;
        }
        if (cx >= trX + 148 && cx <= trX + 200) {
          toggleAutoPitcher();
          return true;
        }
        if (cx >= trX + 206 && cx <= trX + 250) {
          cycleRivalsCameraAngle();
          return true;
        }
      }
    }

    if (RG.cameraMode !== 'duel') return false;

    const scale = 430 / 2.05;
    const xM = Math.max(-0.50, Math.min(0.50, (cx - canvas.width * 0.48) / scale));
    const touchOffsetZ = isTouch ? 0.10 : 0.0;
    const zM = Math.max(0.24, Math.min(1.22, (412 - cy) / scale + 0.55 + touchOffsetZ));

    if (RG.userRole === 'batter') {
      // In Auto-Aim Assist mode, tapping anywhere on screen to swing should NOT pull the bat reticle off the ball!
      if (!RG.autoAimAssist || (!isClick && RG.touchDragging)) {
        RG.batX = xM;
        RG.batZ = zM;
      }
    } else if (RG.phase === 'pre_pitch') {
      RG.aimX = xM;
      RG.aimZ = zM;
    }
    if (RG.phase === 'pre_pitch') renderRivalsCanvas();
    return false;
  };

  canvas.addEventListener('mousemove', (e) => {
    if (!RG.autoAimAssist || RG.userRole === 'pitcher') {
      mapPointerToZone(e.clientX, e.clientY, false, false);
    }
  });

  // Tapping ANYWHERE on canvas = trigger swing or release!
  canvas.addEventListener('mousedown', (e) => {
    const handledTopBtn = mapPointerToZone(e.clientX, e.clientY, false, true);
    if (!handledTopBtn) handleRivalsPrimaryButton();
  });

  canvas.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    RG.touchDragging = false;
    const handledTopBtn = mapPointerToZone(t.clientX, t.clientY, true, true);
    if (!handledTopBtn) handleRivalsPrimaryButton();
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    if (!RG.autoAimAssist || RG.userRole === 'pitcher') {
      RG.touchDragging = true;
      mapPointerToZone(t.clientX, t.clientY, true, false);
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    RG.touchDragging = false;
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    const secGame = document.getElementById('sec-game');
    if (!secGame || secGame.classList.contains('hidden')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      handleRivalsPrimaryButton();
    }
  });

  setRivalsSwingMode('power');
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop(3800);
});
