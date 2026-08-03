/* ==========================================================
   theme.js — dark/light theme with localStorage persistence
   ========================================================== */

const THEME_KEY = "ht_theme";

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  
  document.querySelectorAll("#themeToggleLabel").forEach((label) => {
    label.textContent = theme === "dark" ? "Dark Mode" : "Light Mode";
  });
  
  document.querySelectorAll("#themeToggle").forEach((toggle) => {
    const icon = toggle.querySelector("i");
    if (icon) icon.className = `fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`;
  });

  document.querySelectorAll("[data-theme-switch]").forEach((input) => {
    input.checked = theme === "dark";
  });
  document.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme } }));
}

function toggleTheme() {
  applyTheme(getStoredTheme() === "dark" ? "light" : "dark");
}

function initThemeToggle() {
  applyTheme(getStoredTheme());
  document.querySelectorAll("[data-theme-switch]").forEach((input) => {
    input.addEventListener("change", () => applyTheme(input.checked ? "dark" : "light"));
  });
}

// Global click event delegation for theme toggle buttons
document.addEventListener("click", (event) => {
  const toggleBtn = event.target.closest("#themeToggle");
  if (toggleBtn) {
    event.preventDefault();
    toggleTheme();
  }
});

/* Apply as early as possible to avoid a flash of the wrong theme. */
applyTheme(getStoredTheme());

function themeChartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    gold: styles.getPropertyValue("--gold").trim() || "#D4AF37",
    text: styles.getPropertyValue("--text-secondary").trim() || "#D6D6D6",
    grid: styles.getPropertyValue("--divider").trim() || "rgba(212,175,55,.12)",
    muted: styles.getPropertyValue("--text-muted").trim() || "#A8A8A8",
  };
}
