// --- API DE AUDIO WEB PARA SINTETIZAR LOS SONIDOS ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
}

function playWinSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'triangle';
    const now = audioCtx.currentTime;

    oscillator.frequency.setValueAtTime(440, now); // A4
    oscillator.frequency.setValueAtTime(554.37, now + 0.1); // C#5
    oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E5
    oscillator.frequency.setValueAtTime(880, now + 0.3); // A5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.setValueAtTime(0.3, now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    oscillator.start(now);
    oscillator.stop(now + 1.5);
}
// ----------------------------------------------------

// Precargar imágenes generadas de regalos
const imgPink = new Image(); imgPink.src = 'gift_pink.jpg';
const imgPurple = new Image(); imgPurple.src = 'gift_purple.jpg';
const imgCyan = new Image(); imgCyan.src = 'gift_cyan.jpg';
const imgYellow = new Image(); imgYellow.src = 'gift_yellow.jpg';
const imgBlue = new Image(); imgBlue.src = 'gift_blue.jpg';

// Función para difuminar bordes de la imagen (con caché para mejor rendimiento)
function drawFeatheredImage(ctx, img, x, y, size) {
    if (!img.featheredCanvas) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');

        // Dibujar la imagen completa
        tempCtx.drawImage(img, 0, 0, size, size);

        // Crear gradiente para borrar los bordes suavemente
        const cx = size / 2;
        const cy = size / 2;
        // Comienza a difuminar desde el 60% del radio hasta el borde
        const grad = tempCtx.createRadialGradient(cx, cy, size * 0.35, cx, cy, size * 0.5);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); // Mantener intacto el centro
        grad.addColorStop(1, 'rgba(0,0,0,1)'); // Borrar completamente el borde

        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.fillStyle = grad;
        tempCtx.fillRect(0, 0, size, size);

        img.featheredCanvas = tempCanvas;
    }

    // Dibujar la imagen procesada en el canvas principal
    ctx.drawImage(img.featheredCanvas, x, y, size, size);
}

class Roulette {
    constructor(config) {
        this.canvas = document.getElementById(config.canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.centerSpin = document.getElementById(config.centerId);

        this.items = config.items;
        this.colors = config.colors;
        this.onFinish = config.onFinish;

        this.totalSegments = this.items.length;
        this.arcSize = (2 * Math.PI) / this.totalSegments;

        this.currentRotation = 0;
        this.isSpinning = false;
        this.isIdleSpinning = false;
        this.idleAnimationFrame = null;

        this.initEvents();
        this.drawWheel();
    }

    drawWheel() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const center = width / 2;
        const radius = center - 10;

        this.ctx.clearRect(0, 0, width, height);

        this.items.forEach((item, index) => {
            const angle = this.currentRotation + index * this.arcSize;
            const color = this.colors[index % this.colors.length];

            // Dibujar gajo
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(center, center);
            this.ctx.arc(center, center, radius, angle, angle + this.arcSize);
            this.ctx.lineTo(center, center);


            this.ctx.restore();

            // Dibujar fondo y borde del gajo
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = color;
            this.ctx.moveTo(center, center);
            this.ctx.arc(center, center, radius, angle, angle + this.arcSize);
            this.ctx.lineTo(center, center);
            this.ctx.fill(); // IMPORTANTE: Pintar el color del gajo

            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            this.ctx.stroke();
            this.ctx.restore();

            // Volver a dibujar los iconos por encima del fondo
            if (item === "CAJA MISTERIOSA") {
                let img;
                if (color === "#00e5ff") img = imgCyan;
                else if (color === "#7b1fa2") img = imgPurple;
                else if (color === "#ff4d85") img = imgPink;
                else if (color === "#ffde59") img = imgYellow;
                else img = imgBlue;

                if (img && img.complete) {
                    this.ctx.save();
                    this.ctx.translate(center, center);
                    this.ctx.rotate(angle + this.arcSize / 2); // Rotar hacia el centro del gajo
                    this.ctx.translate(radius * 0.62, 0); // Ajustar posición más hacia el borde (arriba)
                    this.ctx.rotate(Math.PI / 2); // Enderezar la imagen

                    const badgeRadius = 165; // Aumentar tamaño de los regalos

                    // Sombra suave para que el objeto parezca flotar sobre el gajo
                    this.ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowOffsetY = 5;

                    // Dibujar la imagen con bordes completamente difuminados
                    drawFeatheredImage(this.ctx, img, -badgeRadius, -badgeRadius, badgeRadius * 2);

                    this.ctx.shadowColor = "transparent"; // Quitar sombra para el resto

                    // IMPORTANTE: Restaurar el contexto para no romper el canvas!
                    this.ctx.restore();
                }
            }

            // Texto
            this.ctx.save();
            this.ctx.translate(center, center);
            this.ctx.rotate(angle + this.arcSize / 2);

            this.ctx.textAlign = "right";
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 19px Arial";
            this.ctx.shadowColor = "rgba(0,0,0,0.85)";
            this.ctx.shadowBlur = 4;

            if (item !== "CAJA MISTERIOSA") {
                let text = item.toUpperCase();
                if (text.length > 22) {
                    text = text.substring(0, 20) + "..";
                }
                this.ctx.fillText(text, radius - 15, 6);
            }

            // Círculo decorativo exterior
            this.ctx.beginPath();
            this.ctx.arc(radius - 12, 0, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#ffde59";
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.isIdleSpinning = false;
        cancelAnimationFrame(this.idleAnimationFrame);

        if (audioCtx.state === 'suspended') audioCtx.resume();

        const winningIndex = Math.floor(Math.random() * this.totalSegments);
        const pointerAngle = 3 * Math.PI / 2;
        const targetAngleCenter = winningIndex * this.arcSize + (this.arcSize / 2);

        const extraRounds = Math.floor(Math.random() * 3 + 6) * (2 * Math.PI);
        const normalizedCurrent = this.currentRotation % (2 * Math.PI);

        let targetRotation = (pointerAngle - targetAngleCenter) - normalizedCurrent;
        while (targetRotation < 0) {
            targetRotation += 2 * Math.PI;
        }

        const startRotation = this.currentRotation;
        const totalDistance = extraRounds + targetRotation;
        const duration = 5000;
        let startTime = null;
        let lastTick = Math.floor(this.currentRotation / this.arcSize);

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
            this.currentRotation = startRotation + totalDistance * easeOutCubic(progress);

            const currentTick = Math.floor(this.currentRotation / this.arcSize);
            if (currentTick > lastTick) {
                playTick();
                lastTick = currentTick;
            }

            this.drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                if (this.onFinish) this.onFinish(this.items[winningIndex], winningIndex);
            }
        };

        requestAnimationFrame(animate);
    }

    startIdle() {
        this.isIdleSpinning = true;
        const idleAnimate = () => {
            if (!this.isSpinning && this.isIdleSpinning) {
                this.currentRotation += 0.002;
                this.drawWheel();
                this.idleAnimationFrame = requestAnimationFrame(idleAnimate);
            }
        };
        idleAnimate();
    }

    stopIdle() {
        this.isIdleSpinning = false;
        cancelAnimationFrame(this.idleAnimationFrame);
    }

    initEvents() {
        this.centerSpin.addEventListener("click", () => this.spin());
        this.canvas.addEventListener("click", () => this.spin());
    }
}

// Variables globales UI
const mainContainer = document.getElementById("mainWheelContainer");
const mysteryContainer = document.getElementById("mysteryWheelContainer");
const prizeModal = document.getElementById("prizeModal");
const prizeText = document.getElementById("prizeText");
const closeModal = document.getElementById("closeModal");

// Listas de premios
const mainItems = [
    "Vbucks 10€",
    "Robux (300)",
    "Robux (1000)",
    "Suerte la próxima vez",
    "Caja Misteriosa",
    "Te regalo un gift cards Amazon 5€",
    "Te regalo un gift cards Amazon 15€",
    "Te regalo nitro Discord de 1 mes",
    "Te regalo un gift card de Apple",
    "Te regalo un gift card de Play Store",
    "Jackpot $$$",
    "Paypal 10$",
    "Te regalo un mes spotify",
    "Te regalo un mes Netflix",
    "Te regalo un mes Disney",
    "Te regalo un pase de batalla fortnite",
    "Te regalo un gift cards xbox (10€)",
    "Te regalo un gift cards play (10€)",
    "Te regalo un gift cards steam (10€)",
    "Caja Misteriosa",
    "Te regalo un mes Xbox",
    "Te regalo un mes play",
    "Te regalo un mes game pass pc",
    "Te regalo una sub en el canal",
    "Te regalo un baile de 500pv Fortnite",
    "Vbucks 10€"
];

const mainColors = [
    "#00a8e8", "#e60067", "#ff7a00", "#7b1fa2", "#1a1a1a", "#e50914"
];

// Colores de la caja misteriosa (Cyan, Morado, Rosa, Amarillo, Azul)
const mysteryColors = [
    "#00e5ff", "#7b1fa2", "#ff4d85", "#ffde59", "#00a8e8"
];

const mysteryPrizes = [
    "Robux (300) y 1 mes Netflix",             // 0: Verde
    "Baile fortnite 500pv y 1 mes Spotify",    // 1: Morado
    "1 sub y nitro Discord 1 mes",             // 2: Rosa
    "1 sub y pase de batalla fortnite",        // 3: Amarillo
    "Baile fortnite 500pv y 1 mes Xbox o play" // 4: Celeste
];

// Instancias de ruletas
let mainWheel, mysteryWheel;

function showPrize(prizeTextContent, onCloseCallback) {
    prizeText.textContent = prizeTextContent;
    prizeModal.classList.add("active");
    playWinSound();

    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#ffde59', '#e60067', '#00a8e8', '#ffffff']
        });
    }

    closeModal.onclick = () => {
        prizeModal.classList.remove("active");
        if (onCloseCallback) onCloseCallback();
    };
}

// Función de animación de transición (puertas cerrando y abriendo)
function playDoorTransition(onMiddle) {
    const doors = document.getElementById("doorTransition");
    doors.classList.add("active");
    // Forzar reflow para asegurar animación
    void doors.offsetWidth;
    // Cerrar puertas
    doors.classList.add("closed");

    setTimeout(() => {
        // En el momento en que están cerradas, cambiar ruleta
        if (onMiddle) onMiddle();

        // Abrir puertas
        doors.classList.remove("closed");

        setTimeout(() => {
            doors.classList.remove("active");
        }, 800); // Dar tiempo a que terminen de abrirse
    }, 1200); // Mantener cerradas por 1.2s mostrando el logo
}

// Configurar ruleta principal
mainWheel = new Roulette({
    canvasId: 'mainWheelCanvas',
    centerId: 'mainCenterSpin',
    items: mainItems,
    colors: mainColors,
    onFinish: (prize, index) => {
        if (prize === "Caja Misteriosa") {
            // Animación de puertas antes de cambiar
            playDoorTransition(() => {
                mainWheel.stopIdle();
                mainContainer.style.display = 'none';
                mysteryContainer.style.display = 'flex';
                mysteryWheel.startIdle();
            });
        } else {
            showPrize(prize, () => {
                mainWheel.startIdle();
            });
        }
    }
});

// Configurar ruleta misteriosa
mysteryWheel = new Roulette({
    canvasId: 'mysteryWheelCanvas',
    centerId: 'mysteryCenterSpin',
    items: [
        "CAJA MISTERIOSA",
        "CAJA MISTERIOSA",
        "CAJA MISTERIOSA",
        "CAJA MISTERIOSA",
        "CAJA MISTERIOSA"
    ],
    colors: mysteryColors,
    onFinish: (prize, index) => {
        // Enviar el premio mapeado real
        showPrize(mysteryPrizes[index], () => {
            // Regresar a la ruleta principal sin la transición de puertas
            mysteryWheel.stopIdle();
            mysteryContainer.style.display = 'none';
            mainContainer.style.display = 'flex';
            mainWheel.startIdle();
        });
    }
});

// Iniciar animación de la ruleta principal al cargar
mainWheel.startIdle();
