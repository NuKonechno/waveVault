export function parallax(moduleElement, options = {}) {
    const entries = [
        ...createEntries(moduleElement, options, true),
        ...normalizeChildren(options.children).flatMap((childOptions) =>
            createEntries(moduleElement, childOptions, false)
        )
    ];

    let pending = null;
    let rafId = 0;

    const apply = (event) => {
        const mx = (event.clientX - window.innerWidth / 2) / window.innerWidth;
        const my = (event.clientY - window.innerHeight / 2) / window.innerHeight;

        for (const entry of entries) {
            const x = mx * entry.strengthX;
            const y = my * entry.strengthY;

            if (entry.apply) entry.apply(entry.element, { x, y, mx, my, event });
            else entry.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        if (options.onMove) options.onMove({ mx, my, event });
    };

    const handleMouseMove = (event) => {
        pending = event;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            rafId = 0;
            const e = pending;
            pending = null;
            if (e) apply(e);
        });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return function cleanup() {
        window.removeEventListener("mousemove", handleMouseMove);
        if (rafId) cancelAnimationFrame(rafId);
    };
}

function createEntries(moduleElement, options, fallbackToRoot) {
    const strength = options.strength ?? 10;
    const strengthX = options.strengthX ?? strength;
    const strengthY = options.strengthY ?? strength;

    return resolveElements(moduleElement, options, fallbackToRoot).map((element) => ({
        element,
        strengthX,
        strengthY,
        apply: options.apply
    }));
}

function resolveElements(moduleElement, options, fallbackToRoot) {
    if (options.element) return [options.element];
    if (options.elements) return Array.from(options.elements);
    if (options.selector) return Array.from(moduleElement.querySelectorAll(options.selector));

    const children = Array.from(moduleElement.children);
    return children.length ? children : (fallbackToRoot ? [moduleElement] : []);
}

function normalizeChildren(children = []) {
    return Array.isArray(children) ? children : [children];
}

export default parallax;
