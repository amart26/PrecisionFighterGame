/**
 * 2D Fighter Game Boilerplate
 * Uses HTML5 Canvas for rendering and standard Game Loop pattern.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.7;
const TERMINAL_VELOCITY = 15;
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576;
const GROUND_HEIGHT = 96;

// Adjust canvas resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// UI Elements
const playerHealthBar = document.getElementById('player-health');
const enemyHealthBar = document.getElementById('enemy-health');
const timerDisplay = document.getElementById('timer-box');
const resultDisplay = document.getElementById('result-display');

let timer = 60;
let timerId;
let gameRunning = true;

// -----------------------------------------------------------------------------
// CLASSES
// -----------------------------------------------------------------------------

class Sprite {
    constructor({ position, velocity, color = 'red', offset = { x: 0, y: 0 } }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.lastKey = '';
        
        // Combat Box
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 100,
            height: 50
        };
        
        this.color = color;
        this.isAttacking = false;
        this.health = 100;
        this.isDead = false;
        
        // Animation States (Simulated for boilerplate)
        this.direction = 1; // 1 = right, -1 = left
    }

    draw() {
        // Draw Character
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Debug: Draw Attack Box when attacking
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(
                this.attackBox.position.x, 
                this.attackBox.position.y, 
                this.attackBox.width, 
                this.attackBox.height
            );
        }
        
        // Simple Eye/Face to show direction
        ctx.fillStyle = 'black';
        const eyeX = this.direction === 1 ? this.position.x + 35 : this.position.x + 5;
        ctx.fillRect(eyeX, this.position.y + 20, 10, 10);
    }

    update() {
        this.draw();

        if (this.isDead) return;

        // Attack Box follows character
        // If facing right
        if (this.direction === 1) {
            this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        } else {
            // Flip attack box to left side
            this.attackBox.position.x = this.position.x - this.attackBox.width + this.width - this.attackBox.offset.x;
        }
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

        // Apply Position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Gravity
        if (this.position.y + this.height + this.velocity.y >= canvas.height - GROUND_HEIGHT) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height - GROUND_HEIGHT;
            this.isJumping = false;
        } else {
            this.velocity.y += GRAVITY;
        }

        // Screen Boundaries
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;
    }

    attack() {
        this.isAttacking = true;
        // Simple timeout to reset attack state
        setTimeout(() => {
            this.isAttacking = false;
        }, 100);
    }
    
    takeHit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }
}

// -----------------------------------------------------------------------------
// GAME OBJECTS
// -----------------------------------------------------------------------------

const player = new Sprite({
    position: { x: 100, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#818cf8',
    offset: { x: 0, y: 50 }
});

const enemy = new Sprite({
    position: { x: 800, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#f87171',
    offset: { x: 0, y: 50 }
});
enemy.direction = -1; // Face left initially

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowUp: { pressed: false }
};

// -----------------------------------------------------------------------------
// MECHANICS
// -----------------------------------------------------------------------------

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

function determineWinner({ player, enemy, timerId }) {
    clearTimeout(timerId);
    gameRunning = false;
    resultDisplay.style.display = 'flex';

    if (player.health === enemy.health) {
        resultDisplay.innerHTML = 'Tie';
    } else if (player.health > enemy.health) {
        resultDisplay.innerHTML = 'Player 1 Wins';
    } else {
        resultDisplay.innerHTML = 'Enemy Wins';
    }
}

function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000);
        timer--;
        timerDisplay.innerHTML = timer;
    }

    if (timer === 0) {
        determineWinner({ player, enemy, timerId });
    }
}

// Simple AI implementation
function updateEnemyAI() {
    if (enemy.isDead || !gameRunning) {
        enemy.velocity.x = 0;
        return;
    }

    const detectionRange = 400;
    const distanceX = player.position.x - enemy.position.x;
    const distance = Math.abs(distanceX);

    enemy.velocity.x = 0;

    // Move towards player
    if (distance < detectionRange && distance > 60) {
        if (distanceX > 0) {
            enemy.velocity.x = 2;
            enemy.direction = 1;
        } else {
            enemy.velocity.x = -2;
            enemy.direction = -1;
        }
    } else if (distance <= 60) {
        // Face player
        enemy.direction = distanceX > 0 ? 1 : -1;
        
        // Random Attack
        if (Math.random() < 0.02) {
            enemy.attack();
        }
    }
}

// -----------------------------------------------------------------------------
// MAIN LOOP
// -----------------------------------------------------------------------------

function animate() {
    window.requestAnimationFrame(animate);
    
    // Clear Screen
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Background Elements (Floor)
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    
    // Grid decoration
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for(let i=0; i<canvas.width; i+=100) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - GROUND_HEIGHT);
        ctx.lineTo(i - 100, canvas.height);
        ctx.stroke();
    }

    // Update Entities
    player.update();
    enemy.update();

    // Reset Velocity
    player.velocity.x = 0;

    // Player Movement
    if (!player.isDead && gameRunning) {
        if (keys.a.pressed && player.lastKey === 'a') {
            player.velocity.x = -5;
            player.direction = -1;
        } else if (keys.d.pressed && player.lastKey === 'd') {
            player.velocity.x = 5;
            player.direction = 1;
        }
    }

    // Enemy AI
    updateEnemyAI();

    // Collision Detection: Player hitting Enemy
    if (
        rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
        player.isAttacking && gameRunning
    ) {
        player.isAttacking = false; // Reset attack immediately on hit
        if (!enemy.isDead) {
            enemy.takeHit(10);
            enemyHealthBar.style.width = enemy.health + '%';
        }
    }

    // Collision Detection: Enemy hitting Player
    if (
        rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
        enemy.isAttacking && gameRunning
    ) {
        enemy.isAttacking = false;
        if (!player.isDead) {
            player.takeHit(10);
            playerHealthBar.style.width = player.health + '%';
        }
    }

    // End Game Check
    if (enemy.health <= 0 || player.health <= 0) {
        determineWinner({ player, enemy, timerId });
    }
}

// -----------------------------------------------------------------------------
// INPUT HANDLING
// -----------------------------------------------------------------------------

window.addEventListener('keydown', (event) => {
    if (!gameRunning) return;

    switch (event.key.toLowerCase()) {
        case 'd':
            keys.d.pressed = true;
            player.lastKey = 'd';
            break;
        case 'a':
            keys.a.pressed = true;
            player.lastKey = 'a';
            break;
        case 'w':
            if (player.velocity.y === 0) player.velocity.y = -15; // Jump
            break;
        case ' ':
            player.attack();
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }
});

// Start Game
decreaseTimer();
animate();