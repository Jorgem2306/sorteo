// Lista exacta de items proporcionados
const items = [
    "1 mes spoty",
    "1 mes Netflix",
    "1 mes Disney",
    "pase de batalla fortnite",
    "gift cards xbox (10€)",
    "gift cards play (10€)",
    "gift cards steam (10€)",
    "1 mes Xbox",
    "1 mes play",
    "1 mes game pass pc",
    "1 sub en el canal",
    "Baile de 500pv Fortnite",
    "Vbucks 10€",
    "Robux (300)",
    "Robux (1000)",
    "Suerte la próxima vez",
    "gift cards Amazon 5€",
    "gift cards Amazon 15€",
    "Nitro Discord 1 mes",
    "Gift card de Apple",
    "Gift card de Play Store",
    "Shark GTAV",
    "Caja Misteriosa",
    "Paypal 10$",
    "Jackpot $$$"
];

// Paleta de colores inspirada en la imagen
const sliceColors = [
    "#00a8e8", // Cyan / Azul eléctrico
    "#e60067", // Fucsia brillante
    "#ff7a00", // Naranja cálido
    "#7b1fa2", // Violeta / Morado
    "#1a1a1a", // Negro grafito
    "#e50914"  // Rojo intenso
];

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const centerSpin = document.getElementById("centerSpin");
const prizeModal = document.getElementById("prizeModal");
const prizeText = document.getElementById("prizeText");
const closeModal = document.getElementById("closeModal");

// --- API DE AUDIO WEB PARA SINTETIZAR LOS SONIDOS ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Sonido tipo "click" corto
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
    
    // Arpegio de victoria
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

const totalSegments = items.length;
const arcSize = (2 * Math.PI) / totalSegments;

let currentRotation = 0; // Ángulo acumulado en radianes
let isSpinning = false;
let isIdleSpinning = true;
let idleAnimationFrame;

// Dibuja la ruleta en el Canvas
function drawWheel() {
    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, width, height);

    items.forEach((item, index) => {
        const angle = currentRotation + index * arcSize;
        const color = sliceColors[index % sliceColors.length];

        // Dibujar gajo
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, angle, angle + arcSize);
        ctx.lineTo(center, center);
        ctx.fill();

        // Borde fino blanco/dorado entre gajos
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.stroke();
        ctx.restore();

        // Dibujar texto dentro del segmento
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 19px Arial";
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = 4;

        // Limitar tamaño del texto si es muy largo
        let text = item.toUpperCase();
        if (text.length > 22) {
            text = text.substring(0, 20) + "..";
        }

        // Posicionar el texto cerca del borde exterior
        ctx.fillText(text, radius - 25, 6);

        // Pequeño círculo decorativo en el borde exterior del gajo
        ctx.beginPath();
        ctx.arc(radius - 12, 0, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffde59";
        ctx.fill();

        ctx.restore();
    });
}

// Función de animación con curva de desaceleración (Ease-out Cubic)
function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    isIdleSpinning = false;
    cancelAnimationFrame(idleAnimationFrame);

    // Activar audio
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Elegir premio aleatorio
    const winningIndex = Math.floor(Math.random() * totalSegments);

    /*
      Cálculo del ángulo final:
      El puntero se encuentra en la parte superior (270° o 3*PI/2 rad).
      Queremos que el centro del segmento ganador quede exactamente debajo del puntero.
    */
    const pointerAngle = 3 * Math.PI / 2;
    const targetAngleCenter = winningIndex * arcSize + (arcSize / 2);

    // Mínimo 5 a 8 vueltas completas para que dure unos 5 segundos
    const extraRounds = Math.floor(Math.random() * 3 + 6) * (2 * Math.PI);

    // Calculamos cuánto rotar partiendo de la posición actual
    const normalizedCurrent = currentRotation % (2 * Math.PI);
    let targetRotation = (pointerAngle - targetAngleCenter) - normalizedCurrent;

    while (targetRotation < 0) {
        targetRotation += 2 * Math.PI;
    }

    const startRotation = currentRotation;
    const totalDistance = extraRounds + targetRotation;
    const duration = 5000; // 5 segundos
    let startTime = null;
    let lastTick = Math.floor(currentRotation / arcSize);

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        currentRotation = startRotation + totalDistance * easeOutCubic(progress);
        
        // Detectar si el puntero pasó de un segmento a otro para hacer el sonido
        const currentTick = Math.floor(currentRotation / arcSize);
        if (currentTick > lastTick) {
            playTick();
            lastTick = currentTick;
        }

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            playWinSound(); // Sonido de victoria
            showPrize(items[winningIndex]);
        }
    }

    requestAnimationFrame(animate);
}

function showPrize(prize) {
    prizeText.textContent = prize;
    prizeModal.classList.add("active");
    
    // Lanzar confeti al ganar
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#ffde59', '#e60067', '#00a8e8', '#ffffff']
        });
    }
}

closeModal.addEventListener("click", () => {
    prizeModal.classList.remove("active");
    // Volver a girar lento al cerrar la ventana de premio
    isIdleSpinning = true;
    idleAnimate();
});

centerSpin.addEventListener("click", spinWheel);
canvas.addEventListener("click", spinWheel);

// Animación de giro lento mientras está inactiva
function idleAnimate() {
    if (!isSpinning && isIdleSpinning) {
        currentRotation += 0.002; // Velocidad de giro lento (ajustable)
        drawWheel();
        idleAnimationFrame = requestAnimationFrame(idleAnimate);
    }
}

// Iniciar giro lento inicial
idleAnimate();
