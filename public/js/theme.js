/**
 * CareSync Theme Engine
 * Toggles and synchronizes Dark Mode & Light Mode across the entire application.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "caresync_theme";
  const THEME_LIGHT = "light";
  const THEME_DARK = "dark";

  /**
   * Determine the current preferred theme.
   * Checks localStorage first, then system OS settings, defaulting to dark mode.
   */
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

  /**
   * Apply the theme to the <html> document root and update all switch controls in the DOM.
   * @param {string} theme - 'light' or 'dark'
   * @param {boolean} persist - whether to save choice to localStorage
   */
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

    // Synchronize all desktop and mobile theme switches
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

    // Notify any other components listening for theme changes
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  /**
   * Toggle between light and dark modes with a brief smooth transition.
   */
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

  /**
   * Initialize theme state and event listeners.
   */
  function init() {
    // Sync current active DOM state with whatever was applied in head
    const initialTheme =
      document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    applyTheme(initialTheme, false);

    // Global click listener for any theme toggle button
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".theme-toggle-switch");
      if (btn) {
        e.preventDefault();
        toggleTheme();
      }
    });

    // Listen for OS system theme changes if user hasn't explicitly set one
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

  // Run as soon as DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Global helper API for developer console / debugging
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
