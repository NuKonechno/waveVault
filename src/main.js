import SceneManager from "./sceneManager.js";
import MainMenuScene from "./scenes/mainMenuScene.js";

import startBg from "./elements/bgAnim.js";

function init() {
    const app = document.getElementById("app");
    const bg = document.getElementById("bg");

    if (!app || !bg) {
        throw new Error("Required elements not found");
    }

    startBg(bg);

    const manager = new SceneManager(app);
    manager.setScene(MainMenuScene);
}

init();