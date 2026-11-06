// ==================== 勁旅對決 (RIVALS SHOWDOWN) 互動棒球比賽引擎 ====================
// 包含：
// 1. Web Audio 實戰音效合成器（擊球清脆聲、捕手接球聲、觀眾歡呼、彈跳聲）
// 2. 投手微操系統：5種球路卡＋變化軌跡預覽線＋《勁旅對決》動態縮圈完美放球計量環
// 3. 打者微操系統：巧打/強振切換＋動態落點預測圈＋球棒甜蜜點游標移動＋揮棒時機條＋爆擊慢動作特效
// 4. 守備與跑壘即時互動：3D 全景球場追蹤鏡頭、真實空氣動力＋紅土/草地連續彈跳＋滾動摩擦減速、
//    野手飛撲攔截 QTE、自由選擇傳球壘包（一/二/三/本壘抓雙殺）、跑者滑壘 QTE 與積極進壘操控！

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
    if (btn) btn.textContent = this.enabled ? '🔊 實戰音效：開' : '🔇 實戰音效：關';
  },
  playBatHit(isCrit) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Crack + metallic ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isCrit ? 1150 : 720, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
    gain.gain.setValueAtTime(isCrit ? 0.55 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  },
  playMittPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    gain.gain.setValueAtTime(0.4, now);
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
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
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
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.36);
    });
  }
};

// Pitch repertoire with Rivals break vectors (in meters at Home Plate)
const RIVALS_PITCHES = {
  '4seam': {
    name: '🔥 四縫線直球',
    short: '4-Seam',
    speed: 92,
    rpm: 2050,
    color: '#ef4444',
    breakX: 0.0,
    breakZ: 0.14, // rises relative to gravity
    spinX: 0.0,
    spinZ: 1.05,
    desc: '高轉速正後旋，進壘時有抗重力上浮尾勁！'
  },
  '2seam': {
    name: '⚡ 二縫線伸卡',
    short: 'Sinker',
    speed: 86,
    rpm: 1800,
    color: '#f59e0b',
    breakX: -0.22,
    breakZ: -0.14,
    spinX: -0.75,
    spinZ: 0.25,
    desc: '往右打者內角橫移並下沉，引誘滾地球雙殺利器！'
  },
  'slider': {
    name: '🗡️ 犀利滑球',
    short: 'Slider',
    speed: 81,
    rpm: 2200,
    color: '#38bdf8',
    breakX: 0.28,
    breakZ: -0.12,
    spinX: 0.95,
    spinZ: 0.1,
    desc: '往右打者外角急速橫向滑移，打者最容易揮空！'
  },
  'changeup': {
    name: '🐢 圈指變速球',
    short: 'Changeup',
    speed: 74,
    rpm: 1150,
    color: '#10b981',
    breakX: -0.10,
    breakZ: -0.24,
    spinX: -0.3,
    spinZ: -0.25,
    desc: '揮臂像直球卻慢了18km/h，本壘前突然掉下！'
  },
  'curve': {
    name: '🌈 大曲球',
    short: 'Curve',
    speed: 68,
    rpm: 2350,
    color: '#a855f7',
    breakX: 0.16,
    breakZ: -0.36,
    spinX: 0.45,
    spinZ: -1.05,
    desc: '強烈前旋產生大弧度彩虹軌跡縱向下墜！'
  }
};

const RIVALS_OPPONENTS = [
  { id: 0, name: '🐯 猛虎少棒隊 (入門)', velMod: -4, aiSkill: 0.55 },
  { id: 1, name: '🦅 蒼鷹菁英隊 (進階)', velMod: 2, aiSkill: 0.72 },
  { id: 2, name: '🐉 霸龍全明星 (魔王)', velMod: 8, aiSkill: 0.86 }
];

const RG = {
  opponentIdx: 0,
  userRole: 'batter', // 'batter' or 'pitcher'
  swingPowerMode: 'contact', // 'contact' (large cursor) or 'power' (sweet spot HR boost)
  clutchEnergy: 40, // 0..100, at 100 unlocks Clutch Super Mode!
  isClutchActive: false,

  inning: 1,
  isTop: true,
  balls: 0,
  strikes: 0,
  outs: 0,
  scoreUser: 0,
  scoreCpu: 0,

  // Camera & Phase
  // phases: 'pre_pitch' -> 'pinpoint_ring' (if pitching) -> 'pitch_flight' -> 'contact_slowmo' -> 'field_play' -> 'play_over'
  phase: 'pre_pitch',
  cameraMode: 'duel', // 'duel' or 'field'

  // Pitching state
  selectedPitch: '4seam',
  aimX: 0.0,   // -0.45..+0.45 m
  aimZ: 0.72,  // 0.25..1.15 m
  ringRadius: 1.0, // shrinks from 1.0 to 0.0 during pinpoint_ring
  releaseQuality: 'GOOD', // 'PERFECT', 'GOOD', 'WILD'
  releaseMultiplier: 1.0,

  // Active Pitch 3D Trajectory
  pitchPts: [],
  pitchGravityPts: [],
  pitchIdx: 0,
  currentSpeedKmh: 88,

  // Batting cursor state
  batX: 0.0,
  batZ: 0.72,
  swingTriggered: false,
  swingTimingText: '',
  contactFlashTimer: 0,
  lastContactInfo: null,

  // Field & Baserunning 3D state
  fieldPts: [],
  fieldBounces: [],
  fieldIdx: 0,
  ballPos: { x: 0, y: 0, z: 0, state: 'air', vx: 0, vy: 0 },
  fielders: [],
  ballHolder: null, // fielder holding the ball
  thrownBall: null, // { fromX, fromY, toX, toY, progress, targetBase }
  diveQteAvailable: false,
  diveFielder: null,
  slideQteAvailable: false,
  didSlide: false,

  // Active base runners: array of { startBase: 0..3, pos: float (0=Home, 1=1B, 2=2B, 3=3B, 4=Home), targetBase: int, safe: bool, out: bool }
  occupiedBases: [false, false, false], // 1B, 2B, 3B before play
  activeRunners: [],
  particles: [],

  animId: null
};

function initRivalsFielders() {
  RG.fielders = [
    { pos: 'P', x: 0, y: 14.0, homeX: 0, homeY: 14.0, speed: 5.8 },
    { pos: 'C', x: 0, y: -1.0, homeX: 0, homeY: -1.0, speed: 5.2 },
    { pos: '1B', x: 13.0, y: 15.5, homeX: 13.5, homeY: 13.5, speed: 5.6 },
    { pos: '2B', x: 6.8, y: 23.5, homeX: 0, homeY: 27.0, speed: 6.2 },
    { pos: 'SS', x: -6.8, y: 23.5, homeX: 0, homeY: 27.0, speed: 6.4 },
    { pos: '3B', x: -13.0, y: 15.5, homeX: -13.5, homeY: 13.5, speed: 5.8 },
    { pos: 'LF', x: -21.0, y: 43.0, homeX: -21.0, homeY: 43.0, speed: 6.8 },
    { pos: 'CF', x: 0.0, y: 49.0, homeX: 0.0, homeY: 49.0, speed: 7.2 },
    { pos: 'RF', x: 21.0, y: 43.0, homeX: 21.0, homeY: 43.0, speed: 6.8 }
  ];
}

function getBaseCoordsMeters(baseIndex) {
  // 0 = Home, 1 = 1B, 2 = 2B, 3 = 3B, 4 = Home
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

// ==================== UI & CONTROLS BINDING ====================
function setRivalsOpponent(idx) {
  RG.opponentIdx = idx;
  [0, 1, 2].forEach(i => {
    const el = document.getElementById('opp-btn-' + i);
    if (el) el.classList.toggle('active', i === idx);
  });
  const oppNameEl = document.getElementById('rivals-opp-name');
  if (oppNameEl) oppNameEl.textContent = RIVALS_OPPONENTS[idx].name;
  resetRivalsMatch();
}

function setRivalsRole(role) {
  RG.userRole = role;
  document.getElementById('rivals-role-bat').classList.toggle('active', role === 'batter');
  document.getElementById('rivals-role-pitch').classList.toggle('active', role === 'pitcher');

  document.getElementById('rivals-batter-panel').classList.toggle('hidden', role !== 'batter');
  document.getElementById('rivals-pitcher-panel').classList.toggle('hidden', role !== 'pitcher');

  RG.phase = 'pre_pitch';
  RG.cameraMode = 'duel';
  updateRivalsHUD();
  renderRivalsCanvas();
}

function setRivalsSwingMode(mode) {
  RG.swingPowerMode = mode;
  document.getElementById('swing-mode-contact').classList.toggle('active', mode === 'contact');
  document.getElementById('swing-mode-power').classList.toggle('active', mode === 'power');
  renderRivalsCanvas();
}

function selectRivalsPitchCard(pKey) {
  RG.selectedPitch = pKey;
  Object.keys(RIVALS_PITCHES).forEach(k => {
    const btn = document.getElementById('rcard-' + k);
    if (btn) btn.classList.toggle('active', k === pKey);
  });
  const p = RIVALS_PITCHES[pKey];
  const descEl = document.getElementById('rivals-pitch-card-desc');
  if (descEl) descEl.textContent = `${p.name}：${p.desc}`;
  renderRivalsCanvas();
}

function activateClutchSpecial() {
  if (RG.clutchEnergy < 100) return;
  RG.isClutchActive = true;
  RG.clutchEnergy = 0;
  RivalsSFX.playCheer();
  showRivalsBanner('🔥 勁旅必殺時刻啟動！擊球初速與球威大幅突破極限！', 2500);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function addClutchEnergy(amount) {
  RG.clutchEnergy = Math.min(100, RG.clutchEnergy + amount);
  updateRivalsHUD();
}

function updateRivalsHUD() {
  document.getElementById('rivals-inning').textContent = `${RG.inning}局${RG.isTop ? '上' : '下'}`;
  document.getElementById('rivals-score-user').textContent = RG.scoreUser;
  document.getElementById('rivals-score-cpu').textContent = RG.scoreCpu;

  document.getElementById('rivals-b').textContent = '●'.repeat(RG.balls) + '○'.repeat(Math.max(0, 4 - RG.balls));
  document.getElementById('rivals-s').textContent = '●'.repeat(RG.strikes) + '○'.repeat(Math.max(0, 3 - RG.strikes));
  document.getElementById('rivals-o').textContent = '●'.repeat(RG.outs) + '○'.repeat(Math.max(0, 3 - RG.outs));

  const bar = document.getElementById('rivals-clutch-bar');
  const btn = document.getElementById('rivals-clutch-btn');
  if (bar) bar.style.width = `${RG.clutchEnergy}%`;
  if (btn) {
    if (RG.clutchEnergy >= 100) {
      btn.disabled = false;
      btn.className = 'px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow animate-bounce cursor-pointer';
      btn.textContent = '🔥 發動必殺技！(MAX)';
    } else {
      btn.disabled = true;
      btn.className = 'px-3 py-1 rounded-lg bg-slate-700 text-slate-400 font-bold text-xs cursor-not-allowed';
      btn.textContent = RG.isClutchActive ? '🔥 必殺發動中！' : `⚡ 鬥志能量 ${RG.clutchEnergy}%`;
    }
  }

  // Toggle contextual action bars
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
  RG.inning = 1;
  RG.isTop = true;
  RG.balls = 0;
  RG.strikes = 0;
  RG.outs = 0;
  RG.scoreUser = 0;
  RG.scoreCpu = 0;
  RG.occupiedBases = [false, false, false];
  RG.activeRunners = [];
  RG.phase = 'pre_pitch';
  RG.cameraMode = 'duel';
  RG.pitchPts = [];
  RG.fieldPts = [];
  initRivalsFielders();
  updateRivalsHUD();
  setRivalsLog('🏟️ <strong>《勁旅對決》比賽開始！</strong> 對手已就位，準備展開投打對決！');
  renderRivalsCanvas();
}

// ==================== PITCHING & PINPOINT RING MECHANIC ====================
function startRivalsPitchAction() {
  if (RG.phase !== 'pre_pitch') {
    // If we are in pinpoint_ring phase, pressing the button locks the release ring!
    if (RG.phase === 'pinpoint_ring') {
      lockPinpointRelease();
    }
    return;
  }

  initRivalsFielders();
  RG.cameraMode = 'duel';
  RG.swingTriggered = false;
  RG.swingTimingText = '';
  RG.lastContactInfo = null;
  RG.fieldPts = [];
  RG.thrownBall = null;
  RG.ballHolder = null;
  RG.diveQteAvailable = false;
  RG.slideQteAvailable = false;
  RG.didSlide = false;

  if (RG.userRole === 'pitcher') {
    // Start shrinking Pinpoint Ring minigame!
    RG.phase = 'pinpoint_ring';
    RG.ringRadius = 1.0;
    const btn = document.getElementById('btn-rivals-pitch-main');
    if (btn) btn.textContent = '🎯 看準縮圈重合時點擊：放球！(空白鍵)';

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
    // AI Pitcher chooses pitch and aims
    const keys = Object.keys(RIVALS_PITCHES);
    RG.selectedPitch = keys[Math.floor(Math.random() * keys.length)];
    // Aim inside or borderline
    RG.aimX = (Math.random() * 0.62) - 0.31;
    RG.aimZ = 0.44 + Math.random() * 0.56;
    RG.releaseQuality = 'GOOD';
    RG.releaseMultiplier = 1.0;
    launchRivals3DPitch();
  }
}

function lockPinpointRelease() {
  if (RG.phase !== 'pinpoint_ring') return;
  const btn = document.getElementById('btn-rivals-pitch-main');
  if (btn) btn.textContent = '⚾ 啟動縮圈投球 (Pitch)';

  // Target sweet spot ring radius is 0.28
  const diff = Math.abs(RG.ringRadius - 0.28);
  if (diff <= 0.09 || RG.isClutchActive) {
    RG.releaseQuality = 'PERFECT';
    RG.releaseMultiplier = 1.25;
    addClutchEnergy(18);
    showRivalsBanner('✨ PERFECT 完美放球！球威與變化幅度 +25%！', 1600);
  } else if (diff <= 0.22) {
    RG.releaseQuality = 'GOOD';
    RG.releaseMultiplier = 1.0;
    showRivalsBanner('👍 GOOD 良好放球！', 1200);
  } else {
    RG.releaseQuality = 'WILD';
    RG.releaseMultiplier = 0.7;
    // Wild pitch drifts toward center or dirt!
    RG.aimZ += (Math.random() < 0.5 ? -0.35 : 0.22);
    showRivalsBanner('⚠️ 失投！(Release Miss)', 1400);
  }
  launchRivals3DPitch();
}

function launchRivals3DPitch() {
  RG.phase = 'pitch_flight';
  const pInfo = RIVALS_PITCHES[RG.selectedPitch];
  const opp = RIVALS_OPPONENTS[RG.opponentIdx];
  const clutchBoost = (RG.isClutchActive && RG.userRole === 'pitcher') ? 8 : 0;
  const spd = Math.round(pInfo.speed + (RG.userRole === 'batter' ? opp.velMod : clutchBoost));
  RG.currentSpeedKmh = spd;

  // Compute 3D trajectory so that starting aim is (RG.aimX - breakX, RG.aimZ - breakZ) and Magnus curves it into (RG.aimX, RG.aimZ)
  const breakMult = RG.releaseMultiplier;
  const startSightX = RG.aimX - pInfo.breakX * breakMult;
  const startSightZ = RG.aimZ - pInfo.breakZ * breakMult;

  const v0 = spd / 3.6;
  const distToPlate = 14.0;
  const tEst = distToPlate / v0;
  const x0 = -0.14, y0 = 0, z0 = 1.50;

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

    gvx += 0;
    gvz += -9.81 * dt;
    gx += gvx * dt;
    gy += gvy * dt;
    gz += gvz * dt;
  }

  RG.pitchIdx = 0;
  document.getElementById('rivals-tele-pitch').textContent = `${spd} km/h (${pInfo.short})`;
  document.getElementById('rivals-tele-hit').textContent = '--';
  document.getElementById('rivals-tele-dist').textContent = '--';

  if (RG.animId) cancelAnimationFrame(RG.animId);
  function flightLoop() {
    RG.pitchIdx += 2;
    const idx = Math.min(RG.pitchIdx, RG.pitchPts.length - 1);
    const curP = RG.pitchPts[idx];

    // If user is Pitcher, AI Batter decides whether to swing near plate
    if (RG.userRole === 'pitcher' && !RG.swingTriggered && curP.y >= 13.4 && curP.y <= 14.1) {
      const oppSkill = RIVALS_OPPONENTS[RG.opponentIdx].aiSkill;
      const inStrikeZone = !curP.bounced && Math.abs(curP.x) <= 0.34 && curP.z >= 0.42 && curP.z <= 1.04;
      const swingProb = inStrikeZone ? (0.78 - (RG.releaseQuality === 'PERFECT' ? 0.12 : 0)) : (0.32 - (RG.releaseQuality === 'PERFECT' ? -0.15 : 0));
      if (Math.random() < swingProb) {
        const err = (1 - oppSkill) * (RG.releaseQuality === 'PERFECT' ? 0.38 : 0.22);
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

// ==================== BATTING & SWEET SPOT COLLISION ====================
function triggerRivalsSwing() {
  if (RG.phase !== 'pitch_flight' || RG.swingTriggered) return;
  RG.swingTriggered = true;

  const idx = Math.min(RG.pitchIdx, RG.pitchPts.length - 1);
  const curP = RG.pitchPts[idx];

  // Timing evaluation: ideal contact plane is y = 13.85m
  const yDiff = curP.y - 13.85;
  const distXZ = Math.hypot(curP.x - RG.batX, curP.z - RG.batZ);
  const maxContactRadius = RG.swingPowerMode === 'contact' ? 0.30 : 0.23;

  if (Math.abs(yDiff) <= 1.65 && distXZ <= maxContactRadius) {
    // HIT CONTACT!
    const isSweetSpot = distXZ <= 0.095 && Math.abs(yDiff) <= 0.55;
    const isCrit = isSweetSpot || (RG.isClutchActive && RG.userRole === 'batter');
    RG.isClutchActive = false;
    RivalsSFX.playBatHit(isCrit);

    // Compute realistic launch angle from vertical offset (dz = ball.z - bat.z)
    const dz = curP.z - RG.batZ;
    let launchDeg = 15 - dz * 195;
    if (isCrit) launchDeg = Math.max(12, Math.min(31, launchDeg)); // Sweet spot line drive / HR angle
    launchDeg = Math.max(-22, Math.min(64, launchDeg));

    // Exit velocity (km/h)
    const timingQuality = Math.max(0, 1 - Math.abs(yDiff) / 1.7);
    const centerQuality = Math.max(0, 1 - distXZ / maxContactRadius);
    let exitVelo = Math.round(74 + (timingQuality * 0.4 + centerQuality * 0.6) * 44 + (RG.swingPowerMode === 'power' ? 9 : 0) + (isCrit ? 10 : 0));

    // Spray angle (-42 deg Left Field to +42 deg Right Field)
    const sprayDeg = Math.max(-42, Math.min(42, yDiff * 26 + (curP.x - RG.batX) * 75));

    RG.swingTimingText = Math.abs(yDiff) < 0.45 ? '⚡ PERFECT TIMING!' : (yDiff < 0 ? '◀ 拉打 (EARLY)' : '推打 (LATE) ▶');
    RG.lastContactInfo = { isCrit, exitVelo, launchDeg: Math.round(launchDeg), x: curP.x, z: curP.z };

    if (RG.userRole === 'batter') addClutchEnergy(isCrit ? 30 : 15);

    // Brief dramatic slow-mo contact flash before switching to 3D Stadium Camera!
    RG.phase = 'contact_slowmo';
    RG.contactFlashTimer = isCrit ? 22 : 10;
    showRivalsBanner(isCrit ? `💥 完美咬中甜蜜點！初速 ${exitVelo} km/h・仰角 ${Math.round(launchDeg)}°` : `🏏 擊出！初速 ${exitVelo} km/h・仰角 ${Math.round(launchDeg)}°`, 2000);

    if (RG.animId) cancelAnimationFrame(RG.animId);
    function slowMoLoop() {
      RG.contactFlashTimer--;
      renderRivalsCanvas();
      if (RG.contactFlashTimer > 0) {
        RG.animId = requestAnimationFrame(slowMoLoop);
      } else {
        startRivalsFieldPlay(launchDeg, exitVelo, sprayDeg);
      }
    }
    RG.animId = requestAnimationFrame(slowMoLoop);
  } else {
    // SWING AND A MISS!
    RG.isClutchActive = false;
    RG.swingTimingText = Math.abs(yDiff) > 1.65 ? (yDiff < 0 ? '💨 太早揮棒 (TOO EARLY)' : '💨 太晚揮棒 (TOO LATE)') : '💨 揮棒落空 (MISS)';
    showRivalsBanner(RG.swingTimingText, 1600);
  }
}

function resolveRivalsPitchTaken() {
  RG.phase = 'pre_pitch';
  const plateP = RG.pitchPts.find(p => p.y >= 14.0) || RG.pitchPts[RG.pitchPts.length - 1];
  const inZone = !plateP.bounced && Math.abs(plateP.x) <= 0.33 && plateP.z >= 0.44 && plateP.z <= 1.02;

  if (RG.swingTriggered || inZone) {
    RG.strikes++;
    if (!RG.swingTriggered) {
      showRivalsBanner('🟡 好球進壘！(STRIKE)', 1500);
      setRivalsLog(`⚾ <strong>好球進壘！</strong> ${RIVALS_PITCHES[RG.selectedPitch].name} 壓在好球帶邊緣！`);
    }
    if (RG.strikes >= 3) {
      RG.strikes = 0;
      RG.balls = 0;
      if (RG.userRole === 'pitcher') addClutchEnergy(25);
      recordRivalsOut('🔥 三振出局 (STRIKEOUT)！');
    }
  } else {
    RG.balls++;
    if (RG.userRole === 'batter') addClutchEnergy(10);
    showRivalsBanner('🟢 壞球選得好！(BALL)', 1500);
    setRivalsLog(plateP.bounced ? '👀 <strong>選球漂亮！</strong> 這顆變化球提前落地彈跳變成挖地瓜壞球！' : '👀 <strong>選球精準！</strong> 壞球偏出九宮格好球帶！');
    if (RG.balls >= 4) {
      RG.balls = 0;
      RG.strikes = 0;
      showRivalsBanner('🚶 四壞球保送推進！(WALK)', 2000);
      advanceRivalsWalk();
    }
  }
  updateRivalsHUD();
  renderRivalsCanvas();
}

// ==================== 3D STADIUM FIELD PLAY, BOUNCE/ROLL & THROWING ====================
function startRivalsFieldPlay(launchDeg, exitVelo, sprayDeg) {
  RG.phase = 'field_play';
  RG.cameraMode = 'field';

  const backspin = launchDeg < 6 ? -0.55 : 0.85;
  const sim = simulateBattedBallPhysics(launchDeg, exitVelo, backspin, sprayDeg);
  RG.fieldPts = sim.pts;
  RG.fieldBounces = sim.bounces;
  RG.fieldIdx = 0;
  RG.particles = [];

  document.getElementById('rivals-tele-hit').textContent = `${exitVelo} km/h / ${Math.round(launchDeg)}°`;
  document.getElementById('rivals-tele-dist').textContent = `飛 ${sim.carryDist}m / 總 ${sim.totalDist}m`;

  // Initialize active runners on basepaths
  RG.activeRunners = [];
  const isFlyBall = launchDeg >= 22 && sim.carryDist < 75;
  const shouldTagUpWait = isFlyBall && RG.outs < 2;

  // Existing runners on 3B (index 2), 2B (index 1), 1B (index 0)
  for (let b = 2; b >= 0; b--) {
    if (RG.occupiedBases[b]) {
      const baseNum = b + 1;
      // Force play or 2 outs -> run immediately; fly ball <2 outs -> wait at base for Tag Up!
      const forced = (b === 0) || (b === 1 && RG.occupiedBases[0]) || (b === 2 && RG.occupiedBases[1] && RG.occupiedBases[0]);
      const target = (shouldTagUpWait && !forced) ? baseNum : baseNum + 1;
      RG.activeRunners.push({
        id: 'R' + baseNum,
        startBase: baseNum,
        pos: baseNum + (shouldTagUpWait ? 0.05 : 0.12), // small lead off
        targetBase: target,
        safe: false,
        out: false
      });
    }
  }
  // Batter-runner starting from Home (0 -> 1)
  RG.activeRunners.push({
    id: '打者',
    startBase: 0,
    pos: 0.0,
    targetBase: sim.carryDist >= 75 ? 4 : (sim.totalDist >= 55 && launchDeg < 26 ? 2 : 1),
    safe: false,
    out: false
  });

  updateRivalsHUD();
  setRivalsLog('🏟️ <strong>球打進場內！</strong> 觀察空中拋物線、紅土/草地連續彈跳與摩擦滾動軌跡！可隨時指揮跑者或傳球！');

  if (RG.animId) cancelAnimationFrame(RG.animId);
  let lastBounceCount = 0;

  function stadiumLoop() {
    if (RG.phase !== 'field_play') return;

    // 1. Advance ball along physics trajectory unless held by a fielder
    if (!RG.ballHolder && !RG.thrownBall) {
      RG.fieldIdx = Math.min(RG.fieldIdx + 1, RG.fieldPts.length - 1);
      const pt = RG.fieldPts[RG.fieldIdx];
      RG.ballPos = { x: pt.x, y: pt.y, z: pt.z, state: pt.state, dist: pt.dist };

      // Check if a new bounce occurred to spawn dirt/grass particles & sound
      const curBounces = RG.fieldBounces.filter(b => pt.dist >= b.dist).length;
      if (curBounces > lastBounceCount) {
        lastBounceCount = curBounces;
        RivalsSFX.playBounce();
        spawnBounceParticles(pt.x, pt.y, pt.dist < 26);
      }

      // Check Home Run over 75m fence!
      if (pt.dist >= 75 && pt.state === 'air') {
        finishHomeRun(sim.carryDist);
        return;
      }
    }

    // 2. Move Fielders toward ball (or cover bases)
    updateFieldersAndCheckCatch(launchDeg, sim.carryDist);

    // 3. Update Thrown Ball in flight if any
    if (RG.thrownBall) {
      RG.thrownBall.progress += 0.055;
      if (RG.thrownBall.progress >= 1.0) {
        RivalsSFX.playMittPop();
        handleThrowArrival(RG.thrownBall.targetBase);
      }
    }

    // 4. Advance Base Runners
    let anyRunnerMoving = false;
    RG.activeRunners.forEach(r => {
      if (r.out) return;
      if (Math.abs(r.pos - r.targetBase) > 0.015) {
        anyRunnerMoving = true;
        const dir = r.targetBase > r.pos ? 1 : -1;
        const speedStep = (RG.didSlide && r.targetBase - r.pos < 0.35) ? 0.022 : 0.0145;
        r.pos += dir * speedStep;
        if ((dir > 0 && r.pos >= r.targetBase) || (dir < 0 && r.pos <= r.targetBase)) {
          r.pos = r.targetBase;
          if (r.pos >= 4) {
            r.safe = true;
          }
        }
      }
    });

    // Check if Slide QTE should pop up for batter/runner when throw is heading to their target base
    if (RG.userRole === 'batter' && RG.thrownBall && !RG.didSlide) {
      RG.slideQteAvailable = true;
    } else {
      RG.slideQteAvailable = false;
    }
    const slideBtn = document.getElementById('btn-rivals-slide');
    if (slideBtn) slideBtn.classList.toggle('animate-bounce', RG.slideQteAvailable);

    renderRivalsCanvas();

    // Check if play has settled
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
  for (let i = 0; i < 8; i++) {
    RG.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3.5,
      vy: (Math.random() - 0.5) * 3.5,
      life: 18,
      color: isDirt ? '#d97706' : '#4ade80'
    });
  }
}

function updateFieldersAndCheckCatch(launchDeg, carryDist) {
  if (RG.ballHolder || RG.thrownBall) return;

  // Find closest fielder to current ball position
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

  // Move closest fielder toward ball; move other infielders to cover 1B, 2B, 3B!
  RG.fielders.forEach(f => {
    if (f === closestF) {
      const ang = Math.atan2(RG.ballPos.y - f.y, RG.ballPos.x - f.x);
      const step = f.speed * 0.042;
      f.x += Math.cos(ang) * step;
      f.y += Math.sin(ang) * step;
    } else {
      // Cover bases
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

  // Check if Dive QTE is available for Pitcher/Defense user
  RG.diveQteAvailable = (RG.userRole === 'pitcher' && RG.ballPos.z < 1.8 && minD > 1.6 && minD < 4.2);
  RG.diveFielder = closestF;
  const diveBtn = document.getElementById('btn-rivals-dive');
  if (diveBtn) diveBtn.classList.toggle('animate-bounce', RG.diveQteAvailable);

  // Check if fielder catches/fields the ball
  if (closestF && minD <= 1.65 && RG.ballPos.z <= 2.3) {
    RivalsSFX.playMittPop();
    RG.ballHolder = closestF;

    if (RG.ballPos.state === 'air' && RG.fieldIdx > 8) {
      // FLY BALL CAUGHT ON THE FLY!
      const batter = RG.activeRunners.find(r => r.startBase === 0);
      if (batter) batter.out = true;
      recordRivalsOut(`🧤 美技接殺！${closestF.pos} 在空中直接接殺飛球！`);

      // Check if any runner on 3B/2B was waiting to Tag Up!
      RG.activeRunners.forEach(r => {
        if (!r.out && r.startBase >= 2 && RG.outs < 3) {
          r.targetBase = r.startBase + 1;
          setRivalsLog(`🏃‍♂️ <strong>高飛犧牲推進 (Tag Up)！</strong> ${r.id} 在野手接球瞬間踩壘起跑衝向下一壘！`);
        }
      });

      if (RG.outs >= 3) {
        concludeFieldPlay();
        return;
      }
    }

    // If AI is on defense (user is batter), AI automatically throws to the lead/target base!
    if (RG.userRole === 'batter') {
      // Find a runner currently between bases
      const movingRunner = RG.activeRunners.find(r => !r.out && Math.abs(r.pos - r.targetBase) > 0.04);
      const targetB = movingRunner ? movingRunner.targetBase : 1;
      setTimeout(() => {
        if (RG.phase === 'field_play' && RG.ballHolder) {
          rivalsThrowToBase(targetB);
        }
      }, 180);
    } else {
      setRivalsLog(`🧤 <strong>${closestF.pos} 接到球了！</strong> 請立即點擊下方按鈕選擇要傳往 <strong>一壘 / 二壘 / 三壘 / 本壘</strong>！`);
    }
  }
}

function triggerRivalsDiveQTE() {
  if (!RG.diveFielder || RG.ballHolder) return;
  const d = Math.hypot(RG.ballPos.x - RG.diveFielder.x, RG.ballPos.y - RG.diveFielder.y);
  if (d <= 4.6) {
    RG.diveFielder.x = RG.ballPos.x;
    RG.diveFielder.y = RG.ballPos.y;
    RG.ballHolder = RG.diveFielder;
    RivalsSFX.playMittPop();
    addClutchEnergy(20);
    showRivalsBanner(`🦸‍♂️ ${RG.diveFielder.pos} 超級飛撲攔截成功！快選擇傳球壘包！`, 1800);
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
  // Check if any runner is heading to baseNum and hasn't reached it yet
  const runner = RG.activeRunners.find(r => !r.out && r.targetBase === baseNum);
  if (runner) {
    const distRemaining = Math.abs(runner.targetBase - runner.pos);
    const slideBonus = RG.didSlide ? 0.08 : 0.0;
    if (distRemaining > (0.04 + slideBonus)) {
      runner.out = true;
      const baseNames = ['本壘', '一壘', '二壘', '三壘', '本壘'];
      recordRivalsOut(`⚡ 傳球刺殺出局！球比跑者早一步到達${baseNames[baseNum]}！`);

      // Double play opportunity! If < 3 outs and batter is still running to 1B
      if (RG.outs < 3 && baseNum === 2) {
        const batter = RG.activeRunners.find(r => !r.out && r.targetBase === 1 && r.pos < 0.96);
        if (batter && RG.userRole === 'batter') {
          const b2 = getBaseCoordsMeters(2);
          const b1 = getBaseCoordsMeters(1);
          RG.thrownBall = { fromX: b2.x, fromY: b2.y, toX: b1.x, toY: b1.y, progress: 0, targetBase: 1 };
        }
      }
    } else {
      showRivalsBanner(RG.didSlide ? '💨 神級滑壘 SAFE！閃過觸殺！' : '🙌 SAFE！跑者先踏上壘包！', 1600);
      if (RG.didSlide && RG.userRole === 'batter') addClutchEnergy(15);
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
  showRivalsBanner('🏃‍♂️ 指揮跑者：全員全力衝刺下一壘！', 1400);
}

function commandRivalsRunnersHold() {
  if (RG.phase !== 'field_play') return;
  RG.activeRunners.forEach(r => {
    if (!r.out && r.startBase > 0) {
      r.targetBase = Math.max(r.startBase, Math.round(r.pos));
    }
  });
  showRivalsBanner('🛑 指揮跑者：踩住壘包等待／回壘！', 1400);
}

function triggerRivalsSlideQTE() {
  if (RG.phase !== 'field_play') return;
  RG.didSlide = true;
  showRivalsBanner('🦶 發動曲腿滑壘 (Figure-4 Slide)！衝刺速度加成＋閃避觸殺！', 1500);
}

function finishHomeRun(carryDist) {
  RivalsSFX.playCheer();
  let runs = 1;
  RG.occupiedBases.forEach(occ => { if (occ) runs++; });
  if (RG.userRole === 'batter') RG.scoreUser += runs;
  else RG.scoreCpu += runs;

  RG.occupiedBases = [false, false, false];
  RG.balls = 0;
  RG.strikes = 0;
  RG.phase = 'pre_pitch';
  RG.cameraMode = 'duel';
  showRivalsBanner(`🎆 驚天動地全壘打！飛行 ${carryDist} 公尺，進帳 ${runs} 分！`, 3200);
  setRivalsLog(`🎆 <strong>HOME RUN 全壘打！</strong> 小球直接飛越 75m 外野全壘打牆，一口氣帶有 <strong>${runs} 分打點</strong>！`);
  updateRivalsHUD();
  renderRivalsCanvas();
}

function concludeFieldPlay() {
  // Rebuild occupiedBases and tally runs scored (pos >= 4 and not out)
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
    showRivalsBanner(`🎉 跑者衝回本壘得 ${runsScored} 分！`, 2200);
  }

  RG.occupiedBases = newBases;
  RG.balls = 0;
  RG.strikes = 0;
  RG.phase = 'pre_pitch';
  setTimeout(() => {
    RG.cameraMode = 'duel';
    updateRivalsHUD();
    renderRivalsCanvas();
  }, 900);
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
  showRivalsBanner(msg, 2000);
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
    setTimeout(() => {
      showRivalsBanner('🔄 三人出局！攻守交換！', 2200);
      updateRivalsHUD();
    }, 1100);
  }
  updateRivalsHUD();
}

// ==================== BROADCAST RENDERER (DUEL CAM + 3D STADIUM CAM + PIP RADAR) ====================
function renderRivalsCanvas() {
  const canvas = document.getElementById('rivalsBroadcastCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (RG.cameraMode === 'duel') {
    drawRivalsDuelCamera(ctx, W, H);
    drawRivalsPipDiamond(ctx, W - 155, 16, 138, 138);
  } else {
    drawRivalsStadiumCamera(ctx, W, H);
  }
}

function drawRivalsDuelCamera(ctx, W, H) {
  // 1. Stadium Night Sky & Floodlights
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 175);
  skyGrad.addColorStop(0, '#060a12');
  skyGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, 175);

  // Stadium lights glow
  [160, 440, 720].forEach(lx => {
    const g = ctx.createRadialGradient(lx, 32, 2, lx, 32, 65);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx, 32, 65, 0, Math.PI * 2);
    ctx.fill();
  });

  // Outfield wall & turf
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 152, W, 24);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 176, W, H - 176);

  // 3D Projection helper: y in [0 (mound) .. 14.0 (home plate)]
  const cx = W * 0.46;
  const baseY = 365;
  const proj = (x, y, z) => {
    const depth = Math.max(1.15, 16.1 - y);
    const scale = 395 / depth;
    return {
      px: cx + x * scale,
      py: baseY - (z - 0.55) * scale - (14.0 - y) * 3.1,
      scale
    };
  };

  // Dirt Circle around Home Plate & Pitcher's Mound
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(cx, 415, 290, 82, 0, 0, Math.PI * 2);
  ctx.fill();

  const moundP = proj(0, 0, 0);
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.ellipse(moundP.px, moundP.py, 68, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated Pitcher on Mound
  const pitchAnimOffset = RG.phase === 'pitch_flight' ? Math.min(1, RG.pitchIdx / 15) : 0;
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(moundP.px, moundP.py - 42, 7, 0, Math.PI * 2);
  ctx.moveTo(moundP.px, moundP.py - 35);
  ctx.lineTo(moundP.px, moundP.py - 14);
  ctx.lineTo(moundP.px - 9, moundP.py);
  ctx.moveTo(moundP.px, moundP.py - 14);
  ctx.lineTo(moundP.px + 9 + pitchAnimOffset * 6, moundP.py);
  ctx.moveTo(moundP.px, moundP.py - 28);
  ctx.lineTo(moundP.px - 14 + pitchAnimOffset * 26, moundP.py - 36 + pitchAnimOffset * 10);
  ctx.stroke();

  // Batter Boxes & Home Plate Pentagon
  const hp = proj(0, 13.75, 0);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(hp.px - 36, hp.py);
  ctx.lineTo(hp.px + 36, hp.py);
  ctx.lineTo(hp.px + 36, hp.py + 14);
  ctx.lineTo(hp.px, hp.py + 28);
  ctx.lineTo(hp.px - 36, hp.py + 14);
  ctx.closePath();
  ctx.fill();

  // 3D Strike Zone Frame at y = 14.0m (x: -0.33..+0.33, z: 0.44..1.02)
  const szTL = proj(-0.33, 14.0, 1.02);
  const szBR = proj(0.33, 14.0, 0.44);
  const szW = szBR.px - szTL.px;
  const szH = szBR.py - szTL.py;

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(szTL.px, szTL.py, szW, szH);

  // 9-grid inner lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(szTL.px + (szW / 3) * i, szTL.py);
    ctx.lineTo(szTL.px + (szW / 3) * i, szTL.py + szH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(szTL.px, szTL.py + (szH / 3) * i);
    ctx.lineTo(szTL.px + szW, szTL.py + (szH / 3) * i);
    ctx.stroke();
  }

  // If Pitcher Mode (Pre-pitch or Pinpoint Ring): Draw Break Preview Arrow & Shrinking Timing Ring!
  const pInfo = RIVALS_PITCHES[RG.selectedPitch];
  if (RG.userRole === 'pitcher' && (RG.phase === 'pre_pitch' || RG.phase === 'pinpoint_ring')) {
    const startAim = proj(RG.aimX - pInfo.breakX, 14.0, RG.aimZ - pInfo.breakZ);
    const finalAim = proj(RG.aimX, 14.0, RG.aimZ);

    // Ghost start circle
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(startAim.px, startAim.py, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Curved break arrow from startAim to finalAim
    ctx.strokeStyle = pInfo.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startAim.px, startAim.py);
    ctx.lineTo(finalAim.px, finalAim.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target Sweet Spot Bullseye Ring (radius = 24px corresponds to ringRadius = 0.28)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(finalAim.px, finalAim.py, 24, 0, Math.PI * 2);
    ctx.stroke();

    if (RG.phase === 'pinpoint_ring') {
      const shrinkPx = Math.max(4, RG.ringRadius * 85);
      const isSweet = Math.abs(RG.ringRadius - 0.28) <= 0.09;
      ctx.strokeStyle = isSweet ? '#4ade80' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(finalAim.px, finalAim.py, shrinkPx, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw Pitch 3D Trajectory Ribbon, Gravity Comparison Line, Ground Shadow & Spinning Ball
  if (RG.pitchPts.length > 0) {
    const maxI = Math.min(RG.pitchIdx, RG.pitchPts.length - 1);

    // 1. Gravity-only reference line (subtle dashed)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= maxI; i++) {
      const gp = RG.pitchGravityPts[i];
      const gpr = proj(gp.x, gp.y, gp.z);
      if (i === 0) ctx.moveTo(gpr.px, gpr.py);
      else ctx.lineTo(gpr.px, gpr.py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Ground Shadow & Glowing Magnus 3D Trail
    for (let i = 1; i <= maxI; i++) {
      const p0 = RG.pitchPts[i - 1];
      const p1 = RG.pitchPts[i];
      const pr0 = proj(p0.x, p0.y, p0.z);
      const pr1 = proj(p1.x, p1.y, p1.z);

      const sh0 = proj(p0.x, p0.y, 0);
      const sh1 = proj(p1.x, p1.y, 0);
      ctx.strokeStyle = 'rgba(0,0,0,0.38)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sh0.px, sh0.py);
      ctx.lineTo(sh1.px, sh1.py);
      ctx.stroke();

      ctx.strokeStyle = p1.bounced ? '#34d399' : pInfo.color;
      ctx.lineWidth = Math.max(2, (pr1.scale / 150) * 5.2);
      ctx.beginPath();
      ctx.moveTo(pr0.px, pr0.py);
      ctx.lineTo(pr1.px, pr1.py);
      ctx.stroke();
    }

    // 3. Dynamic Ball Landing Predictor Circle inside Strike Zone (Rivals signature feature!)
    const platePt = RG.pitchPts[RG.pitchPts.length - 1];
    const predPr = proj(platePt.x, 14.0, platePt.z);
    const flightRatio = maxI / RG.pitchPts.length;
    if (RG.phase === 'pitch_flight') {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(predPr.px, predPr.py, Math.max(12, (1 - flightRatio) * 48 + 12), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Spinning 3D Baseball
    const curP = RG.pitchPts[maxI];
    const curPr = proj(curP.x, curP.y, curP.z);
    const ballR = Math.max(4, (curPr.scale / 155) * 13.5);
    drawSpinningBaseball(ctx, curPr.px, curPr.py, ballR, maxI * 0.65, pInfo.color);
  }

  // Draw Batter 3D Bat Cursor & Sweet Spot (in Batter Mode)
  const batPr = proj(RG.batX, 14.0, RG.batZ);
  const outerRad = RG.swingPowerMode === 'contact' ? 44 : 33;
  ctx.strokeStyle = RG.swingTriggered ? '#facc15' : '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(batPr.px, batPr.py, outerRad, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Sweet Spot Circle
  ctx.fillStyle = RG.swingPowerMode === 'power' ? 'rgba(244, 63, 94, 0.45)' : 'rgba(56, 189, 248, 0.35)';
  ctx.beginPath();
  ctx.arc(batPr.px, batPr.py, 15, 0, Math.PI * 2);
  ctx.fill();

  // Bat barrel visual
  ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.beginPath();
  ctx.roundRect(batPr.px - 46, batPr.py - 9, 92, 18, 9);
  ctx.fill();

  // Contact Slow-Mo Spark Burst!
  if (RG.phase === 'contact_slowmo' && RG.lastContactInfo) {
    const cp = proj(RG.lastContactInfo.x, 14.0, RG.lastContactInfo.z);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cp.px + Math.cos(ang) * 12, cp.py + Math.sin(ang) * 12);
      ctx.lineTo(cp.px + Math.cos(ang) * 42, cp.py + Math.sin(ang) * 42);
      ctx.stroke();
    }
  }

  // Left-side Timing Gauge Bar (Rivals style vertical timing indicator)
  drawRivalsTimingBar(ctx, 26, 175, 22, 195);
}

function drawRivalsTimingBar(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Perfect sweet spot zone near bottom-middle
  const sweetY = y + h * 0.72;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.fillRect(x + 2, sweetY - 16, w - 4, 32);

  // Moving ball timing marker
  if (RG.pitchPts.length > 0) {
    const ratio = Math.min(1, RG.pitchIdx / (RG.pitchPts.length * 0.92));
    const markerY = y + 12 + ratio * (h - 24);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x + w / 2, markerY, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('揮棒時機', x + w / 2, y - 8);
}

function drawRivalsPipDiamond(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  const cx = x + w / 2;
  const hy = y + h - 22;
  const b1 = { x: cx + 36, y: hy - 36 };
  const b2 = { x: cx, y: hy - 72 };
  const b3 = { x: cx - 36, y: hy - 36 };

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, hy);
  ctx.lineTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.lineTo(b3.x, b3.y);
  ctx.closePath();
  ctx.stroke();

  [b1, b2, b3].forEach((b, idx) => {
    ctx.fillStyle = RG.occupiedBases[idx] ? '#facc15' : '#ffffff';
    ctx.fillRect(b.x - 6, b.y - 6, 12, 12);
  });

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('壘包狀態雷達', cx, y + 18);
}

function drawRivalsStadiumCamera(ctx, W, H) {
  // Full 3D Stadium Broadcast View for Batted Ball, Bounces, Rolling, Fielders & Baserunners!
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, W, H);

  // Mow stripes on outfield grass
  ctx.fillStyle = '#166534';
  for (let r = 15; r <= 75; r += 12) {
    ctx.beginPath();
    ctx.arc(W / 2, 415, r * 4.5, -0.76 * Math.PI, -0.24 * Math.PI);
    ctx.lineWidth = 18;
    ctx.strokeStyle = 'rgba(22, 101, 52, 0.45)';
    ctx.stroke();
  }

  const hx = W / 2, hy = 415, sc = 4.55;
  const toScreen = (x, y, z = 0) => ({
    px: hx + x * sc,
    py: hy - y * sc - z * 3.8,
    groundY: hy - y * sc
  });

  // Outfield Home Run Fence at 75m
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(hx, hy, 75 * sc, -0.76 * Math.PI, -0.24 * Math.PI);
  ctx.stroke();

  // Infield Dirt Fan (26m)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(hx, hy + 10);
  ctx.arc(hx, hy, 26 * sc, -0.76 * Math.PI, -0.24 * Math.PI);
  ctx.closePath();
  ctx.fill();

  // Inner Grass Diamond
  const b1 = toScreen(13.5, 13.5);
  const b2 = toScreen(0, 27.0);
  const b3 = toScreen(-13.5, 13.5);
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(hx, hy - 10);
  ctx.lineTo(b1.px - 10, b1.py);
  ctx.lineTo(b2.px, b2.py + 10);
  ctx.lineTo(b3.px + 10, b3.py);
  ctx.closePath();
  ctx.fill();

  // Foul lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + 53 * sc, hy - 53 * sc);
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - 53 * sc, hy - 53 * sc);
  ctx.stroke();

  // Bases
  [b1, b2, b3, { px: hx, py: hy }].forEach(b => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.px - 7, b.py - 7, 14, 14);
  });

  // 1. Draw Batted Ball Trajectory Lines:
  //    - Ground Shadow Line
  //    - 3D Air Flight Curve (Yellow Solid)
  //    - Dirt/Grass Bounce Arcs (Green Solid + Bounce Rings)
  //    - Turf Friction Rolling Trail (Blue Dotted)
  if (RG.fieldPts.length > 0) {
    const maxI = Math.min(RG.fieldIdx, RG.fieldPts.length - 1);

    // Shadow line on turf
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= maxI; i++) {
      const p = RG.fieldPts[i];
      const sp = toScreen(p.x, p.y, 0);
      if (i === 0) ctx.moveTo(sp.px, sp.groundY);
      else ctx.lineTo(sp.px, sp.groundY);
    }
    ctx.stroke();

    // 3D Trajectory segments
    for (let i = 1; i <= maxI; i++) {
      const p0 = RG.fieldPts[i - 1];
      const p1 = RG.fieldPts[i];
      const s0 = toScreen(p0.x, p0.y, p0.z);
      const s1 = toScreen(p1.x, p1.y, p1.z);

      if (p1.state === 'air') {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.8;
        ctx.setLineDash([]);
      } else if (p1.state === 'bouncing') {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3.2;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.2;
        ctx.setLineDash([4, 4]);
      }
      ctx.beginPath();
      ctx.moveTo(s0.px, s0.py);
      ctx.lineTo(s1.px, s1.py);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Bounce Rings on Ground
    const curP = RG.fieldPts[maxI];
    RG.fieldBounces.forEach((b, idx) => {
      if (curP.dist >= b.dist) {
        const bp = toScreen(b.x, b.y, 0);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bp.px, bp.groundY, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  // 2. Draw Dirt/Grass Splash Particles
  RG.particles.forEach(pt => {
    if (pt.life > 0) {
      pt.x += pt.vx * 0.1;
      pt.y += pt.vy * 0.1;
      pt.life--;
      const sp = toScreen(pt.x, pt.y, 0.2);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(sp.px, sp.py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Draw Active Base Runners
  RG.activeRunners.forEach(r => {
    if (r.out) return;
    const rxy = getRunnerXY(r.pos);
    const sp = toScreen(rxy.x, rxy.y, 0);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(sp.px, sp.py, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.id, sp.px, sp.py - 12);
  });

  // 4. Draw Fielders
  RG.fielders.forEach(f => {
    const fp = toScreen(f.x, f.y, 0);
    ctx.fillStyle = (RG.ballHolder === f) ? '#10b981' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(fp.px, fp.py, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.pos, fp.px, fp.py - 10);
  });

  // 5. Draw Ball (either in field or being thrown to a base)
  if (RG.thrownBall) {
    const tb = RG.thrownBall;
    const bx = tb.fromX + (tb.toX - tb.fromX) * tb.progress;
    const by = tb.fromY + (tb.toY - tb.fromY) * tb.progress;
    const spFrom = toScreen(tb.fromX, tb.fromY, 1.0);
    const spCur = toScreen(bx, by, 1.2);

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spFrom.px, spFrom.py);
    ctx.lineTo(spCur.px, spCur.py);
    ctx.stroke();

    drawSpinningBaseball(ctx, spCur.px, spCur.py, 7, tb.progress * 20, '#f43f5e');
  } else {
    const bSp = toScreen(RG.ballPos.x, RG.ballPos.y, RG.ballPos.z);
    // Ground shadow under ball
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(bSp.px, bSp.groundY, 5, 0, Math.PI * 2);
    ctx.fill();

    drawSpinningBaseball(ctx, bSp.px, bSp.py, 7, RG.fieldIdx * 0.6, '#ef4444');
  }

  // Legend Overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(14, 14, 240, 70, 10);
  ctx.fill();
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#facc15';
  ctx.fillText('━ 黃色實線：3D 空中飛行拋物線', 24, 34);
  ctx.fillStyle = '#34d399';
  ctx.fillText('━ 綠色實線＋黃圈：紅土/草地連續彈跳', 24, 52);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('┅ 藍色虛線：草皮摩擦減速滾動軌跡', 24, 70);
}

// Setup Mouse/Touch/Keyboard bindings for Rivals Broadcast Canvas
window.addEventListener('DOMContentLoaded', () => {
  initRivalsFielders();
  const canvas = document.getElementById('rivalsBroadcastCanvas');
  if (!canvas) return;

  const updatePointer = (e) => {
    if (RG.cameraMode !== 'duel') return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const cx = ((clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((clientY - rect.top) / rect.height) * canvas.height;

    const scale = 395 / 2.1;
    const xM = Math.max(-0.52, Math.min(0.52, (cx - canvas.width * 0.46) / scale));
    const zM = Math.max(0.22, Math.min(1.22, (365 - cy) / scale + 0.55));

    if (RG.userRole === 'batter') {
      RG.batX = xM;
      RG.batZ = zM;
    } else if (RG.phase === 'pre_pitch') {
      RG.aimX = xM;
      RG.aimZ = zM;
    }
    if (RG.phase === 'pre_pitch') renderRivalsCanvas();
  };

  canvas.addEventListener('mousemove', updatePointer);
  canvas.addEventListener('touchmove', (e) => updatePointer(e), { passive: true });

  canvas.addEventListener('mousedown', (e) => {
    updatePointer(e);
    if (RG.phase === 'pinpoint_ring') {
      lockPinpointRelease();
    } else if (RG.phase === 'pitch_flight' && RG.userRole === 'batter') {
      triggerRivalsSwing();
    } else if (RG.phase === 'pre_pitch' && RG.userRole === 'batter') {
      startRivalsPitchAction();
    }
  });

  window.addEventListener('keydown', (e) => {
    const secGame = document.getElementById('sec-game');
    if (!secGame || secGame.classList.contains('hidden')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (RG.phase === 'pinpoint_ring') lockPinpointRelease();
      else if (RG.phase === 'pitch_flight') triggerRivalsSwing();
      else if (RG.phase === 'pre_pitch') startRivalsPitchAction();
    }
  });

  updateRivalsHUD();
  renderRivalsCanvas();
});
