document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const bar = document.getElementById("strength-bar");
  const text = document.getElementById("strength-text");
  const toggle = document.getElementById("toggle-password");

const commonPasswords = [
  '123456', 'password', '123456789', 'qwerty', '12345678',
  '111111', '123123', 'abc123', 'password1', 'admin'
];

function checkPasswordStrength() {
  const password = passwordInput.value;
  
  const isLong = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isNotCommon = !commonPasswords.includes(password.toLowerCase());

  
  updateRequirement("length", isLong);
  updateRequirement("uppercase", hasUpper);
  updateRequirement("number", hasNumber);
  updateRequirement("special", hasSpecial);
  updateRequirement("not-common", isNotCommon);

  let score = 0;
  if (isLong) score++;
  if (hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (isNotCommon) score++;

  const colors = ["#ff4d4d", "#ff944d", "#ffcc00", "#99cc33", "#33cc33"];
  const messages = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  bar.style.width = (score * 20) + "%";
  bar.style.backgroundColor = colors[score - 1] || "#ccc";
  text.textContent = messages[score - 1] || "";
}

function updateRequirement(id, condition) {
  const element = document.getElementById(id);
  element.className = condition ? "valid" : "invalid";
  const label = element.textContent.slice(2); // keep text after ✔/✖
  element.textContent = `${condition ? "✔" : "✖"} ${label}`;
}

function togglePassword() {
  const input = document.getElementById("password");
  const toggle = document.getElementById("toggle-password");

  if (input.type === "password") {
    input.type = "text";
    toggle.textContent = "🙈";
  } else {
    input.type = "password";
    toggle.textContent = "👁️";
  }
}

