export default class SceneManager {
    constructor(root) {
        this.root = root;
        this.current = null;
    }

    setScene(SceneClass) {
        if (this.current) {
            this.current.unmount();
        }

        this.root.innerHTML = "";

        this.current = new SceneClass(this.root, this);
        this.current.mount();
    }
}