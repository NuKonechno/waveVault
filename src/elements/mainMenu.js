import ProfileScene from "../scenes/profileScene.js";
import parallax from "../effects/parallax.js";

export default function buildRadialMenu(container, manager) {
    container.innerHTML = "";

    const bgImages = [];

    const menuData = [
        {
            text: "Music Library",
            color: "#305CDE",
            image: "./src/assets/menu-library.webp",
            imgScale: 1.2,
            imgOffsetX: 0,
            imgOffsetY: 0,
            textColor: "#fff"
        },
        {
            text: "Search",
            color: "#31C9DE",
            textColor: "#fff"
        },
        
        {
            text: "Profile",
            color: "#2D23B8",
            image: "./src/assets/menu-profile.webp",
            imgScale: 0.8,
            imgOffsetX: -20,
            imgOffsetY: -21,
            textColor: "#fff"
        }
    ];

    const svgNS = "http://www.w3.org/2000/svg";

    const size = 400;
    const center = size / 2;
    const outerRadius = 180;
    const innerRadius = 90;
    const padding = 40;

    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("radial-svg");

    svg.setAttribute(
        "viewBox",
        `${-padding} ${-padding} ${size + padding * 2} ${size + padding * 2}`
    );

    const defs = document.createElementNS(svgNS, "defs");
    svg.appendChild(defs);
    container.appendChild(svg);

    const ctx = { svg, defs, center, size, outerRadius, innerRadius, bgImages, manager };

    // ---------------- BUILD ----------------
    const angleStep = 360 / menuData.length;

    menuData.forEach((item, i) => {
        const start = i * angleStep;
        const end = start + angleStep;

        createSegment(start, end, item, i, ctx);
    });

    const parallaxCleanup = parallax(container, {
        strength: 20,
        children: [
            
        ]
    });

    return function destroy() {
        parallaxCleanup();
        container.innerHTML = "";
    };
}

function createSegment(startAngle, endAngle, data, index, ctx) {
    const { manager } = ctx;
    const svgNS = "http://www.w3.org/2000/svg";
    const { svg, defs, center, size, outerRadius, innerRadius, bgImages } = ctx;

    const mid = (startAngle + endAngle) / 2;
    const push = 15;

    const offset = polarToCartesian(0, 0, push, mid);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const p1 = polarToCartesian(center, center, outerRadius, endAngle);
    const p2 = polarToCartesian(center, center, outerRadius, startAngle);
    const p3 = polarToCartesian(center, center, innerRadius, startAngle);
    const p4 = polarToCartesian(center, center, innerRadius, endAngle);

    const pathData = `
        M ${p1.x} ${p1.y}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${p2.x} ${p2.y}
        L ${p3.x} ${p3.y}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${p4.x} ${p4.y}
        Z
    `;

    const group = document.createElementNS(svgNS, "g");
    const inner = document.createElementNS(svgNS, "g");

    group.classList.add("segment");
    inner.classList.add("segment-inner");

    group.style.setProperty("--hx", offset.x + "px");
    group.style.setProperty("--hy", offset.y + "px");

    group.style.animationDelay = `${index * 0.12}s`;

    // ---------------- CLIP ----------------
    const clipId = `clip_${index}`;

    const clipPath = document.createElementNS(svgNS, "clipPath");
    clipPath.setAttribute("id", clipId);

    const clipShape = document.createElementNS(svgNS, "path");
    clipShape.setAttribute("d", pathData);

    clipPath.appendChild(clipShape);
    defs.appendChild(clipPath);

    // ---------------- BACKGROUND ----------------
    let bg;

    if (data.image) {
        const img = document.createElementNS(svgNS, "image");

        group.classList.add("has-image");
        bgImages.push(img);

        const scale = data.imgScale ?? 1;
        const offsetX = data.imgOffsetX ?? 0;
        const offsetY = data.imgOffsetY ?? 0;

        const imgSize = size * scale;

        img.setAttribute("href", data.image);
        img.setAttribute("x", center - imgSize / 2 + offsetX);
        img.setAttribute("y", center - imgSize / 2 + offsetY);
        img.setAttribute("width", imgSize);
        img.setAttribute("height", imgSize);
        img.setAttribute("clip-path", `url(#${clipId})`);
        img.setAttribute("preserveAspectRatio", "xMidYMid slice");

        img.classList.add("segment-bg");

        bg = img;
    } else {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", data.color);
        path.classList.add("segment-bg");

        bg = path;
    }

    // ---------------- TEXT ----------------
    const textGroup = document.createElementNS(svgNS, "g");
    textGroup.classList.add("segment-text");

    if (data.textColor) {
        textGroup.setAttribute("fill", data.textColor);
    }

    const arc1 = `arc_${index}_1`;
    const arc2 = `arc_${index}_2`;

    createArc(defs, arc1, center, startAngle, endAngle, (outerRadius + innerRadius) / 2, 0);
    createArc(defs, arc2, center, startAngle, endAngle, (outerRadius + innerRadius) / 2, -20);

    const lines = splitText(data.text);
    const fontSize = fitText(lines, startAngle, endAngle, innerRadius, outerRadius);

    lines.forEach((line, i) => {
        textGroup.appendChild(
            createTextLine(svgNS, line, i === 0 ? arc1 : arc2, fontSize)
        );
    });

    inner.appendChild(bg);
    inner.appendChild(textGroup);
    group.appendChild(inner);
    svg.appendChild(group);

    group.addEventListener("click", () => {
        if (data.text === "Profile") {
            manager.setScene(ProfileScene);
        }
    });
}

function polarToCartesian(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
    };
}

function createArc(defs, id, cx, startAngle, endAngle, r, offset = 0) {
    const svgNS = "http://www.w3.org/2000/svg";

    const radius = r + offset;
    const mid = (startAngle + endAngle) / 2;

    let start = polarToCartesian(cx, cx, radius, startAngle);
    let end = polarToCartesian(cx, cx, radius, endAngle);

    let sweep = 1;
    if (mid > 90 && mid < 270) {
        [start, end] = [end, start];
        sweep = 0;
    }

    const arcFlag = (endAngle - startAngle) > 180 ? 1 : 0;

    const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${arcFlag} ${sweep} ${end.x} ${end.y}`;

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", id);
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");

    defs.appendChild(path);
}

function createTextLine(svgNS, text, arcId, fontSize) {
    const textEl = document.createElementNS(svgNS, "text");
    textEl.setAttribute("font-size", fontSize);

    const textPath = document.createElementNS(svgNS, "textPath");
    textPath.setAttribute("href", `#${arcId}`);
    textPath.setAttribute("startOffset", "50%");
    textPath.setAttribute("text-anchor", "middle");

    textPath.textContent = text;

    textEl.appendChild(textPath);
    return textEl;
}

function splitText(text) {
    const words = text.split(" ");
    if (words.length < 2) return [text];

    const mid = Math.ceil(words.length / 2);
    return [
        words.slice(0, mid).join(" "),
        words.slice(mid).join(" ")
    ];
}

function fitText(lines, startAngle, endAngle, innerRadius, outerRadius) {
    let fontSize = 18;

    const maxAngle = endAngle - startAngle;
    const arcLength = ((innerRadius + outerRadius) / 2) * (maxAngle * Math.PI / 180);

    const longest = Math.max(...lines.map(l => l.length));

    while (fontSize * 0.6 * longest > arcLength && fontSize > 8) {
        fontSize--;
    }

    return fontSize;
}

function preloadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // decode() форсирует декодирование пикселей, а не только загрузку
            if (img.decode) img.decode().then(() => resolve(img), () => resolve(img));
            else resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}