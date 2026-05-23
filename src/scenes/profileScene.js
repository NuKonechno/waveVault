import Scene from "../scene.js";
import AuthView from "./authView.js";
import UserProfileView from "./userProfileView.js";

export default class ProfileScene extends Scene {
    constructor(root, manager) {
        super(root, manager);

        this.user = AuthView.getSessionUser();
        this.child = null;
    }

    mount() {
        this.el = document.createElement("div");
        this.el.className = "scene profileScene";

        this.root.appendChild(this.el);

        this.render();
    }

    render() {
        if (this.child) {
            this.child.remove();
            this.child = null;
        }

        if (this.user) {
            this.child = new UserProfileView(this.el, this.user, () => {
                AuthView.clearSession();
                this.user = null;
                this.render();
            });
        } else {
            this.child = new AuthView(this.el, (user) => {
                this.user = user;
                this.render();
            });
        }

        this.child.mount();
    }

    unmount() {
        if (this.child) {
            this.child.remove();
            this.child = null;
        }

        super.unmount();
    }
}
