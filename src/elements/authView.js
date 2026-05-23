import createBackButton from "./backButton.js";

const USERS_KEY = "waveVault.users";
const SESSION_KEY = "waveVault.session";

export default class AuthView {
    constructor(root, onLoginSuccess, onBack) {
        this.root = root;
        this.onLoginSuccess = onLoginSuccess;
        this.onBack = onBack;
        this.el = null;
        this.mode = "login";
    }

    mount() {
        this.el = document.createElement("div");
        this.el.className = "auth-wrapper";

        this.el.innerHTML = `
            <div class="auth-header">
                <div>
                    <div class="auth-kicker">WaveVault</div>
                    <h1 class="auth-title">Your profile is one step away.</h1>
                    <p class="auth-subtitle">
                        Sign in to keep your music space, account details and library state ready for the next scene.
                    </p>
                </div>

                <div class="auth-stats" aria-hidden="true">
                    <div class="auth-stat">
                        <span class="auth-stat-value">24/7</span>
                        <span class="auth-stat-label">access</span>
                    </div>
                    <div class="auth-stat">
                        <span class="auth-stat-value">1</span>
                        <span class="auth-stat-label">profile</span>
                    </div>
                    <div class="auth-stat">
                        <span class="auth-stat-value">local</span>
                        <span class="auth-stat-label">storage</span>
                    </div>
                </div>
            </div>

            <div class="auth-box" aria-live="polite">
                <div data-back-slot></div>
                <div class="auth-switch" role="tablist" aria-label="Authorization mode">
                    <button type="button" data-mode="login">Log in</button>
                    <button type="button" data-mode="register">Register</button>
                </div>

                <div data-auth-form></div>
                <div class="auth-message" data-auth-message></div>
            </div>
        `;

        this.root.appendChild(this.el);
        this.el.querySelector("[data-back-slot]").appendChild(createBackButton(this.onBack));

        this.bind();
        this.renderForm();
    }

    bind() {
        this.el.querySelectorAll("[data-mode]").forEach((button) => {
            button.addEventListener("click", () => {
                this.mode = button.dataset.mode;
                this.setMessage("");
                this.renderForm();
            });
        });
    }

    renderForm() {
        const formSlot = this.el.querySelector("[data-auth-form]");
        this.updateSwitch();

        if (this.mode === "register") {
            formSlot.innerHTML = `
                <form class="auth-form" novalidate>
                    <div class="auth-field">
                        <label for="authEmail">Email</label>
                        <input id="authEmail" name="email" type="email" autocomplete="email">
                    </div>
                    <div class="auth-field">
                        <label for="authNickname">Nickname</label>
                        <input id="authNickname" name="nickname" autocomplete="nickname">
                    </div>
                    <div class="auth-field">
                        <label for="authPassword">Password</label>
                        <input id="authPassword" name="password" type="password" autocomplete="new-password">
                    </div>
                    <div class="auth-field">
                        <label for="authConfirm">Confirm password</label>
                        <input id="authConfirm" name="confirm" type="password" autocomplete="new-password">
                    </div>
                    <button type="submit">Create account</button>
                </form>
            `;

            formSlot.querySelector("form").addEventListener("submit", (event) => {
                event.preventDefault();
                this.register(new FormData(event.currentTarget));
            });
        }

        if (this.mode === "login") {
            formSlot.innerHTML = `
                <form class="auth-form" novalidate>
                    <div class="auth-field">
                        <label for="authLogin">Email or nickname</label>
                        <input id="authLogin" name="login" autocomplete="username">
                    </div>
                    <div class="auth-field">
                        <label for="authLoginPassword">Password</label>
                        <input id="authLoginPassword" name="password" type="password" autocomplete="current-password">
                    </div>
                    <button type="submit">Log in</button>
                </form>
            `;

            formSlot.querySelector("form").addEventListener("submit", (event) => {
                event.preventDefault();
                this.login(new FormData(event.currentTarget));
            });
        }
    }

    register(formData) {
        const email = this.clean(formData.get("email"));
        const nickname = this.clean(formData.get("nickname"));
        const password = String(formData.get("password") || "");
        const confirm = String(formData.get("confirm") || "");

        if (!this.validateEmail(email)) return this.setMessage("Enter a valid email.");
        if (nickname.length < 3) return this.setMessage("Nickname must contain at least 3 characters.");
        if (password.length < 6) return this.setMessage("Password must contain at least 6 characters.");
        if (password !== confirm) return this.setMessage("Passwords do not match.");

        const users = AuthView.getUsers();
        const normalizedEmail = email.toLowerCase();
        const normalizedNickname = nickname.toLowerCase();

        const exists = users.some((user) => {
            return user.email.toLowerCase() === normalizedEmail
                || user.nickname.toLowerCase() === normalizedNickname;
        });

        if (exists) return this.setMessage("This email or nickname is already registered.");

        const user = {
            id: this.createUserId(),
            email,
            nickname,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        AuthView.saveUsers(users);
        AuthView.setSession(user.id);
        this.setMessage("Account created.", "success");
        this.onLoginSuccess(AuthView.toPublicUser(user));
    }

    login(formData) {
        const login = this.clean(formData.get("login"));
        const password = String(formData.get("password") || "");

        if (!login || !password) return this.setMessage("Fill in all fields.");

        const normalizedLogin = login.toLowerCase();
        const user = AuthView.getUsers().find((item) => {
            return (item.email.toLowerCase() === normalizedLogin
                || item.nickname.toLowerCase() === normalizedLogin)
                && item.password === password;
        });

        if (!user) return this.setMessage("Email, nickname or password is incorrect.");

        AuthView.setSession(user.id);
        this.onLoginSuccess(AuthView.toPublicUser(user));
    }

    updateSwitch() {
        this.el.querySelectorAll("[data-mode]").forEach((button) => {
            const isActive = button.dataset.mode === this.mode;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });
    }

    setMessage(message, type = "error") {
        const messageEl = this.el.querySelector("[data-auth-message]");
        messageEl.textContent = message;
        messageEl.classList.toggle("is-success", type === "success");
    }

    clean(value) {
        return String(value || "").trim();
    }

    createUserId() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    remove() {
        if (this.el) this.el.remove();
    }

    static getUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    }

    static saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    static setSession(userId) {
        localStorage.setItem(SESSION_KEY, userId);
    }

    static clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    static getSessionUser() {
        const sessionId = localStorage.getItem(SESSION_KEY);
        const user = AuthView.getUsers().find((item) => item.id === sessionId);

        return user ? AuthView.toPublicUser(user) : null;
    }

    static toPublicUser(user) {
        return {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            createdAt: user.createdAt
        };
    }
}
