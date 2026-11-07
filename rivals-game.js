// ==================== MLB 勁旅對決 (MLB RIVALS 3D SHOWDOWN) 互動棒球引擎 ====================
// 深度參考官方《MLB 勁旅對決》畫面與操作：
// 1. 洛杉磯道奇球場 (Dodger Stadium) 晴空白天真實 3D 視角：藍天白雲、外野棕櫚樹、雙國旗、經典計分板、多層觀眾席、草地割草紋路
// 2. 正宗 MLB Rivals UI：左上官方記分板 (Scorebug + RIVALS標籤)、左側 Signature 球員卡 (大谷翔平/弗里曼) 與對戰打擊數據條、好球帶 Hot Zones 紅色打擊熱區、底部 PLAY BALL 縫線藥丸徽章
// 3. 擬真 3D 球員模型：道奇主場白球衣、經典藍色 LA 球帽與紅色胸號/背號、左打(LHB)/右打(RHB) 3D 揮棒站姿與全動態揮棒殘影
// 4. 超簡化一鍵直覺操作：
//    - 打擊時：點擊畫面任意處或空白鍵即可自動投球＋看準時機揮棒！
//    - 內建「自動鎖定甜蜜點 (Auto-Aim Assist)」：手機/平板不需手忙腳亂拖曳游標，專注抓準時機即可敲出長打！
//    - 右上角一鍵切換「打者 AUTO」與「投手 AUTO」，隨時切換全自動觀戰轉播或手動微操！

const RivalsSFX = {
  ctx: null,
  enabled: true,
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
    if (btn) btn.textContent = this.enabled ? '🔊 音效' : '🔇 靜音';
  },
  playBatHit(isCrit) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isCrit ? 1250 : 760, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.18);
    gain.gain.setValueAtTime(isCrit ? 0.65 : 0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
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

// ==================== MLB TEAMS & SIGNATURE PLAYERS ====================
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

  // Simplified Assist & Automation Settings
  autoAimAssist: true,  // Bat sweet spot smoothly tracks incoming pitch!
  autoBatter: false,    // AUTO 打者 ON / OFF
  autoPitcher: false,   // AUTO 投手 ON / OFF
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

  phase: 'pre_pitch', // 'pre_pitch' -> 'pinpoint_ring' -> 'pitch_flight' -> 'contact_slowmo' -> 'field_play'
  cameraMode: 'duel',

  selectedPitch: '4seam',
  aimX: 0.05,
  aimZ: 0.72,
  ringRadius: 1.0,
  releaseQuality: 'GOOD',
  releaseMultiplier: 1.0,

  pitchPts: [],
  pitchGravityPts: [],
  pitchIdx: 0,
  currentSpeedKmh: 158, // 98 mph

  batX: 0.0,
  batZ: 0.72,
  swingTriggered: false,
  swingAnimProgress: 0,
  swingTimingText: '',
  contactFlashTimer: 0,
  lastContactInfo: null,

  fieldPts: [],
  fieldBounces: [],
  fieldIdx: 0,
  ballPos: { x: 0, y: 0, z: 0, state: 'air', dist: 0 },
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
  if (RG.phase === 'pinpoint_ring') {
    lockPinpointRelease();
  } else if (RG.phase === 'pitch_flight') {
    if (RG.userRole === 'batter') {
      triggerRivalsSwing();
    }
  } else if (RG.phase === 'pre_pitch') {
    startRivalsPitchAction();
  }
}

// Toggle Auto Batter ON/OFF
function toggleAutoBatter() {
  RG.autoBatter = !RG.autoBatter;
  showRivalsBanner(RG.autoBatter ? '🤖 打者 AUTO：開啟（AI 自動看準時機揮棒）' : '✋ 打者 手動：開啟（點擊螢幕自由揮棒）', 1500);
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop();
}

// Toggle Auto Pitcher ON/OFF
function toggleAutoPitcher() {
  RG.autoPitcher = !RG.autoPitcher;
  showRivalsBanner(RG.autoPitcher ? '🤖 投手 AUTO：開啟（AI 自動精準配球）' : '✋ 投手 手動：開啟（玩家手動縮圈投球）', 1500);
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop();
}

function toggleAutoAimAssist() {
  RG.autoAimAssist = !RG.autoAimAssist;
  showRivalsBanner(RG.autoAimAssist ? '🎯 甜蜜點自動鎖定：開啟（專注時機揮棒）' : '✋ 自由拖曳瞄準：開啟', 1500);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function checkAutoLoop() {
  if (RG.phase === 'pre_pitch') {
    if (RG.userRole === 'batter' || RG.autoPitcher) {
      clearTimeout(RG.autoNextTimer);
      RG.autoNextTimer = setTimeout(() => {
        if (RG.phase === 'pre_pitch') {
          startRivalsPitchAction();
        }
      }, 1600);
    }
  }
}

function setRivalsUserTeam(teamCode) {
  RG.userTeamCode = teamCode;
  RG.userBatterIdx = 0;
  RG.userPitcherIdx = 0;
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
    RG.userRole = RG.isTop ? 'batter' : 'pitcher';
    showRivalsBanner('🦄 大谷翔平 #17 二刀流模式：打擊與投球雙向切換！', 1800);
  } else {
    RG.userRole = mode;
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

  document.getElementById('rivals-inning').textContent = `${RG.inning}局${RG.isTop ? '上' : '下'}`;
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

  if (RG.cameraMode === 'duel') {
    if (hudActionWrap) hudActionWrap.classList.remove('hidden');
    if (RG.userRole === 'pitcher') {
      if (hudPitchCards) hudPitchCards.classList.remove('hidden');
      if (hudBatModes) hudBatModes.classList.add('hidden');
      if (mainIcon) mainIcon.textContent = RG.phase === 'pinpoint_ring' ? '🎯' : '⚾';
      if (mainLabel) mainLabel.textContent = RG.phase === 'pinpoint_ring' ? '放球！' : '啟動投球';
    } else {
      if (hudPitchCards) hudPitchCards.classList.add('hidden');
      if (hudBatModes) hudBatModes.classList.remove('hidden');
      if (mainIcon) mainIcon.textContent = RG.phase === 'pitch_flight' ? '🏏' : '⚾';
      if (mainLabel) mainLabel.textContent = RG.phase === 'pitch_flight' ? '揮棒 SWING' : '點擊開打';
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
  if (RG.cameraMode === 'field' && RG.phase === 'field_play') {
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

function resetRivalsMatch() {
  if (RG.animId) cancelAnimationFrame(RG.animId);
  RG.inning = 6;
  RG.isTop = false;
  RG.balls = 0;
  RG.strikes = 0;
  RG.outs = 1;
  RG.scoreUser = 1;
  RG.scoreCpu = 3;
  RG.occupiedBases = [false, false, false];
  RG.activeRunners = [];
  RG.fireworks = [];
  if (RG.roleMode === 'twoway') RG.userRole = 'batter';
  RG.phase = 'pre_pitch';
  RG.cameraMode = 'duel';
  RG.pitchPts = [];
  RG.fieldPts = [];
  initRivalsFielders();
  updateRivalsHUD();
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  setRivalsLog(`🏟️ <strong>《MLB 勁旅對決》開賽！</strong> ${oTeam.shortName} 3 - 1 ${uTeam.shortName} 6局下 1人出局！點擊螢幕任何位置即可揮棒或投球！`);
  renderRivalsCanvas();
  checkAutoLoop();
}

// ==================== PITCHING & PINPOINT RING ====================
function startRivalsPitchAction() {
  if (RG.phase !== 'pre_pitch') {
    if (RG.phase === 'pinpoint_ring') {
      lockPinpointRelease();
    }
    return;
  }

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
    function ringLoop() {
      RG.ringRadius -= 0.024;
      renderRivalsCanvas();
      if (RG.phase === 'pinpoint_ring') {
        if (RG.ringRadius <= 0.02) {
          lockPinpointRelease();
        } else {
          RG.animId = requestAnimationFrame(ringLoop);
        }
      }
    }
    RG.animId = requestAnimationFrame(ringLoop);
  } else {
    // AI Pitcher (or Auto-Pitcher) pitches
    const keys = ['4seam', 'sweeper', 'splitter', '2seam', 'curve'];
    RG.selectedPitch = keys[Math.floor(Math.random() * keys.length)];
    // Aim near middle of strike zone
    RG.aimX = (Math.random() * 0.50) - 0.25;
    RG.aimZ = 0.50 + Math.random() * 0.45;
    RG.releaseQuality = 'GOOD';
    RG.releaseMultiplier = 1.0;
    launchRivals3DPitch();
  }
}

function lockPinpointRelease() {
  if (RG.phase !== 'pinpoint_ring') return;
  const btn = document.getElementById('btn-rivals-pitch-main');
  if (btn) btn.textContent = '⚾ 啟動縮圈投球 (再按一次鎖定完美放球！)';

  const diff = Math.abs(RG.ringRadius - 0.28);
  if (diff <= 0.12 || RG.isClutchActive) {
    RG.releaseQuality = 'PERFECT';
    RG.releaseMultiplier = 1.25;
    addClutchEnergy(20);
    showRivalsBanner('✨ PERFECT 完美放球！球威與尾勁 +25%！', 1500);
  } else if (diff <= 0.25) {
    RG.releaseQuality = 'GOOD';
    RG.releaseMultiplier = 1.0;
    showRivalsBanner('👍 GOOD 良好放球！', 1100);
  } else {
    RG.releaseQuality = 'WILD';
    RG.releaseMultiplier = 0.75;
    RG.aimZ += (Math.random() < 0.5 ? -0.28 : 0.18);
    showRivalsBanner('⚠️ 失投偏離好球帶！', 1300);
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
  document.getElementById('rivals-tele-pitch').textContent = `${displayKmh} km/h (${displayMph} mph ${pInfo.short})`;
  document.getElementById('rivals-tele-hit').textContent = '--';
  document.getElementById('rivals-tele-dist').textContent = '--';

  if (RG.animId) cancelAnimationFrame(RG.animId);
  function flightLoop() {
    RG.pitchIdx += 2;
    if (RG.swingTriggered && RG.swingAnimProgress < 1) {
      RG.swingAnimProgress = Math.min(1, RG.swingAnimProgress + 0.22);
    }
    const idx = Math.min(RG.pitchIdx, RG.pitchPts.length - 1);
    const curP = RG.pitchPts[idx];

    // Auto-Aim Assist: smooth tracking of sweet spot cursor to ball landing spot
    if (RG.autoAimAssist && RG.userRole === 'batter' && !RG.touchDragging && !RG.swingTriggered) {
      const targetP = RG.pitchPts[RG.pitchPts.length - 1];
      RG.batX += (targetP.x - RG.batX) * 0.16;
      RG.batZ += (targetP.z - RG.batZ) * 0.16;
    }

    // Auto Batter Trigger (If Auto Batter is enabled)
    if (RG.autoBatter && RG.userRole === 'batter' && !RG.swingTriggered && curP.y >= 13.5 && curP.y <= 14.1) {
      const inStrikeZone = !curP.bounced && Math.abs(curP.x) <= 0.35 && curP.z >= 0.42 && curP.z <= 1.05;
      if (inStrikeZone || Math.random() < 0.25) {
        RG.batX = curP.x + (Math.random() * 0.08 - 0.04);
        RG.batZ = curP.z + (Math.random() * 0.08 - 0.04);
        triggerRivalsSwing();
        return;
      }
    }

    // AI Batter Trigger (When player is pitcher)
    if (RG.userRole === 'pitcher' && !RG.swingTriggered && curP.y >= 13.5 && curP.y <= 14.1) {
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

// ==================== BATTING & SWEET SPOT ====================
function triggerRivalsSwing() {
  if (RG.phase !== 'pitch_flight' || RG.swingTriggered) return;
  RG.swingTriggered = true;
  RG.swingAnimProgress = 0.25;

  const idx = Math.min(RG.pitchIdx, RG.pitchPts.length - 1);
  const curP = RG.pitchPts[idx];
  const batter = getCurrentBatterInfo();

  const yDiff = curP.y - 13.85;
  const distXZ = Math.hypot(curP.x - RG.batX, curP.z - RG.batZ);
  const maxContactRadius = (RG.swingPowerMode === 'contact' ? 0.35 : 0.28) + (batter.num === '17' ? 0.04 : 0.02);

  if (Math.abs(yDiff) <= 1.95 && distXZ <= maxContactRadius) {
    const isSweetSpot = distXZ <= 0.13 && Math.abs(yDiff) <= 0.65;
    const isCrit = isSweetSpot || (RG.isClutchActive && RG.userRole === 'batter');
    RG.isClutchActive = false;
    RG.swingAnimProgress = 1.0;
    RivalsSFX.playBatHit(isCrit);

    const dz = curP.z - RG.batZ;
    let launchDeg = 16 - dz * 185;
    if (isCrit) launchDeg = Math.max(16, Math.min(29, launchDeg));
    launchDeg = Math.max(-20, Math.min(62, launchDeg));

    const timingQuality = Math.max(0, 1 - Math.abs(yDiff) / 1.95);
    const centerQuality = Math.max(0, 1 - distXZ / maxContactRadius);
    const pwrBonus = batter.pwrBonus || 8;

    const simExitVelo = Math.round(78 + (timingQuality * 0.4 + centerQuality * 0.6) * 42 + (RG.swingPowerMode === 'power' ? 10 : 2) + (isCrit ? 12 : 0) + pwrBonus * 0.4);
    const statcastKmh = Math.round(simExitVelo * 1.48);

    const pullSign = batter.hand === 'L' ? -1 : 1;
    const sprayDeg = Math.max(-41, Math.min(41, yDiff * 24 * pullSign + (curP.x - RG.batX) * 70));

    RG.swingTimingText = Math.abs(yDiff) < 0.50 ? '⚡ PERFECT TIMING!' : (yDiff < 0 ? '◀ 拉打 (EARLY)' : '推打 (LATE) ▶');
    RG.lastContactInfo = { isCrit, exitVelo: simExitVelo, statcastKmh, launchDeg: Math.round(launchDeg), x: curP.x, z: curP.z };

    if (RG.userRole === 'batter') addClutchEnergy(isCrit ? 35 : 18);

    RG.phase = 'contact_slowmo';
    RG.contactFlashTimer = isCrit ? 22 : 10;
    showRivalsBanner(
      isCrit
        ? `💥 #${batter.num} ${batter.short} 完美擊中甜蜜點！初速 ${statcastKmh} km/h・仰角 ${Math.round(launchDeg)}°`
        : `🏏 擊出安打！初速 ${statcastKmh} km/h・仰角 ${Math.round(launchDeg)}°`,
      2000
    );

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
    RG.swingTimingText = Math.abs(yDiff) > 1.95 ? (yDiff < 0 ? '💨 太早揮棒 (TOO EARLY)' : '💨 太晚揮棒 (TOO LATE)') : '💨 揮棒落空 (SWING & MISS)';
    showRivalsBanner(RG.swingTimingText, 1500);
  }
}

function resolveRivalsPitchTaken() {
  RG.phase = 'pre_pitch';
  const plateP = RG.pitchPts.find(p => p.y >= 14.0) || RG.pitchPts[RG.pitchPts.length - 1];
  const inZone = !plateP.bounced && Math.abs(plateP.x) <= 0.33 && plateP.z >= 0.44 && plateP.z <= 1.02;

  if (RG.swingTriggered || inZone) {
    RG.strikes++;
    if (!RG.swingTriggered) {
      showRivalsBanner('🟡 好球！(STRIKE)', 1400);
      setRivalsLog(`⚾ <strong>好球進壘！</strong> ${RIVALS_PITCHES[RG.selectedPitch].name} 壓在好球帶邊角！`);
    }
    if (RG.strikes >= 3) {
      RG.strikes = 0;
      RG.balls = 0;
      if (RG.userRole === 'pitcher') addClutchEnergy(28);
      recordRivalsOut('🔥 三振出局 (STRIKEOUT)！');
    }
  } else {
    RG.balls++;
    if (RG.userRole === 'batter') addClutchEnergy(12);
    showRivalsBanner('🟢 壞球！(BALL)', 1400);
    setRivalsLog(plateP.bounced ? '👀 <strong>選球漂亮！</strong> 挖地瓜壞球！' : '👀 <strong>選球精準！</strong> 壞球偏出九宮格！');
    if (RG.balls >= 4) {
      RG.balls = 0;
      RG.strikes = 0;
      showRivalsBanner('🚶 四壞球保送！(WALK)', 1800);
      advanceRivalsWalk();
    }
  }
  updateRivalsHUD();
  renderRivalsCanvas();
  checkAutoLoop();
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
  RG.particles = [];

  const mlbDistFt = Math.round(sim.totalDist * 5.3);
  document.getElementById('rivals-tele-hit').textContent = `${statcastKmh || simExitVelo} km/h / ${Math.round(launchDeg)}°`;
  document.getElementById('rivals-tele-dist').textContent = `${sim.totalDist}m (${mlbDistFt} ft)`;

  RG.activeRunners = [];
  const isFlyBall = launchDeg >= 22 && sim.carryDist < 75;
  const shouldTagUpWait = isFlyBall && RG.outs < 2;

  for (let b = 2; b >= 0; b--) {
    if (RG.occupiedBases[b]) {
      const baseNum = b + 1;
      const forced = (b === 0) || (b === 1 && RG.occupiedBases[0]) || (b === 2 && RG.occupiedBases[1] && RG.occupiedBases[0]);
      const target = (shouldTagUpWait && !forced) ? baseNum : baseNum + 1;
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
    targetBase: sim.carryDist >= 75 ? 4 : (sim.totalDist >= 54 && launchDeg < 26 ? 2 : 1),
    safe: false,
    out: false
  });

  updateRivalsHUD();
  setRivalsLog('🏟️ <strong>球打進場內！</strong> 全景追蹤空中飛行拋物線、連續彈跳與草地滾動！');

  if (RG.animId) cancelAnimationFrame(RG.animId);
  let lastBounceCount = 0;

  function stadiumLoop() {
    if (RG.phase !== 'field_play') return;

    if (!RG.ballHolder && !RG.thrownBall) {
      RG.fieldIdx = Math.min(RG.fieldIdx + 1, RG.fieldPts.length - 1);
      const pt = RG.fieldPts[RG.fieldIdx];
      RG.ballPos = { x: pt.x, y: pt.y, z: pt.z, state: pt.state, dist: pt.dist };

      const curBounces = RG.fieldBounces.filter(b => pt.dist >= b.dist).length;
      if (curBounces > lastBounceCount) {
        lastBounceCount = curBounces;
        RivalsSFX.playBounce();
        spawnBounceParticles(pt.x, pt.y, pt.dist < 26);
      }

      if (pt.dist >= 75 && pt.state === 'air') {
        finishHomeRun(sim.carryDist);
        return;
      }
    }

    updateFieldersAndCheckCatch(launchDeg, sim.carryDist);

    if (RG.thrownBall) {
      RG.thrownBall.progress += 0.055;
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
        const speedStep = (RG.didSlide && r.targetBase - r.pos < 0.35) ? 0.023 : 0.015;
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
      recordRivalsOut(`🧤 美技接殺！${closestF.pos} 直接接殺飛球！`);

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

    if (RG.userRole === 'batter') {
      const movingRunner = RG.activeRunners.find(r => !r.out && Math.abs(r.pos - r.targetBase) > 0.04);
      const targetB = movingRunner ? movingRunner.targetBase : 1;
      setTimeout(() => {
        if (RG.phase === 'field_play' && RG.ballHolder) {
          rivalsThrowToBase(targetB);
        }
      }, 180);
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
      const baseNames = ['本壘', '一壘', '二壘', '三壘', '本壘'];
      recordRivalsOut(`⚡ 傳球刺殺出局！球比跑者早一步到達${baseNames[baseNum]}！`);

      if (RG.outs < 3 && baseNum === 2) {
        const batter = RG.activeRunners.find(r => !r.out && r.targetBase === 1 && r.pos < 0.96);
        if (batter && RG.userRole === 'batter') {
          const b2 = getBaseCoordsMeters(2);
          const b1 = getBaseCoordsMeters(1);
          RG.thrownBall = { fromX: b2.x, fromY: b2.y, toX: b1.x, toY: b1.y, progress: 0, targetBase: 1 };
        }
      }
    } else {
      showRivalsBanner(RG.didSlide ? '💨 神級曲腿滑壘 SAFE！閃過觸殺！' : '🙌 SAFE！跑者先踏上壘包！', 1600);
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
  RivalsSFX.playCheer();
  let runs = 1;
  RG.occupiedBases.forEach(occ => { if (occ) runs++; });
  if (RG.userRole === 'batter') RG.scoreUser += runs;
  else RG.scoreCpu += runs;

  const batter = getCurrentBatterInfo();
  const mlbDistFt = Math.round(carryDist * 5.3);
  RG.occupiedBases = [false, false, false];
  RG.balls = 0;
  RG.strikes = 0;

  if (!RG.lockOhtani) {
    if (RG.userRole === 'batter') RG.userBatterIdx++;
    else RG.cpuBatterIdx++;
  }

  RG.fireworks = [];
  for (let i = 0; i < 36; i++) {
    RG.fireworks.push({
      x: 180 + Math.random() * 600,
      y: 40 + Math.random() * 140,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      color: ['#facc15', '#38bdf8', '#f43f5e', '#4ade80', '#c084fc'][i % 5]
    });
  }

  showRivalsBanner(`🎆 BIG FLY! #${batter.num} 轟出 ${mlbDistFt} 英尺 (${carryDist}m) 特大號全壘打！+${runs} 分！`, 3200);
  setRivalsLog(`🎆 <strong>HOME RUN 全壘打！</strong> #${batter.num} ${batter.short} 轟上看台（${mlbDistFt} ft），進帳 <strong>${runs} 分</strong>！`);

  let fwFrames = 42;
  function fwLoop() {
    fwFrames--;
    renderRivalsCanvas();
    if (fwFrames > 0) {
      RG.animId = requestAnimationFrame(fwLoop);
    } else {
      RG.phase = 'pre_pitch';
      RG.cameraMode = 'duel';
      updateRivalsHUD();
      renderRivalsCanvas();
      checkAutoLoop();
    }
  }
  RG.animId = requestAnimationFrame(fwLoop);
}

function concludeFieldPlay() {
  const newBases = [false, false, false];
  let runsScored = 0;
  RG.activeRunners.forEach(r => {
    if (r.out) return;
    const finalB = Math.round(r.pos);
    if (finalB >= 4) {
      runsScored++;
    } else if (finalB >= 1 && finalB <= 3) {
      newBases[finalB - 1] = true;
    }
  });

  if (runsScored > 0 && RG.outs < 3) {
    RivalsSFX.playCheer();
    if (RG.userRole === 'batter') RG.scoreUser += runsScored;
    else RG.scoreCpu += runsScored;
    showRivalsBanner(`🎉 跑者回本壘得 ${runsScored} 分！`, 2000);
  }

  if (!RG.lockOhtani) {
    if (RG.userRole === 'batter') RG.userBatterIdx++;
    else RG.cpuBatterIdx++;
  }

  RG.occupiedBases = newBases;
  RG.balls = 0;
  RG.strikes = 0;
  RG.phase = 'pre_pitch';
  setTimeout(() => {
    RG.cameraMode = 'duel';
    updateRivalsHUD();
    renderRivalsCanvas();
    checkAutoLoop();
  }, 850);
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
  }
}

function recordRivalsOut(msg) {
  RG.outs++;
  showRivalsBanner(msg, 1800);
  setRivalsLog(`📣 <strong>裁判判決：</strong> ${msg}`);
  if (RG.outs >= 3) {
    RG.outs = 0;
    RG.balls = 0;
    RG.strikes = 0;
    RG.occupiedBases = [false, false, false];
    RG.activeRunners = [];
    if (RG.isTop) {
      RG.isTop = false;
    } else {
      RG.isTop = true;
      RG.inning++;
    }
    if (RG.roleMode === 'twoway') {
      RG.userRole = RG.isTop ? 'batter' : 'pitcher';
    }
    setTimeout(() => {
      const roleMsg = RG.roleMode === 'twoway'
        ? (RG.userRole === 'pitcher' ? '🦄 攻守交換！大谷翔平 #17 登板投球！' : '🦄 攻守交換！大谷翔平 #17 上場打擊！')
        : '🔄 三人出局！攻守交換！';
      showRivalsBanner(roleMsg, 2200);
      updateRivalsHUD();
      renderRivalsCanvas();
      checkAutoLoop();
    }, 900);
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
  ctx.fillText('★ MLB OFFICIAL LICENSED • v2.5.0 ★', lbX + lbW / 2, lbY + 52);

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
  const baseY = 412;
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

  // 3D Projection function for Home Plate Duel View
  const proj = (x, y, z) => {
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
  const pitchAnim = RG.phase === 'pitch_flight' ? Math.min(1, RG.pitchIdx / 22) : (RG.phase === 'pinpoint_ring' ? (1 - RG.ringRadius) * 0.45 : 0);
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

  // 8. Pitcher Pinpoint Release Ring (Pitcher Mode)
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
      const isSweet = Math.abs(RG.ringRadius - 0.28) <= 0.12;
      ctx.strokeStyle = isSweet ? '#4ade80' : '#38bdf8';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(finalAim.px, finalAim.py, shrinkPx, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 9. Ball Flight, Ground Shadow & Spinning Seam
  if (RG.pitchPts.length > 0) {
    const maxI = Math.min(RG.pitchIdx, RG.pitchPts.length - 1);

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

    // Ball Arrival Indicator Ring
    const platePt = RG.pitchPts[RG.pitchPts.length - 1];
    const predPr = proj(platePt.x, 14.0, platePt.z);
    const flightRatio = maxI / RG.pitchPts.length;
    if (RG.phase === 'pitch_flight') {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(predPr.px, predPr.py, Math.max(12, (1 - flightRatio) * 52 + 12), 0, Math.PI * 2);
      ctx.stroke();
    }

    const curP = RG.pitchPts[maxI];
    const curPr = proj(curP.x, curP.y, curP.z);
    const ballR = Math.max(4.5, (curPr.scale / 150) * 14.5);
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

  // Contact Slow-Mo Shockwave
  if (RG.phase === 'contact_slowmo' && RG.lastContactInfo) {
    const cp = proj(RG.lastContactInfo.x, 14.0, RG.lastContactInfo.z);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cp.px, cp.py, (22 - RG.contactFlashTimer) * 3.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Timing Bar on Left Edge
  drawRivalsTimingBar(ctx, 20, 195, 20, 190);
}

// Draw Authentic MLB Rivals Scorebug, Player Card & Bottom PLAY BALL Pill!
function drawRivalsOfficialHUD(ctx, W, H) {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const batter = getCurrentBatterInfo();

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
  ctx.fillText(`▼ ${RG.inning}`, sbX + 12, sbY + 48);
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
  ctx.fillText('RIVALS v2.5', sbX + 46, sbY + sbH + 15);

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

  ctx.fillStyle = '#005A9C';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`LA ${batter.pos}`, cardX + 8, cardY + 38);

  // Player Avatar Silhouette / Portrait
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(cardX + cardW / 2 + 10, cardY + 68, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#005A9C';
  ctx.beginPath();
  ctx.arc(cardX + cardW / 2 + 10, cardY + 65, 25, Math.PI, 0);
  ctx.fill();
  // Jersey bust
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#005A9C';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX + cardW / 2 - 18, cardY + 86, 56, 55, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#005A9C';
  ctx.font = 'bold 9px cursive';
  ctx.fillText('Dodgers', cardX + cardW / 2 + 10, cardY + 108);

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

  // 3. TOP-RIGHT BROADCAST BUTTONS (Exact match to reference image: Speed 98, Cam, 打者ON, 投手ON)
  const trX = W - 220, trY = 14;

  // Speed Badge: 98 mph
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(trX, trY, 44, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('98', trX + 22, trY + 19);

  // Auto Batter Toggle Button (打者 ON / OFF)
  ctx.fillStyle = RG.autoBatter ? '#10b981' : 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(trX + 50, trY, 52, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('打者', trX + 76, trY + 12);
  ctx.fillText(RG.autoBatter ? 'ON' : 'OFF', trX + 76, trY + 24);

  // Auto Pitcher Toggle Button (投手 ON / OFF)
  ctx.fillStyle = RG.autoPitcher ? '#10b981' : 'rgba(30, 41, 59, 0.85)';
  ctx.beginPath();
  ctx.roundRect(trX + 108, trY, 52, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('投手', trX + 134, trY + 12);
  ctx.fillText(RG.autoPitcher ? 'ON' : 'OFF', trX + 134, trY + 24);

  // Camera / Fullscreen icon
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.beginPath();
  ctx.roundRect(trX + 166, trY, 38, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.font = '14px sans-serif';
  ctx.fillText('🎥', trX + 185, trY + 19);

  // 4. BOTTOM-CENTER "PLAY BALL" SEAM PILL (Exact match to reference image!)
  if (RG.phase === 'pre_pitch') {
    const pillW = 210, pillH = 36;
    const pillX = W / 2 - pillW / 2, pillY = H - 56;

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
    // Left seam
    for (let s = 0; s < 5; s++) {
      ctx.beginPath();
      ctx.moveTo(pillX + 12 + s * 4, pillY + 10 + (s % 2) * 14);
      ctx.lineTo(pillX + 16 + s * 4, pillY + 16 + (s % 2) * 14);
      ctx.stroke();
    }
    // Right seam
    for (let s = 0; s < 5; s++) {
      ctx.beginPath();
      ctx.moveTo(pillX + pillW - 32 + s * 4, pillY + 10 + (s % 2) * 14);
      ctx.lineTo(pillX + pillW - 28 + s * 4, pillY + 16 + (s % 2) * 14);
      ctx.stroke();
    }

    // "PLAY BALL" text
    ctx.fillStyle = '#7e22ce';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLAY BALL', W / 2, pillY + 23);
  }

  // 5. BOTTOM-RIGHT MLB WATERMARK (Matching reference image with version)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('iPLAYERS ⚾ MLB Rivals 3D v2.5.0', W - 18, H - 16);
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

// 3D Stadium Play View (Ball in play)
function drawRivalsStadiumCamera3D(ctx, W, H) {
  const uTeam = getActiveUserTeam();
  const oTeam = getActiveOppTeam();
  const offenseTeam = RG.userRole === 'batter' ? uTeam : oTeam;
  const defenseTeam = RG.userRole === 'pitcher' ? uTeam : oTeam;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, 115);
  skyGrad.addColorStop(0, '#2563eb');
  skyGrad.addColorStop(1, '#93c5fd');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, 115);

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, 115);
  ctx.quadraticCurveTo(W / 2, 42, W, 115);
  ctx.lineTo(W, 145);
  ctx.lineTo(0, 145);
  ctx.closePath();
  ctx.fill();

  const hx = W / 2;
  const hy = 485;
  const toScreen3D = (x, y, z = 0) => {
    const depthScale = 1 - (y / 195);
    const scX = 6.2 * Math.max(0.58, depthScale);
    const scY = 4.65 * Math.max(0.62, depthScale);
    const groundX = hx + x * scX;
    const groundY = hy - y * scY;
    return {
      px: groundX,
      py: groundY - z * (5.2 * Math.max(0.65, depthScale)),
      groundY,
      scale: Math.max(0.55, depthScale)
    };
  };

  const grassGrad = ctx.createLinearGradient(0, 95, 0, H);
  grassGrad.addColorStop(0, '#16a34a');
  grassGrad.addColorStop(1, '#15803d');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 95, W, H - 95);

  // Infield Clay
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

  // Diamond
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

  // Bases
  [b1, b2, b3, bHome].forEach(b => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(b.px - 7, b.groundY - 5, 14, 10);
    ctx.strokeRect(b.px - 7, b.groundY - 5, 14, 10);
  });

  // Trajectory Segments
  if (RG.fieldPts.length > 0) {
    const maxI = Math.min(RG.fieldIdx, RG.fieldPts.length - 1);

    // Ground Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= maxI; i++) {
      const p = RG.fieldPts[i];
      const sp = toScreen3D(p.x, p.y, 0);
      if (i === 0) ctx.moveTo(sp.px, sp.groundY);
      else ctx.lineTo(sp.px, sp.groundY);
    }
    ctx.stroke();

    for (let i = 1; i <= maxI; i++) {
      const p0 = RG.fieldPts[i - 1];
      const p1 = RG.fieldPts[i];
      const s0 = toScreen3D(p0.x, p0.y, p0.z);
      const s1 = toScreen3D(p1.x, p1.y, p1.z);

      if (p1.state === 'air') {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4.2;
        ctx.setLineDash([]);
      } else if (p1.state === 'bouncing') {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3.4;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.4;
        ctx.setLineDash([4, 4]);
      }
      ctx.beginPath();
      ctx.moveTo(s0.px, s0.py);
      ctx.lineTo(s1.px, s1.py);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw Fielders & Runners
  RG.fielders.forEach(f => {
    const fp = toScreen3D(f.x, f.y, 0);
    draw3DBaseballPlayer(ctx, {
      x: fp.px,
      y: fp.groundY,
      scale: fp.scale * 0.92,
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
      scale: sp.scale * 0.98,
      jerseyColor: offenseTeam.jerseyHome,
      accentColor: offenseTeam.primary,
      numberColor: offenseTeam.secondary,
      capColor: offenseTeam.capColor,
      number: r.num || '17',
      role: 'runner'
    });
  });

  // Active Ball
  if (RG.thrownBall) {
    const tb = RG.thrownBall;
    const bx = tb.fromX + (tb.toX - tb.fromX) * tb.progress;
    const by = tb.fromY + (tb.toY - tb.fromY) * tb.progress;
    const bz = 1.2 + Math.sin(tb.progress * Math.PI) * 2.2;
    const spCur = toScreen3D(bx, by, bz);
    drawSpinningBaseball(ctx, spCur.px, spCur.py, 7.5, tb.progress * 22, '#f43f5e');
  } else {
    const bSp = toScreen3D(RG.ballPos.x, RG.ballPos.y, RG.ballPos.z);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(bSp.px, bSp.groundY, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSpinningBaseball(ctx, bSp.px, bSp.py, 7.5, RG.fieldIdx * 0.65, '#ef4444');
  }

  // Fireworks
  if (RG.fireworks && RG.fireworks.length > 0) {
    RG.fireworks.forEach(fw => {
      fw.x += fw.vx * 0.4;
      fw.y += fw.vy * 0.4;
      ctx.fillStyle = fw.color;
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Setup Mouse, Touch & Simplified Single-Tap Controls
window.addEventListener('DOMContentLoaded', () => {
  initRivalsFielders();
  const canvas = document.getElementById('rivalsBroadcastCanvas');
  if (!canvas) return;

  const mapPointerToZone = (clientX, clientY, isTouch) => {
    if (RG.cameraMode !== 'duel') return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((clientY - rect.top) / rect.height) * canvas.height;

    // Check click on top-right quick action buttons
    const trX = canvas.width - 220, trY = 14;
    if (cy >= trY && cy <= trY + 32) {
      if (cx >= trX + 50 && cx <= trX + 102) {
        toggleAutoBatter();
        return;
      }
      if (cx >= trX + 108 && cx <= trX + 160) {
        toggleAutoPitcher();
        return;
      }
      if (cx >= trX + 166 && cx <= trX + 204) {
        toggleRivalsFullscreen();
        return;
      }
    }

    const scale = 430 / 2.05;
    const xM = Math.max(-0.50, Math.min(0.50, (cx - canvas.width * 0.48) / scale));
    const touchOffsetZ = isTouch ? 0.10 : 0.0;
    const zM = Math.max(0.24, Math.min(1.22, (412 - cy) / scale + 0.55 + touchOffsetZ));

    if (RG.userRole === 'batter') {
      RG.batX = xM;
      RG.batZ = zM;
    } else if (RG.phase === 'pre_pitch') {
      RG.aimX = xM;
      RG.aimZ = zM;
    }
    if (RG.phase === 'pre_pitch') renderRivalsCanvas();
  };

  canvas.addEventListener('mousemove', (e) => {
    mapPointerToZone(e.clientX, e.clientY, false);
  });

  // Tapping ANYWHERE on canvas = trigger swing or release!
  canvas.addEventListener('mousedown', (e) => {
    mapPointerToZone(e.clientX, e.clientY, false);
    handleRivalsPrimaryButton();
  });

  canvas.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    RG.touchDragging = true;
    mapPointerToZone(t.clientX, t.clientY, true);
    handleRivalsPrimaryButton();
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    mapPointerToZone(t.clientX, t.clientY, true);
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
  checkAutoLoop();
});
