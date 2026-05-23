import Scene from "../scene.js";
import AuthView from "../elements/authView.js";
import UserProfileView from "../elements/userProfileView.js";
import MainMenuScene from "./mainMenuScene.js";
import parallax from "../effects/parallax.js";

export default class ProfileScene extends Scene {
    constructor(root, manager) {
        super(root, manager);

        this.user = AuthView.getSessionUser();
        this.child = null;
        this.parallaxCleanup = null;
    }

    mount() {
        this.el = document.createElement("div");
        this.el.className = "scene profileScene";

        this.root.appendChild(this.el);
        this.addCleanup(() => this.clearParallax());

        this.render();
    }

    render() {
        this.clearParallax();

        if (this.child) {
            this.child.remove();
            this.child = null;
        }

        if (this.user) {
            this.child = new UserProfileView(this.el, this.user, () => {
                AuthView.clearSession();
                this.user = null;
                this.render();
            }, () => this.backToMainMenu());
        } else {
            this.child = new AuthView(this.el, (user) => {
                this.user = user;
                this.render();
            }, () => this.backToMainMenu());
        }

        this.child.mount();
        this.mountParallax();
    }

    backToMainMenu() {
        this.manager.setScene(MainMenuScene);
    }

    mountParallax() {
        this.clearParallax();

        this.parallaxCleanup = parallax(this.child.el, {
            strength: 10,
            children: [
                /*{
                    selector: ".avatar, .auth-kicker, .auth-stat, .profile-panel",
                    strength: 18
                }*/
            ]
        });
    }

    clearParallax() {
        if (this.parallaxCleanup) {
            this.parallaxCleanup();
            this.parallaxCleanup = null;
        }
    }

    unmount() {
        this.clearParallax();

        if (this.child) {
            this.child.remove();
            this.child = null;
        }

        super.unmount();
    }
}
