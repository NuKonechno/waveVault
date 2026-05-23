import Scene from "../scene.js";
import buildRadialMenu from "../elements/mainMenu.js";

export default class MainMenuScene extends Scene {
    mount() {
        this.el = document.createElement("div");
        this.el.className = "mainMenu";

        this.root.appendChild(this.el);

        this.menuDestroy = buildRadialMenu(this.el, this.manager);

        // регистрируем cleanup
        this.addCleanup(() => {
            if (this.menuDestroy) this.menuDestroy();
        });
    }
}