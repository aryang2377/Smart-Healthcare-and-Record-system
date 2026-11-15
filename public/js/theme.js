
(function () {
  "use strict";

  const STORAGE_KEY = "caresync_theme";
  const THEME_LIGHT = "light";
  const THEME_DARK = "dark";

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("theme");
    if (saved === THEME_LIGHT || saved === THEME_DARK) {
      return saved;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return THEME_LIGHT;
    }
    return THEME_DARK;
  }

  function applyTheme(theme, persist) {
    if (persist === undefined) persist = true;
    const isLight = theme === THEME_LIGHT;
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        console.warn("Unable to save theme preference to localStorage:", e);
      }
    }

    const switches = document.querySelectorAll(".theme-toggle-switch");
    switches.forEach(function (btn) {
      btn.setAttribute("aria-checked", String(isLight));
      btn.setAttribute(
        "title",
        isLight ? "Switch to Dark Mode" : "Switch to Light Mode"
      );

      const currentIcon = btn.querySelector(".current-icon");
      if (currentIcon) {
        if (isLight) {
          currentIcon.className = "fas fa-sun current-icon";
        } else {
          currentIcon.className = "fas fa-moon current-icon";
        }
      }
    });

    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  function toggleTheme() {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    const nextTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;

    document.documentElement.classList.add("theme-transitioning");
    applyTheme(nextTheme, true);

    setTimeout(function () {
      document.documentElement.classList.remove("theme-transitioning");
    }, 350);
  }

  function init() {

    const initialTheme =
      document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    applyTheme(initialTheme, false);

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".theme-toggle-switch");
      if (btn) {
        e.preventDefault();
        toggleTheme();
      }
    });

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handleSystemThemeChange = function (e) {
        if (!localStorage.getItem(STORAGE_KEY) && !localStorage.getItem("theme")) {
          applyTheme(e.matches ? THEME_LIGHT : THEME_DARK, false);
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleSystemThemeChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.CareSyncTheme = {
    get: function () {
      return document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    },
    set: function (theme) {
      applyTheme(theme, true);
    },
    toggle: toggleTheme,
  };
})();
