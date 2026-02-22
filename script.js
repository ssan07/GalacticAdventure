// =========================
// GAME STATES
// =========================
const GAME_STATES = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

// =========================
// SETTINGS OBJECT
// =========================
class Settings {
    constructor() {
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.pipeSpeed = 3;
        this.pipeGap = 180;
        this.spawnRate = 120;

        this.bindUI();
    }

    bindUI() {
        document.getElementById("applySettings").addEventListener("click", () => {
            this.gravity = parseFloat(gravity.value);
            this.jumpForce = parseFloat(jump.value);
            this.pipeSpeed = parseFloat(speed.value);
            this.pipeGap = parseFloat(gap.value);
        });
    }
}

// =========================
// ASSET LOADER
// =========================
class AssetLoader {
    constructor() {
        this.images = {};
    }

    loadImage(name, src) {
        return new Promise(resolve => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.images[name] = img;
                resolve();
            };
        });
    }

    get(name) {
        return this.images[name];
    }
}

// =========================
// SPRITE BASE CLASS
// =========================
class Sprite {
    constructor(x, y, width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

// =========================
// BIRD OBJECT
// =========================
class Bird extends Sprite {
    constructor(game, image) {
        super(100, 250, 40, 40, image);
        this.game = game;
        this.velocity = 0;
        this.rotation = 0;
    }

    update() {
        this.velocity += this.game.settings.gravity;
        this.y += this.velocity;

        this.rotation = Math.min(this.velocity * 3, 90);

        if (this.y + this.height >= this.game.height || this.y <= 0) {
            this.game.setState(GAME_STATES.GAME_OVER);
        }
    }

    jump() {
        this.velocity = this.game.settings.jumpForce;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// =========================
// PIPE OBJECT
// =========================
class Pipe extends Sprite {
    constructor(game, x, topHeight, isTop, image) {
        super(x, isTop ? 0 : topHeight, 70, 400, image);
        this.game = game;
        this.isTop = isTop;
        this.topHeight = topHeight;
        this.markedForDeletion = false;
    }

    update() {
        this.x -= this.game.settings.pipeSpeed;

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }
}

// =========================
// PIPE MANAGER
// =========================
class PipeManager {
    constructor(game) {
        this.game = game;
        this.pipes = [];
        this.counter = 0;
    }

    update() {
        this.counter++;

        if (this.counter % this.game.settings.spawnRate === 0) {
            const topHeight = Math.random() * 250 + 50;

            this.pipes.push(
                new Pipe(this.game, this.game.width, topHeight, true, this.game.assets.get("pipeTop"))
            );

            this.pipes.push(
                new Pipe(this.game, this.game.width, topHeight + this.game.settings.pipeGap, false, this.game.assets.get("pipeBottom"))
            );
        }

        this.pipes.forEach(pipe => {
            pipe.update();
            this.checkCollision(pipe);
        });

        this.pipes = this.pipes.filter(p => !p.markedForDeletion);
    }

    draw(ctx) {
        this.pipes.forEach(pipe => pipe.draw(ctx));
    }

    checkCollision(pipe) {
        const b = this.game.bird.getBounds();

        if (
            b.right > pipe.x &&
            b.left < pipe.x + pipe.width &&
            (b.top < pipe.topHeight || b.bottom > pipe.y)
        ) {
            this.game.setState(GAME_STATES.GAME_OVER);
        }
    }
}

// =========================
// GAME ENGINE
// =========================
class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.width = 500;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.state = GAME_STATES.MENU;
        this.settings = new Settings();
        this.assets = new AssetLoader();

        this.init();
    }

    async init() {
        await Promise.all([
            this.assets.loadImage("bird", "assets/bird.png"),
            this.assets.loadImage("pipeTop", "assets/pipe-top.png"),
            this.assets.loadImage("pipeBottom", "assets/pipe-bottom.png"),
            this.assets.loadImage("bg", "assets/bg.png")
        ]);

        this.bird = new Bird(this, this.assets.get("bird"));
        this.pipeManager = new PipeManager(this);

        this.bindInput();
        this.loop();
    }

    bindInput() {
        window.addEventListener("click", () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.bird.jump();
            } else if (this.state === GAME_STATES.MENU) {
                this.setState(GAME_STATES.PLAYING);
            }
        });
    }

    setState(newState) {
        this.state = newState;
    }

    update() {
        if (this.state !== GAME_STATES.PLAYING) return;

        this.bird.update();
        this.pipeManager.update();
    }

    draw() {
        this.ctx.drawImage(this.assets.get("bg"), 0, 0, this.width, this.height);
        this.bird.draw(this.ctx);
        this.pipeManager.draw(this.ctx);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

new Game();