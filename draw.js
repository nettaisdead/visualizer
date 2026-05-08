const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');

let audioContext, analyser, dataArray;
let smoothedArray;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

async function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 512; 
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        smoothedArray = new Float32Array(bufferLength).fill(0);
        
        document.getElementById('ui').style.display = 'none';
        animate();
    } catch (err) { alert("Включи доступ к аудио вкладки!"); }
}

function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(dataArray);

    // Фон: Глубокая фиолетовая ночь
    ctx.fillStyle = 'rgba(2, 0, 5, 0.15)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const pointsToDraw = Math.floor(dataArray.length * 0.8);
    const sliceWidth = canvas.width / pointsToDraw;
    
    // Сглаживание звука (0.05 - еще медленнее и плавнее)
    const smoothingFactor = 0.05; 
    for (let i = 0; i < pointsToDraw; i++) {
        smoothedArray[i] = smoothedArray[i] * (1 - smoothingFactor) + dataArray[i] * smoothingFactor;
    }

    // Создаем градиент для заполнения (от яркого неона в центре к пустоте)
    const gradient = ctx.createLinearGradient(0, centerY - canvas.height/3, 0, centerY + canvas.height/3);
    gradient.addColorStop(0, 'rgba(188, 19, 254, 0)');      // Верх прозрачный
    gradient.addColorStop(0.5, 'rgba(188, 19, 254, 0.6)');    // Центр яркий
    gradient.addColorStop(1, 'rgba(188, 19, 254, 0)');      // Низ прозрачный

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(188, 19, 254, 0.5)';

    // Рисуем симметричную область заполнения
    function drawFilledWave(side) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY); // Старт в центре

        for (let i = 0; i < pointsToDraw; i++) {
            const v = smoothedArray[i];
            const h = (canvas.height * 0.4) * Math.pow(v / 255, 1.2);
            const x = centerX + (i * sliceWidth / 2) * side;
            const y = centerY - h / 2;

            ctx.lineTo(x, y);
        }

        // Замыкаем фигуру внизу для заполнения
        for (let i = pointsToDraw - 1; i >= 0; i--) {
            const v = smoothedArray[i];
            const h = (canvas.height * 0.4) * Math.pow(v / 255, 1.2);
            const x = centerX + (i * sliceWidth / 2) * side;
            const y = centerY + h / 2;

            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
    }

    // Рисуем правую и левую часть
    drawFilledWave(1);
    drawFilledWave(-1);

    // Тонкая линия-разделитель (горизонт)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    ctx.shadowBlur = 0;
}

startBtn.onclick = () => { if (!audioContext) initAudio(); };

window.addEventListener('touchstart', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
});