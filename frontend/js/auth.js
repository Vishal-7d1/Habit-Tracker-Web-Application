/* ==========================================================
   auth.js — login & register validation, password visibility
   Demo only: no credentials are stored, no backend is called.
   ========================================================== */

function setFieldError(input, message) {
  const holder = document.getElementById(`${input.id}Error`);
  if (message) {
    input.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
    if (holder) {
      holder.textContent = message;
      holder.classList.add("show");
    }
  } else {
    input.classList.remove("invalid");
    input.removeAttribute("aria-invalid");
    if (holder) holder.classList.remove("show");
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function initPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.innerHTML = `<i class="fa-solid ${show ? "fa-eye-slash" : "fa-eye"}" aria-hidden="true"></i>`;
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });
}


function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let valid = true;

    if (!email.value.trim()) {
      setFieldError(email, "Email is required.");
      valid = false;
    } else if (!isValidEmail(email.value)) {
      setFieldError(email, "Enter a valid email address.");
      valid = false;
    } else {
      setFieldError(email, "");
    }

    if (!password.value) {
      setFieldError(password, "Password is required.");
      valid = false;
    } else if (password.value.length < 6) {
      setFieldError(password, "Password must be at least 6 characters.");
      valid = false;
    } else {
      setFieldError(password, "");
    }

    if (!valid) {
      showToast("Please fix the highlighted fields.", "danger");
      return;
    }

   const button = form.querySelector('button[type="submit"]');

    setButtonLoading(button, true, "Signing in...");

    try {

      const response = await AuthAPI.login(
        email.value.trim(),
        password.value
      );

      if (response.success) {

        showToast("Login Successful", "success");

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 700);

      } else {

        showToast(response.message || "Login Failed", "danger");

      }

    } catch (error) {

      showToast(error.message, "danger");

    } finally {

      setButtonLoading(button, false);

    }
  });

  [email, password].forEach((input) =>
    input.addEventListener("input", () => setFieldError(input, ""))
  );

  const forgot = document.getElementById("forgotPassword");
  if (forgot) {
    forgot.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Password reset will be handled by the backend API.");
    });
  }
}

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  const name = document.getElementById("registerName");
  const email = document.getElementById("registerEmail");
  const password = document.getElementById("registerPassword");
  const confirm = document.getElementById("registerConfirm");
  const terms = document.getElementById("registerTerms");

 form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let valid = true;

    if (name.value.trim().length < 3) {
      setFieldError(name, "Enter your full name (min 3 characters).");
      valid = false;
    } else setFieldError(name, "");

    if (!isValidEmail(email.value)) {
      setFieldError(email, "Enter a valid email address.");
      valid = false;
    } else setFieldError(email, "");

    if (password.value.length < 6) {
      setFieldError(password, "Password must be at least 6 characters.");
      valid = false;
    } else setFieldError(password, "");

    if (confirm.value !== password.value || !confirm.value) {
      setFieldError(confirm, "Passwords do not match.");
      valid = false;
    } else setFieldError(confirm, "");

    const termsError = document.getElementById("registerTermsError");
    if (!terms.checked) {
      termsError.classList.add("show");
      valid = false;
    } else termsError.classList.remove("show");

    if (!valid) {
      showToast("Please fix the highlighted fields.", "danger");
      return;
    }

  const button = form.querySelector('button[type="submit"]');

setButtonLoading(button, true, "Creating account...");

    try {

      const response = await AuthAPI.register({

        name: name.value.trim(),

        email: email.value.trim(),

        password: password.value

      });

      if (response.success) {

        showToast("Account Created Successfully", "success");

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);

      } else {

        showToast(response.message || "Registration Failed", "danger");

      }

    } catch (error) {

      showToast(error.message, "danger");

    } finally {

      setButtonLoading(button, false);

    }
  });

  [name, email, password, confirm].forEach((input) =>
    input.addEventListener("input", () => setFieldError(input, ""))
  );
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
});
