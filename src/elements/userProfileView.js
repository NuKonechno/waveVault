import createBackButton from "./backButton.js";

export default class UserProfileView {
    constructor(root, user, onLogout, onBack) {
        this.root = root;
        this.user = user || {};
        this.onLogout = onLogout;
        this.onBack = onBack;
        this.el = null;
    }

    mount() {
        this.el = document.createElement("div");
        this.el.className = "profile-wrapper";

        const nickname = this.escapeHtml(this.user.nickname || "User");
        const email = this.escapeHtml(this.user.email || "No email");
        const createdAt = this.formatDate(this.user.createdAt);
        const initial = this.escapeHtml(this.getInitial());

        this.el.innerHTML = `
            <div class="profile-left">
                <div data-back-slot></div>
                <div class="avatar">${initial}</div>
                <div class="nickname">${nickname}</div>
                <div class="profile-email">${email}</div>
                <button class="profile-action" type="button" data-logout>Log out</button>
            </div>

            <div class="profile-right">
                <section class="profile-panel">
                    <h3>Account</h3>
                    <p>Created ${createdAt}. Your current session is stored locally in this browser.</p>
                    <div class="profile-meta">
                        <span>local</span>
                        <span>active</span>
                    </div>
                </section>
                <section class="profile-panel">
                    <h3>Library</h3>
                    <p>The profile scene is ready to receive saved tracks, playlists and listening history.</p>
                </section>
                <section class="profile-panel profile-panel-wide">
                    <h3>WaveVault ID</h3>
                    <p>${this.escapeHtml(this.user.id || "session")}</p>
                </section>
            </div>
        `;

        this.root.appendChild(this.el);
        this.el.querySelector("[data-back-slot]").appendChild(createBackButton(this.onBack));

        this.el.querySelector("[data-logout]").addEventListener("click", () => {
            this.onLogout();
        });
    }

    getInitial() {
        const source = this.user.nickname || this.user.email || "U";
        return source.trim().charAt(0).toUpperCase() || "U";
    }

    formatDate(value) {
        if (!value) return "today";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "today";

        return new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(date);
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    remove() {
        if (this.el) this.el.remove();
    }
}
