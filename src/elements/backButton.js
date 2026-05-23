export default function createBackButton(onClick) {
    const button = document.createElement("button");

    button.className = "scene-back-button";
    button.type = "button";
    button.textContent = "Back";
    button.addEventListener("click", onClick);

    return button;
}
