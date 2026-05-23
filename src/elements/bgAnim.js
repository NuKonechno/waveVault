export default function startBg(canvas) {
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let dpr = 1;

    // Базовые параметры для "стандартного" разрешения (например, 1920x1080)
    const BASE_WIDTH = 1920;
    const BASE_HEIGHT = 1080;

    // Параметры, которые будут пересчитываться
    let POINTS = 120;
    let MAX_DIST = 160;
    let POINT_SIZE = 1.5;
    let POINT_SPEED = 0.5;
    let LINE_OPACITY = 0.25;

    let points = [];

    /* ---------- Функция пересчёта параметров под текущее разрешение ---------- */

    function updateParameters() {
        // Коэффициент масштабирования относительно базового разрешения
        const scaleX = w / BASE_WIDTH;
        const scaleY = h / BASE_HEIGHT;
        const scale = Math.min(scaleX, scaleY); // Используем минимальный, чтобы всё помещалось
        
        // Пересчитываем количество точек (пропорционально площади)
        const areaScale = (w * h) / (BASE_WIDTH * BASE_HEIGHT);
        POINTS = Math.max(60, Math.min(300, Math.floor(120 * areaScale)));
        
        // Расстояние для линий (масштабируем относительно меньшей стороны)
        MAX_DIST = Math.max(80, Math.min(300, 160 * Math.min(scaleX, scaleY)));
        
        // Размер точек
        POINT_SIZE = Math.max(1, Math.min(4, 1.5 * scale));
        
        // Скорость движения (чем больше экран, тем быстрее, но с ограничением)
        POINT_SPEED = Math.max(0.2, Math.min(1, 0.5 * scale));
        
        // Прозрачность линий (оставляем базовую или немного корректируем)
        LINE_OPACITY = 0.25;
    }

    /* ---------- POINT (обновлённый) ---------- */

    class Point {
        constructor(x, y) {
            this.x = x ?? Math.random() * w;
            this.y = y ?? Math.random() * h;
            
            // Скорость теперь зависит от размера экрана
            const speed = POINT_SPEED;
            this.vx = (Math.random() - 0.5) * speed;
            this.vy = (Math.random() - 0.5) * speed;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) {
                this.x = 0;
                this.vx *= -1;
            }
            if (this.x > w) {
                this.x = w;
                this.vx *= -1;
            }
            if (this.y < 0) {
                this.y = 0;
                this.vy *= -1;
            }
            if (this.y > h) {
                this.y = h;
                this.vy *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, POINT_SIZE, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.fill();
        }
    }

    /* ---------- Функция пересоздания точек с новыми параметрами ---------- */

    function regeneratePoints() {
        updateParameters(); // Сначала обновляем параметры
        
        const newPoints = [];
        const targetCount = POINTS;
        
        if (points.length > 0 && points.length === targetCount) {
            // Если количество не изменилось, просто масштабируем позиции
            // (этот код не используется сейчас, но оставлю для гибкости)
            for (let i = 0; i < points.length; i++) {
                newPoints.push(new Point(points[i].x, points[i].y));
            }
        } else {
            // Создаём точки заново с новыми параметрами
            for (let i = 0; i < targetCount; i++) {
                newPoints.push(new Point());
            }
        }
        
        points = newPoints;
    }

    /* ---------- resize (обновлённый) ---------- */

    function resize() {
        const oldW = w;
        const oldH = h;
        
        dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;

        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Обновляем параметры под новый размер
        updateParameters();
        
        // Масштабируем или пересоздаём точки
        if (oldW > 0 && oldH > 0 && points.length > 0) {
            const scaleX = w / oldW;
            const scaleY = h / oldH;
            
            // Проверяем, нужно ли менять количество точек
            const newPointCount = POINTS;
            
            if (Math.abs(points.length - newPointCount) > 10) {
                // Если количество сильно изменилось - пересоздаём
                regeneratePoints();
            } else {
                // Иначе просто масштабируем позиции
                for (let i = 0; i < points.length; i++) {
                    points[i].x *= scaleX;
                    points[i].y *= scaleY;
                }
                
                // Корректируем скорости с учётом нового масштаба
                const speedScale = POINT_SPEED / 0.5; // 0.5 - базовая скорость
                for (let i = 0; i < points.length; i++) {
                    points[i].vx = (Math.random() - 0.5) * POINT_SPEED;
                    points[i].vy = (Math.random() - 0.5) * POINT_SPEED;
                }
            }
        } else {
            regeneratePoints();
        }
    }

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    resize();

    /* ---------- BACKGROUND ---------- */

    function drawBackground() {
        ctx.clearRect(0, 0, w, h);

        const grad = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.1,
            w / 2, h / 2, Math.max(w, h) * 0.7
        );

        grad.addColorStop(0, "#0b1b3a");
        grad.addColorStop(1, "#111");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    /* ---------- LINES (обновлённые) ---------- */

    function drawLines() {
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {

                const a = points[i];
                const b = points[j];

                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MAX_DIST) {
                    // Альфа зависит не только от расстояния, но и от текущего MAX_DIST
                    const alpha = (1 - dist / MAX_DIST) * LINE_OPACITY;
                    
                    // Толщина линии тоже может зависеть от расстояния
                    const lineWidth = Math.max(0.5, Math.min(2, 1.5 * (1 - dist / MAX_DIST)));

                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);

                    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                }
            }
        }
    }

    /* ---------- LOOP ---------- */

    let running = true;

    function animate() {
        if (!running) return;
        drawBackground();
        
        if (w > 0 && h > 0 && points.length > 0) {
            for (let i = 0; i < points.length; i++) {
                points[i].update();
            }

            drawLines();

            for (let i = 0; i < points.length; i++) {
                points[i].draw();
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
    
    return function stop() {
        running = false;
    };
}