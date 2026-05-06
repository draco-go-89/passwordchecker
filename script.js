

function checkPassword() {
    const password = document.getElementById("password").value;
    const result = document.getElementById("result");
    const strengthBar = document.getElementById("strengthBar").firstElementChild;
    let score = 0;
    let feedback = [];

    // Score calculation
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Feedback
    if (password.length < 8) feedback.push("Use 8+ chars");
    if (!/[A-Z]/.test(password)) feedback.push("Add uppercase");
    if (!/[a-z]/.test(password)) feedback.push("Add lowercase");
    if (!/[0-9]/.test(password)) feedback.push("Add numbers");
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push("Add symbols");

    // Strength bar
    let width = ["10%","30%","60%","80%","100%"][score];
    // Blue/Green glass palette
    let colors = ["#f87171","#fbbf24","#34d399","#60a5fa","#22c55e"];
    strengthBar.style.width = width;
    strengthBar.style.background = `linear-gradient(90deg, ${colors[score]}, #3b82f6)`;

    // Result message
    if (score <= 1) {
        result.innerHTML = `<span style='color:#f87171'>Very Weak</span> <span style='font-size:0.9em'>${feedback.join(", ")}</span>`;
    } else if (score === 2) {
        result.innerHTML = `<span style='color:#fbbf24'>Weak</span> <span style='font-size:0.9em'>${feedback.join(", ")}</span>`;
    } else if (score === 3) {
        result.innerHTML = `<span style='color:#facc15'>Medium</span> <span style='font-size:0.9em'>${feedback.join(", ")}</span>`;
    } else if (score === 4) {
        result.innerHTML = `<span style='color:#60a5fa'>Strong</span> <span style='font-size:0.9em'>${feedback.join(", ")}</span>`;
    } else {
        result.innerHTML = `<span style='color:#22d3ee'>Ultra Secure 🚀</span>`;
    }
}

function togglePassword() {
    const input = document.getElementById("password");
    const eye = document.getElementById("eyeIcon");
    if (input.type === "password") {
        input.type = "text";
        eye.textContent = "🙈";
    } else {
        input.type = "password";
        eye.textContent = "👁️";
    }
}

function generatePassword() {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=~[]{}|:,.<>?";
    let pass = "";
    let length = Math.floor(Math.random() * 6) + 12; // 12-17 chars
    for (let i = 0; i < length; i++) {
        pass += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById("password").value = pass;
    checkPassword();
}

// Live update strength bar as user types
document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("password");
    input.addEventListener("input", checkPassword);
    checkPassword();
});