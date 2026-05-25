// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== AUDIO SYSTEM =====
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.backgroundTimer = null;
        this.initAudio();
    }
    
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    playSound(type) {
        if (this.isMuted || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        switch(type) {
            case 'jump':
                this.playTone(800, 0.1, 0.08);
                this.playTone(600, 0.08, 0.05, 0.05);
                break;
            case 'slide':
                this.playTone(400, 0.1, 0.1);
                this.playTone(350, 0.08, 0.08, 0.04);
                break;
            case 'coin':
                this.playTone(1000, 0.05, 0.05);
                this.playTone(1200, 0.05, 0.05, 0.06);
                break;
            case 'powerup':
                this.playTone(1400, 0.08, 0.06);
                this.playTone(1600, 0.08, 0.06, 0.1);
                this.playTone(1800, 0.08, 0.06, 0.2);
                break;
            case 'hit':
                this.playTone(200, 0.15, 0.1);
                this.playTone(150, 0.15, 0.12, 0.05);
                break;
            case 'gameOver':
                this.playTone(500, 0.15, 0.1);
                this.playTone(400, 0.15, 0.1, 0.15);
                this.playTone(300, 0.15, 0.15, 0.3);
                break;
        }
    }
    
    playTone(frequency, duration, attackTime = 0, delayTime = 0) {
        if (this.isMuted || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime + delayTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = frequency;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    }
    
    playBackgroundMusic() {
        if (this.isMuted || !this.audioContext) return;
        this.stopBackgroundMusic();
        
        const notes = [
            { freq: 523, time: 0.5 },    // C5
            { freq: 587, time: 0.4 },    // D5
            { freq: 659, time: 0.5 },    // E5
            { freq: 587, time: 0.4 },    // D5
            { freq: 523, time: 0.8 },    // C5
            { freq: 659, time: 0.4 },    // E5
            { freq: 784, time: 0.8 },    // G5
        ];
        
        const sequenceLength = notes.reduce((sum, note) => sum + note.time, 0);
        const playSequence = () => {
            const now = this.audioContext.currentTime;
            notes.forEach((note, index) => {
                const scheduleTime = now + notes.slice(0, index).reduce((sum, n) => sum + n.time, 0);
                this.scheduleNote(note.freq, note.time * 0.6, scheduleTime);
            });
        };
        
        playSequence();
        this.backgroundTimer = setInterval(() => {
            if (gameState === GAME_STATE.PLAYING && !this.isMuted) {
                playSequence();
            }
        }, sequenceLength * 1000);
    }
    
    scheduleNote(frequency, duration, startTime) {
        if (this.isMuted || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = frequency;
        osc.type = 'square';
        
        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }
    
    stopBackgroundMusic() {
        if (this.backgroundTimer) {
            clearInterval(this.backgroundTimer);
            this.backgroundTimer = null;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else if (gameState === GAME_STATE.PLAYING) {
            this.playBackgroundMusic();
        }
        return this.isMuted;
    }
}

const audioManager = new AudioManager();

// Game states
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Player object
const player = {
    x: 0,
    y: 0,
    width: 28,
    height: 45,
    lane: 1, // 0 = left, 1 = center, 2 = right
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    slidingTimer: 0,
    maxSlideTime: 15,
    color: '#ff6b35',
    draw() {
        // Draw personaje realista
        if (this.isSliding) {
            // Cabeza
            ctx.fillStyle = '#f4a460';
            ctx.beginPath();
            ctx.arc(this.x + 14, this.y + 10, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Cuerpo en posición de deslizamiento
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + 15, this.width, 15);
            
            // Piernas
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 2, this.y + 30, 10, 10);
            ctx.fillRect(this.x + 16, this.y + 30, 10, 10);
        } else {
            // Cabeza
            ctx.fillStyle = '#f4a460';
            ctx.beginPath();
            ctx.arc(this.x + 14, this.y + 8, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Ojos
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 11, this.y + 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 17, this.y + 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Cuerpo
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 3, this.y + 17, this.width - 6, 18);
            
            // Brazos
            ctx.fillStyle = '#f4a460';
            ctx.fillRect(this.x - 2, this.y + 18, 5, 8);
            ctx.fillRect(this.x + this.width - 3, this.y + 18, 5, 8);
            
            // Piernas
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 5, this.y + 35, 6, 10);
            ctx.fillRect(this.x + this.width - 11, this.y + 35, 6, 10);
            
            // Zapatos
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.x + 5, this.y + 44, 6, 3);
            ctx.fillRect(this.x + this.width - 11, this.y + 44, 6, 3);
        }
    },
    update() {
        const laneWidth = canvas.width / 3;
        this.x = this.lane * laneWidth + laneWidth / 2 - this.width / 2;
        
        // Jump physics
        if (this.isJumping) {
            this.velocityY += 0.5; // gravity
            this.y += this.velocityY;
            
            if (this.y >= canvas.height - 80) {
                this.y = canvas.height - 80;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }
        
        // Sliding
        if (this.isSliding) {
            this.slidingTimer++;
            if (this.slidingTimer >= this.maxSlideTime) {
                this.isSliding = false;
                this.slidingTimer = 0;
            }
        }
    },
    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.isJumping = true;
            this.velocityY = -12;
            playSound('jump');
        }
    },
    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slidingTimer = 0;
            playSound('slide');
        }
    },
    moveLane(direction) {
        const newLane = this.lane + direction;
        if (newLane >= 0 && newLane <= 2) {
            this.lane = newLane;
        }
    }
};

// Game variables
let gameState = GAME_STATE.MENU;
let score = 0;
let coins = 0;
let level = 1;
let gameSpeed = 3;
let maxGameSpeed = 8;
let obstacles = [];
let coins_collected = [];
let powerUps = [];
let lastObstacleY = 0;
let lastCoinY = 0;
let distanceTraveled = 0;
let gameStartTime = 0;

// Input handling
const keys = {};
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'ArrowLeft') {
        player.moveLane(-1);
    } else if (e.key === 'ArrowRight') {
        player.moveLane(1);
    } else if (e.key === 'ArrowUp') {
        player.jump();
    } else if (e.key === ' ') {
        if (gameState === GAME_STATE.MENU) {
            startGame();
        }
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'ArrowDown') {
        if (gameState === GAME_STATE.PLAYING) {
            player.slide();
        }
    }
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 30) {
            player.moveLane(1);
            touchStartX = touchEndX;
        } else if (diffX < -30) {
            player.moveLane(-1);
            touchStartX = touchEndX;
        }
    } else {
        // Vertical swipe
        if (diffY < -30) {
            player.jump();
            touchStartY = touchEndY;
        } else if (diffY > 30) {
            player.slide();
            touchStartY = touchEndY;
        }
    }
    
    e.preventDefault();
});

// Obstacle class
class Obstacle {
    constructor(lane) {
        this.lane = lane;
        this.laneWidth = canvas.width / 3;
        this.x = lane * this.laneWidth + this.laneWidth / 2 - 20;
        this.y = -40;
        this.width = 40;
        this.height = 40;
        this.type = Math.random() > 0.5 ? 'train' : 'bar';
        this.color = this.type === 'train' ? '#8b4513' : '#c0392b';
    }
    
    draw() {
        if (this.type === 'train') {
            // Vagón de tren realista
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x - 5, this.y, this.width + 10, this.height - 5);
            
            // Ventana
            ctx.fillStyle = '#87ceeb';
            ctx.fillRect(this.x + 5, this.y + 5, 20, 15);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 5, this.y + 5, 20, 15);
            
            // Ruedas
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(this.x + 5, this.y + this.height - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width + 5, this.y + this.height - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalles
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 5, this.y, this.width + 10, this.height - 5);
        } else {
            // Barra de metal realista
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(this.x, this.y, this.width, this.height - 5);
            
            // Sombra
            ctx.fillStyle = '#a93226';
            ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 9);
            
            // Brillos metálicos
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x + 2, this.y + 2, 3, this.height - 9);
            
            // Base
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(this.x - 3, this.y + this.height - 5, this.width + 6, 5);
        }
    }
    
    update() {
        this.y += gameSpeed;
    }
    
    isOffScreen() {
        return this.y > canvas.height;
    }
}

// Coin class
class Coin {
    constructor(lane) {
        this.lane = lane;
        this.laneWidth = canvas.width / 3;
        this.x = lane * this.laneWidth + this.laneWidth / 2 - 10;
        this.y = -30;
        this.width = 20;
        this.height = 20;
        this.rotation = 0;
        this.color = '#ffd700';
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Moneda realista
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Brillo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-2, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Símbolo $
        ctx.fillStyle = '#cc8800';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    }
    
    update() {
        this.y += gameSpeed;
        this.rotation += 0.1;
    }
    
    isOffScreen() {
        return this.y > canvas.height;
    }
}

// PowerUp class
class PowerUp {
    constructor(lane, type) {
        this.lane = lane;
        this.laneWidth = canvas.width / 3;
        this.x = lane * this.laneWidth + this.laneWidth / 2 - 15;
        this.y = -35;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'shield' or 'speed'
        this.rotation = 0;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (this.type === 'shield') {
            // Escudo realista
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(10, -5);
            ctx.lineTo(10, 10);
            ctx.bezierCurveTo(10, 15, 0, 15, 0, 15);
            ctx.bezierCurveTo(0, 15, -10, 15, -10, 10);
            ctx.lineTo(-10, -5);
            ctx.closePath();
            ctx.fill();
            
            // Borde del escudo
            ctx.strokeStyle = '#1a5c3a';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Brillo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-7, -8, 5, 8);
        } else {
            // Rayo de velocidad realista
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(5, -2);
            ctx.lineTo(0, 0);
            ctx.lineTo(8, 12);
            ctx.lineTo(0, 8);
            ctx.lineTo(-6, 16);
            ctx.lineTo(-3, 2);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            
            // Brillo en el rayo
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-2, -8, 4, 6);
        }
        
        ctx.restore();
    }
    
    update() {
        this.y += gameSpeed;
        this.rotation += 0.08;
    }
    
    isOffScreen() {
        return this.y > canvas.height;
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Spawn obstacles
function spawnObstacle() {
    const randomLane = Math.floor(Math.random() * 3);
    const obstacle = new Obstacle(randomLane);
    obstacles.push(obstacle);
    lastObstacleY = obstacle.y;
}

// Spawn coins
function spawnCoin() {
    const randomLane = Math.floor(Math.random() * 3);
    const coin = new Coin(randomLane);
    coins_collected.push(coin);
    lastCoinY = coin.y;
}

// Spawn power-ups
function spawnPowerUp() {
    const randomLane = Math.floor(Math.random() * 3);
    const type = Math.random() > 0.5 ? 'shield' : 'speed';
    const powerUp = new PowerUp(randomLane, type);
    powerUps.push(powerUp);
}

// Sound effects
function playSound(soundType) {
    // Audio feedback
    audioManager.playSound(soundType);
    
    // Visual feedback
    canvas.style.filter = 'brightness(1.2)';
    setTimeout(() => {
        canvas.style.filter = 'brightness(1)';
    }, 50);
}

// Game over
function endGame() {
    gameState = GAME_STATE.GAME_OVER;
    audioManager.stopBackgroundMusic();
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('finalLevel').textContent = level;
}

// Start game
function startGame() {
    gameState = GAME_STATE.PLAYING;
    document.getElementById('startMenu').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    score = 0;
    coins = 0;
    level = 1;
    gameSpeed = 3;
    distanceTraveled = 0;
    obstacles = [];
    coins_collected = [];
    powerUps = [];
    
    player.lane = 1;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 80;
    player.isJumping = false;
    player.isSliding = false;
    player.velocityY = 0;
    
    gameStartTime = Date.now();
    audioManager.initAudio();
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume();
    }
    if (!audioManager.isMuted) {
        audioManager.playBackgroundMusic();
    }
}

// Update game
function update() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    player.update();
    
    // Increase difficulty
    distanceTraveled += gameSpeed;
    level = Math.floor(distanceTraveled / 5000) + 1;
    gameSpeed = Math.min(3 + (level - 1) * 0.3, maxGameSpeed);
    
    // Spawn obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].y > 150) {
        spawnObstacle();
    }
    
    // Spawn coins
    if (coins_collected.length === 0 || coins_collected[coins_collected.length - 1].y > 100) {
        if (Math.random() > 0.6) {
            spawnCoin();
        }
    }
    
    // Spawn power-ups randomly
    if (Math.random() > 0.98) {
        spawnPowerUp();
    }
    
    // Update obstacles
    obstacles = obstacles.filter(obs => {
        obs.update();
        
        // Collision with obstacles
        if (checkCollision(player, obs)) {
            if (!player.isSliding && !player.isJumping) {
                playSound('hit');
                endGame();
            } else if (player.isSliding) {
                // Can pass under obstacles while sliding
                return true;
            }
        }
        
        if (obs.isOffScreen()) {
            score += 10;
            return false;
        }
        return true;
    });
    
    // Update coins
    coins_collected = coins_collected.filter(coin => {
        coin.update();
        
        if (checkCollision(player, coin)) {
            coins += 1;
            score += 50;
            playSound('coin');
            return false;
        }
        
        if (coin.isOffScreen()) {
            return false;
        }
        return true;
    });
    
    // Update power-ups
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        
        if (checkCollision(player, powerUp)) {
            activatePowerUp(powerUp.type);
            return false;
        }
        
        if (powerUp.isOffScreen()) {
            return false;
        }
        return true;
    });
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
    document.getElementById('level').textContent = level;
}

// Activate power-ups
function activatePowerUp(type) {
    if (type === 'shield') {
        score += 100;
        showPowerUpNotification('🛡️ ¡ESCUDO ACTIVADO!');
        const originalColor = player.color;
        player.color = '#27ae60';
        setTimeout(() => {
            player.color = originalColor;
        }, 5000);
    } else if (type === 'speed') {
        score += 100;
        showPowerUpNotification('⚡ ¡VELOCIDAD MÁXIMA!');
        const originalColor = player.color;
        player.color = '#f39c12';
        gameSpeed += 2;
        setTimeout(() => {
            player.color = originalColor;
            gameSpeed = Math.min(3 + (level - 1) * 0.3, maxGameSpeed);
        }, 5000);
    }
}

// Show power-up notification
function showPowerUpNotification(text) {
    const indicator = document.getElementById('powerUpIndicator');
    document.getElementById('powerUpText').textContent = text;
    indicator.classList.remove('hidden');
    setTimeout(() => {
        indicator.classList.add('hidden');
    }, 2000);
}

// Draw game
function draw() {
    // Draw sky background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#B0D4F0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    drawClouds();
    
    // Draw distant buildings (parallax effect)
    ctx.fillStyle = 'rgba(150, 150, 150, 0.15)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(i * 120 - 30, 40, 100, 90);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(i * 120 - 30, 40, 100, 90);
        
        // Windows
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                ctx.fillRect(i * 120 - 20 + j * 25, 55 + k * 20, 15, 12);
            }
        }
    }
    
    // Draw sun
    ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 180, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 80, 65, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw metro platform
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, canvas.height - 120, canvas.width, 50);
    
    // Platform shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, canvas.height - 118, canvas.width, 3);
    
    // Draw concrete texture
    ctx.fillStyle = '#9D8B7E';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, canvas.height - 118, 35, 45);
    }
    
    // Draw sleepers (traviesas)
    ctx.fillStyle = '#654321';
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.fillRect(i, canvas.height - 100, 40, 12);
    }
    ctx.globalAlpha = 1;
    
    // Draw rails with shine
    ctx.strokeStyle = '#A9A9A9';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    
    // Rail left
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 95);
    ctx.lineTo(canvas.width, canvas.height - 95);
    ctx.stroke();
    
    // Rail shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 92);
    ctx.lineTo(canvas.width, canvas.height - 92);
    ctx.stroke();
    
    // Rail right
    ctx.strokeStyle = '#A9A9A9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 75);
    ctx.lineTo(canvas.width, canvas.height - 75);
    ctx.stroke();
    
    // Rail shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 72);
    ctx.lineTo(canvas.width, canvas.height - 72);
    ctx.stroke();
    
    // Draw lane dividers with glow
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 25]);
    
    for (let i = 1; i < 3; i++) {
        const x = (canvas.width / 3) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height - 120);
        ctx.stroke();
    }
    
    // Bright lane dividers
    ctx.strokeStyle = '#FFE57F';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
        const x = (canvas.width / 3) * i + 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height - 120);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw safety line at bottom with glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(0, canvas.height - 125, canvas.width, 3);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, canvas.height - 127, canvas.width, 2);
    
    // Draw side walls with texture
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, canvas.height - 70, 4, 70);
    ctx.fillRect(canvas.width - 4, canvas.height - 70, 4, 70);
    
    // Wall highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, canvas.height - 70, 2, 70);
    ctx.fillRect(canvas.width - 2, canvas.height - 70, 2, 70);
    
    // Draw obstacles
    obstacles.forEach(obs => obs.draw());
    
    // Draw coins
    coins_collected.forEach(coin => coin.draw());
    
    // Draw power-ups
    powerUps.forEach(pu => pu.draw());
    
    // Draw player
    player.draw();
    
    // Draw HUD - Velocity indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(5, 5, 120, 30);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(5, 5, 120, 30);
    
    ctx.fillStyle = '#00FF88';
    ctx.font = 'bold 10px Courier New';
    ctx.fillText('VEL:', 12, 18);
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(`${gameSpeed.toFixed(1)}x`, 45, 20);
    
    // Draw distance counter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(canvas.width - 125, 5, 120, 30);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(canvas.width - 125, 5, 120, 30);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px Courier New';
    ctx.fillText('DIST:', canvas.width - 115, 18);
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(`${(distanceTraveled / 100).toFixed(0)}m`, canvas.width - 60, 20);
}

// Draw clouds
function drawClouds() {
    const time = Date.now() * 0.0001;
    
    for (let i = 0; i < 3; i++) {
        const x = (i * 150 + time * 80) % (canvas.width + 100);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        
        ctx.beginPath();
        ctx.arc(x, 60 + i * 40, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 25, 55 + i * 40, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 50, 60 + i * 40, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners for buttons
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

document.getElementById('audioToggleBtn').addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    const btn = document.getElementById('audioToggleBtn');
    btn.textContent = isMuted ? 'Música: OFF' : 'Música: ON';
});

// Start the game loop
gameLoop();

// Initialize
console.log('🎮 Track Dash iniciado!');
