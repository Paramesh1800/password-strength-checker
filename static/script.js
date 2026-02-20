document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const bar = document.getElementById("strength-bar");
  const label = document.getElementById("strength-label");
  const toggle = document.getElementById("toggle-password");
  const generateBtn = document.getElementById("generate-btn");
  const breachStatus = document.getElementById("breach-status");
  const breachText = document.getElementById("breach-text");

  const commonPasswords = [
    '123456', 'password', '123456789', 'qwerty', '12345678',
    '111111', '123123', 'abc123', 'password1', 'admin'
  ];

  // Debounce timer for backend sync
  let debounceTimer;

  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;
    checkPasswordStrength();

    // Optimized: Sync with backend and check for breaches after inactivity
    clearTimeout(debounceTimer);
    if (password.length > 0) {
      debounceTimer = setTimeout(() => {
        syncWithBackend(password);
        checkBreach(password);
      }, 800);
    } else {
      breachStatus.classList.add("hidden");
    }
  });

  generateBtn.addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const url = username ? `/generate_password?username=${encodeURIComponent(username)}` : "/generate_password";

    fetch(url)
      .then(res => res.json())
      .then(data => {
        passwordInput.value = data.password;
        // Trigger manual check
        checkPasswordStrength();
        checkBreach(data.password);
      });
  });

  toggle.addEventListener("click", togglePassword);

  const copyBtn = document.getElementById("copy-password");
  copyBtn.addEventListener("click", () => {
    const password = passwordInput.value;
    if (!password) return;

    navigator.clipboard.writeText(password).then(() => {
      const icon = copyBtn.querySelector("i");
      icon.classList.remove("fa-copy");
      icon.classList.add("fa-check");
      icon.style.color = "var(--success)";

      setTimeout(() => {
        icon.classList.remove("fa-check");
        icon.classList.add("fa-copy");
        icon.style.color = "";
      }, 2000);
    });
  });

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

    // Add cracking time estimate
    updateCrackingTime(password);
  }

  function updateCrackingTime(password) {
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^A-Za-z0-9]/.test(password)) poolSize += 32;

    const entropy = password.length * Math.log2(poolSize || 1);
    const guesses = Math.pow(2, entropy);

    // Assume 100 billion guesses per second (high-end GPU cluster)
    const seconds = guesses / 100_000_000_000;

    const timeText = document.getElementById("time-to-crack") || createTimeElement();
    timeText.textContent = `Estimated time to crack: ${formatTime(seconds)}`;
  }

  function formatTime(seconds) {
    if (seconds < 1) return "Instantly";
    if (seconds < 60) return Math.floor(seconds) + " seconds";
    if (seconds < 3600) return Math.floor(seconds / 60) + " minutes";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hours";
    if (seconds < 31536000) return Math.floor(seconds / 86400) + " days";
    if (seconds < 31536000000) return Math.floor(seconds / 31536000) + " years";
    return "Centuries";
  }

  function createTimeElement() {
    const el = document.createElement("p");
    el.id = "time-to-crack";
    el.style.fontSize = "0.75rem";
    el.style.color = "var(--text-muted)";
    el.style.marginTop = "8px";
    el.style.textAlign = "center";
    document.querySelector(".strength-meter").appendChild(el);
    return el;
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
    breachStatus.classList.add("hidden");
    ["length", "uppercase", "number", "special", "not-common"].forEach(id => {
      const element = document.getElementById(id);
      element.classList.remove("valid");
      element.querySelector("i").innerHTML = '<i class="fa-solid fa-circle-dot"></i>';
    });
  }

  function syncWithBackend(password) {
    fetch("/save_password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    }).catch(err => console.error("Sync error:", err));
  }

  function checkBreach(password) {
    if (password.length === 0) return;

    breachStatus.classList.remove("hidden");
    breachStatus.className = "breach-status warning";
    breachText.textContent = "Checking data breach status...";

    fetch("/check_pwned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.pwned) {
          breachStatus.className = "breach-status danger";
          breachText.textContent = `Found in ${data.count.toLocaleString()} breaches! Change this immediately.`;
        } else {
          breachStatus.className = "breach-status success";
          breachText.textContent = "Safe! No known data breaches found.";
        }
      })
      .catch(err => {
        breachStatus.classList.add("hidden");
        console.error("Breach check error:", err);
      });
  }

  function togglePassword() {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggle.textContent = isPassword ? "🙈" : "👁️";
  }
});
