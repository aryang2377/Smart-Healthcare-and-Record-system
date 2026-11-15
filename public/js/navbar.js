document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  const backdrop = document.getElementById("nav-backdrop");
  const navbar = document.querySelector(".navbar");

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

  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 992) {
        toggleMenu(true);
      }
    });
  });

  const updateActiveNavLinks = () => {
    const currentPath = window.location.pathname;

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute("data-path") || link.getAttribute("href") || "";
      link.classList.remove("active");

      if (linkPath === currentPath) {
        link.classList.add("active");
      } else if (
        linkPath !== "/" &&
        linkPath !== "/admin" &&
        linkPath !== "/staff" &&
        linkPath !== "/doctor/triage" &&
        linkPath !== "/admin/triage" &&
        currentPath.startsWith(linkPath)
      ) {
        link.classList.add("active");
      }
    });
  };

  window.updateActiveNavLinks = updateActiveNavLinks;
  updateActiveNavLinks();

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
