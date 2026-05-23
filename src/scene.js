export default class Scene {
    constructor(root, manager) {
        this.root = root;
        this.manager = manager; // 🔥 ВОТ ЭТО ТЫ ПОТЕРЯЛ
        this.el = null;
        this.cleanupFns = [];
    }

    mount() {}

    addCleanup(fn) {
        this.cleanupFns.push(fn);
    }

    unmount() {
        // удалить DOM сцены
        if (this.el) this.el.remove();

        // вызвать все cleanup-функции
        this.cleanupFns.forEach(fn => fn());

        this.cleanupFns = [];
    }
}