document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  const backdrop = document.getElementById("nav-backdrop");
  const navbar = document.querySelector(".navbar");

  // Toggle mobile drawer
  const toggleMenu = (forceClose = false) => {
    if (!navMenu) return;
    const isActive = forceClose ? false : !navMenu.classList.contains("active");
    navMenu.classList.toggle("active", isActive);
    if (backdrop) backdrop.classList.toggle("active", isActive);
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", String(isActive));
      const icon = toggleBtn.querySelector("i");
      if (icon) {
        icon.className = isActive ? "fas fa-xmark" : "fas fa-bars";
      }
    }
    document.body.style.overflow = isActive ? "hidden" : "";
  };

  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", () => toggleMenu(true));
  }

  // Close drawer when a nav link is clicked
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 992) {
        toggleMenu(true);
      }
    });
  });

  // Highlight active link based on current path and active query/tab
  const updateActiveNavLinks = () => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const isTriage = currentSearch.includes("tab=triage");

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute("data-path") || link.getAttribute("href") || "";
      link.classList.remove("active");

      if (isTriage) {
        if (linkPath.includes("tab=triage")) {
          link.classList.add("active");
        }
      } else {
        if (
          !linkPath.includes("tab=triage") &&
          (linkPath === currentPath ||
            (linkPath !== "/" && currentPath.startsWith(linkPath)))
        ) {
          link.classList.add("active");
        }
      }
    });
  };

  window.updateActiveNavLinks = updateActiveNavLinks;
  updateActiveNavLinks();

  // Sticky navbar shadow on scroll
  window.addEventListener("scroll", () => {
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.classList.add("navbar-scrolled");
      } else {
        navbar.classList.remove("navbar-scrolled");
      }
    }
  });
});
