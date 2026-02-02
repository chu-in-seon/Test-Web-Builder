class Tetris {
    constructor(canvasId, onGameOver) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onGameOver = onGameOver;
        
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        
        this.canvas.width = this.COLS * this.BLOCK_SIZE;
        this.canvas.height = this.ROWS * this.BLOCK_SIZE;

        this.colors = [
            null,
            '#FF0D72', // T
            '#0DC2FF', // O
            '#0DFF72', // S
            '#F538FF', // Z
            '#FF8E0D', // I
            '#FFE138', // J
            '#3877FF', // L
        ];

        this.pieces = 'ILJOTSZ';
        
        this.animationId = null;
        this.keyDownHandler = null;
        this.keyUpHandler = null;

        this.keys = {
            37: false, // Left
            39: false, // Right
            40: false  // Down
        };
        this.keyTimers = {
            37: 0,
            39: 0
        };
        this.DAS = 150; // Delay Auto Shift (ms)
        this.ARR = 30;  // Auto Repeat Rate (ms)
        this.normalDropInterval = 1000;
        this.fastDropInterval = 50;

        this.reset();
    }

    reset() {
        this.grid = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
        this.score = 0;
        this.dropCounter = 0;
        this.dropInterval = this.normalDropInterval;
        this.lastTime = 0;
        this.player = {
            pos: { x: 0, y: 0 },
            matrix: null,
            score: 0,
        };
        this.isGameOver = false;
        this.isPaused = false;
        
        // Reset key states
        this.keys = { 37: false, 39: false, 40: false };
        this.keyTimers = { 37: 0, 39: 0 };

        this.playerReset();
        this.updateScore();
    }

    createPiece(type) {
        if (type === 'I') {
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        } else if (type === 'L') {
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        } else if (type === 'J') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        } else if (type === 'O') {
            return [
                [4, 4],
                [4, 4],
            ];
        } else if (type === 'Z') {
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        } else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === 'T') {
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    playerReset() {
        const pieces = 'ILJOTSZ';
        this.player.matrix = this.createPiece(pieces[pieces.length * Math.random() | 0]);
        this.player.pos.y = 0;
        this.player.pos.x = (this.grid[0].length / 2 | 0) - (this.player.matrix[0].length / 2 | 0);
        
        if (this.collide(this.grid, this.player)) {
            this.isGameOver = true;
            this.onGameOver(this.player.score);
        }
    }

    collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = this.colors[value];
                    this.ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // Add a simple border effect
                    this.ctx.lineWidth = 0.05;
                    this.ctx.strokeStyle = 'white';
                    this.ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    playerRotate(dir) {
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate(this.player.matrix, dir);
        while (this.collide(this.grid, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate(this.player.matrix, -dir);
                this.player.pos.x = pos;
                return;
            }
        }
    }

    playerDrop() {
        this.player.pos.y++;
        if (this.collide(this.grid, this.player)) {
            this.player.pos.y--;
            this.merge(this.grid, this.player);
            this.playerReset();
            this.arenaSweep();
            this.updateScore();
        }
        this.dropCounter = 0;
    }

    playerHardDrop() {
        while (!this.collide(this.grid, this.player)) {
            this.player.pos.y++;
        }
        this.player.pos.y--;
        this.merge(this.grid, this.player);
        this.playerReset();
        this.arenaSweep();
        this.updateScore();
        this.dropCounter = 0;
    }

    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.grid, this.player)) {
            this.player.pos.x -= dir;
        }
    }

    getPieceBounds(matrix) {
        let minX = matrix[0].length;
        let maxX = -1;
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                if (matrix[y][x] !== 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                }
            }
        }
        return { minX, maxX };
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        this.drawMatrix(this.grid, {x: 0, y: 0});

        const ghostPos = { x: this.player.pos.x, y: this.player.pos.y };
        while (!this.collide(this.grid, { matrix: this.player.matrix, pos: ghostPos })) {
            ghostPos.y++;
        }
        ghostPos.y--; 

        const { minX, maxX } = this.getPieceBounds(this.player.matrix);
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 0.05; 
        this.ctx.setLineDash([0.1, 0.1]); 
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.pos.x + minX, this.player.pos.y + 1); 
        this.ctx.lineTo(this.player.pos.x + minX, ghostPos.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.player.pos.x + maxX + 1, this.player.pos.y + 1); 
        this.ctx.lineTo(this.player.pos.x + maxX + 1, ghostPos.y);
        this.ctx.stroke();
        this.ctx.restore();

        this.ctx.globalAlpha = 0.2;
        this.drawMatrix(this.player.matrix, ghostPos);
        this.ctx.globalAlpha = 1.0;

        this.drawMatrix(this.player.matrix, this.player.pos);
        
        this.ctx.restore();
    }

    arenaSweep() {
        let rowCount = 1;
        outer: for (let y = this.grid.length - 1; y > 0; --y) {
            for (let x = 0; x < this.grid[y].length; ++x) {
                if (this.grid[y][x] === 0) {
                    continue outer;
                }
            }
            
            const row = this.grid.splice(y, 1)[0].fill(0);
            this.grid.unshift(row);
            ++y;
            
            this.player.score += rowCount * 10;
            rowCount *= 2;
        }
    }

    handleInput(deltaTime) {
        // Handle Left/Right DAS (Delayed Auto Shift)
        [37, 39].forEach(key => {
            if (this.keys[key]) {
                this.keyTimers[key] += deltaTime;
                if (this.keyTimers[key] > this.DAS) {
                    while (this.keyTimers[key] > this.DAS + this.ARR) {
                        this.keyTimers[key] -= this.ARR;
                        this.playerMove(key === 37 ? -1 : 1);
                    }
                }
            }
        });
    }

    update(time = 0) {
        if (this.isGameOver || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        // Handle Continuous Input
        this.handleInput(deltaTime);

        // Handle Gravity (Down Key = Fast Drop)
        const currentInterval = this.keys[40] ? this.fastDropInterval : this.normalDropInterval;
        this.dropCounter += deltaTime;
        if (this.dropCounter > currentInterval) {
            this.playerDrop();
            // Optional: reset counter completely or subtract interval
            // Resetting is safer to prevent 'catch up' jumps after lag
            this.dropCounter = 0; 
        }

        this.draw();
        this.animationId = requestAnimationFrame(this.update.bind(this));
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.reset();
        this.update();
        this.setupControls();
    }

    stop() {
        this.isGameOver = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
            this.keyUpHandler = null;
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        if(scoreElement) scoreElement.innerText = this.player.score;
    }

    setupControls() {
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }

        this.keyDownHandler = event => {
            if (this.isGameOver || this.isPaused) return;

            // Prevent default scrolling for game keys
            if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
                event.preventDefault();
            }
            
            // Handle Discrete Actions (Rotate, Hard Drop)
            if (event.keyCode === 81) { // Q - Rotate Left
                this.playerRotate(-1);
            } else if (event.keyCode === 87 || event.keyCode === 38) { // W or Up - Rotate Right
                this.playerRotate(1);
            } else if (event.keyCode === 32) { // Space - Hard Drop
                this.playerHardDrop();
            }

            // Handle Continuous Actions (Set Flag)
            if (event.keyCode === 37 || event.keyCode === 39) {
                if (!this.keys[event.keyCode]) {
                    this.keys[event.keyCode] = true;
                    this.keyTimers[event.keyCode] = 0;
                    this.playerMove(event.keyCode === 37 ? -1 : 1); // Initial Move
                }
            } else if (event.keyCode === 40) { // Down
                this.keys[40] = true;
            }
        };

        this.keyUpHandler = event => {
            if ([37, 39, 40].includes(event.keyCode)) {
                this.keys[event.keyCode] = false;
            }
        };

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }
}