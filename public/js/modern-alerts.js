
(function () {
  "use strict";

  const CONTAINER_ID = "caresync-toast-container";
  const DEFAULT_DURATION = 4200;

  function playPopChime(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let freq1 = 580;
      let freq2 = 880;
      if (type === "error") {
        freq1 = 440;
        freq2 = 330;
      } else if (type === "warning") {
        freq1 = 520;
        freq2 = 680;
      } else if (type === "success") {
        freq1 = 523;
        freq2 = 784;
      }

      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq1, now);
      osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.08);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {

    }
  }

  function getContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = CONTAINER_ID;
      container.setAttribute("aria-live", "polite");
      if (document.body) {
        document.body.appendChild(container);
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          document.body.appendChild(container);
        });
      }
    }
    return container;
  }

  function getTypeMeta(type) {
    switch (type) {
      case "error":
        return {
          icon: "fa-xmark",
          title: "Error",
        };
      case "success":
        return {
          icon: "fa-check",
          title: "Success",
        };
      case "info":
        return {
          icon: "fa-info",
          title: "Notice",
        };
      case "warning":
      default:
        return {
          icon: "fa-exclamation",
          title: "Warning",
        };
    }
  }

  function highlightField(element) {
    if (!element) return;
    const el = typeof element === "string" ? document.querySelector(element) : element;
    if (!el || typeof el.focus !== "function") return;

    el.classList.add("caresync-input-error-highlight");

    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {}

    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      el.focus();
    }

    const clearHighlight = () => {
      el.classList.remove("caresync-input-error-highlight");
      el.removeEventListener("input", clearHighlight);
      el.removeEventListener("change", clearHighlight);
    };

    el.addEventListener("input", clearHighlight);
    el.addEventListener("change", clearHighlight);

    setTimeout(() => {
      el.classList.remove("caresync-input-error-highlight");
    }, 4000);
  }

  function showModernAlert(message, type = "success", options = {}) {
    const validTypes = ["success", "warning", "error", "info"];
    const alertType = validTypes.includes(type) ? type : "success";
    const meta = getTypeMeta(alertType);

    const title = options.title || meta.title;
    const duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;

    if (options.targetInput) {
      highlightField(options.targetInput);
    }

    if (options.playSound !== false) {
      playPopChime(alertType);
    }

    const container = getContainer();

    const toast = document.createElement("div");
    toast.className = `caresync-pop-toast caresync-pop-${alertType}`;
    toast.setAttribute("role", alertType === "error" ? "alert" : "status");

    toast.innerHTML = `
      <div class="caresync-pop-main">
        <div class="caresync-pop-icon-circle">
          <i class="fas ${meta.icon}"></i>
        </div>
        <div class="caresync-pop-body">
          <h4 class="caresync-pop-title">${title}</h4>
          <p class="caresync-pop-message">${message}</p>
        </div>
        <button type="button" class="caresync-pop-close" aria-label="Close notification">
          &times;
        </button>
      </div>
      ${
        duration > 0
          ? `<div class="caresync-pop-progress-track">
               <div class="caresync-pop-progress-bar" style="animation-duration: ${duration}ms;"></div>
             </div>`
          : ""
      }
    `;

    let isDismissed = false;
    let timerId = null;

    const dismissToast = () => {
      if (isDismissed) return;
      isDismissed = true;
      if (timerId) clearTimeout(timerId);

      toast.classList.add("is-dismissing");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };

    const closeBtn = toast.querySelector(".caresync-pop-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissToast();
      });
    }

    toast.addEventListener("click", () => {
      dismissToast();
    });

    if (duration > 0) {
      let remaining = duration;
      let start = Date.now();

      const startTimer = () => {
        start = Date.now();
        timerId = setTimeout(dismissToast, remaining);
      };

      const pauseTimer = () => {
        if (timerId) {
          clearTimeout(timerId);
          remaining -= Date.now() - start;
        }
      };

      toast.addEventListener("mouseenter", pauseTimer);
      toast.addEventListener("mouseleave", () => {
        if (remaining > 0) startTimer();
      });

      startTimer();
    }

    container.appendChild(toast);

    return {
      dismiss: dismissToast,
      element: toast,
    };
  }

  function getFriendlyInputLabel(input) {
    if (!input) return "Required Field";

    const customLabel =
      input.getAttribute("data-label") ||
      input.getAttribute("data-field-name");
    if (customLabel) return customLabel.trim();

    if (input.id) {
      const labelEl = document.querySelector(`label[for="${input.id}"]`);
      if (labelEl) {
        return labelEl.textContent.replace(/[*:]/g, "").trim();
      }
    }

    const parentLabel = input.closest("label");
    if (parentLabel) {
      return parentLabel.textContent.replace(/[*:]/g, "").trim();
    }

    const group = input.closest(".form-group, .input-field, .modal-field, div");
    if (group) {
      const groupLabel = group.querySelector("label");
      if (groupLabel) {
        return groupLabel.textContent.replace(/[*:]/g, "").trim();
      }
    }

    if (input.placeholder && !input.placeholder.toLowerCase().startsWith("e.g.")) {
      return input.placeholder.replace(/[*:]/g, "").trim();
    }

    if (input.name) {
      const clean = input.name
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .trim();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    return "this required field";
  }

  function buildValidationMessage(input) {
    const customMsg =
      input.getAttribute("data-missing-msg") ||
      input.getAttribute("data-error-msg");
    if (customMsg) return customMsg;

    const label = getFriendlyInputLabel(input);
    const tagName = input.tagName.toLowerCase();
    const type = (input.type || "").toLowerCase();

    const validity = input.validity;
    if (validity) {
      if (validity.valueMissing) {
        if (tagName === "select" || type === "date" || type === "time") {
          return `Please select your ${label}.`;
        }
        if (type === "file") {
          return `Please upload the ${label}.`;
        }
        if (type === "checkbox" || type === "radio") {
          return `Please select or confirm ${label}.`;
        }
        return `Please enter your ${label}.`;
      }

      if (validity.typeMismatch && type === "email") {
        return "Please enter a valid official email address.";
      }

      if (validity.tooShort) {
        return `${label} must be at least ${input.minLength} characters long.`;
      }

      if (validity.rangeUnderflow || validity.rangeOverflow) {
        return `Please enter a valid value for ${label}.`;
      }
    }

    if (input.validationMessage) {
      return `${label}: ${input.validationMessage}`;
    }

    return `Please complete the ${label} field to proceed.`;
  }

  function tryFindInputByMessage(msg) {
    if (!msg) return null;
    const lower = msg.toLowerCase();

    const keywords = [
      { key: "date of birth", selectors: ["#docDob", 'input[name="dob"]', "#dob", 'input[type="date"]'] },
      { key: "dob", selectors: ["#docDob", 'input[name="dob"]', "#dob"] },
      { key: "legal name", selectors: ["#docFullname", 'input[name="fullname"]', "#fullname"] },
      { key: "full name", selectors: ["#regFullname", "#docFullname", 'input[name="fullname"]', "#fullname"] },
      { key: "gender", selectors: ["#docGender", 'select[name="gender"]', "#gender"] },
      { key: "email", selectors: ["#docEmail", "#regEmail", "#loginEmail", 'input[name="email"]', 'input[type="email"]'] },
      { key: "phone", selectors: ["#docPhone", 'input[name="phone"]', 'input[type="tel"]'] },
      { key: "specialty", selectors: ["#docSpecialty", 'select[name="specialization"]', "#specialty"] },
      { key: "qualification", selectors: ["#docQualifications", 'input[name="qualifications"]'] },
      { key: "experience", selectors: ["#docExperience", 'input[name="experience"]'] },
      { key: "license", selectors: ["#docLicense", 'input[name="licenseNumber"]'] },
      { key: "authority", selectors: ["#docAuthority", 'input[name="registrationAuthority"]'] },
      { key: "password", selectors: ['input[type="password"]', "#docPass", "#regPassword", "#loginPassword"] },
    ];

    for (const item of keywords) {
      if (lower.includes(item.key)) {
        for (const sel of item.selectors) {
          const el = document.querySelector(sel);
          if (el && el.offsetParent !== null) {
            return el;
          }
        }
      }
    }
    return null;
  }

  const originalAlert = window.alert;
  window.alert = function (message) {
    if (message === undefined || message === null) return;
    const msgStr = String(message);

    const lower = msgStr.toLowerCase();
    let type = "warning";
    let title = "Warning";

    if (
      lower.includes("error") ||
      lower.includes("invalid") ||
      lower.includes("failed") ||
      lower.includes("mismatch")
    ) {
      type = "error";
      title = "Error";
    } else if (
      lower.includes("success") ||
      lower.includes("approved") ||
      lower.includes("dispatched") ||
      lower.includes("sent") ||
      lower.includes("saved") ||
      lower.includes("created")
    ) {
      type = "success";
      title = "Success";
    } else if (
      lower.includes("viewing") ||
      lower.includes("loading") ||
      lower.includes("opening") ||
      lower.includes("info")
    ) {
      type = "info";
      title = "Notice";
    }

    const matchedInput = tryFindInputByMessage(msgStr);

    showModernAlert(msgStr, type, {
      title: title,
      targetInput: matchedInput,
      duration: 4500,
    });
  };

  document.addEventListener(
    "submit",
    function (e) {
      const form = e.target;
      if (!form || !(form instanceof HTMLFormElement)) return;
      if (form.getAttribute("data-no-modern-alert") === "true") return;

      const pass = form.querySelector(
        'input[name="password"], input[name="newPassword"], #docPass, #regPassword'
      );
      const confirmPass = form.querySelector(
        'input[name="confirmPassword"], input[name="confirmNewPassword"], #docConfirmPass, #regConfirmPassword'
      );

      if (pass && confirmPass && pass.value && confirmPass.value) {
        if (pass.value !== confirmPass.value) {
          e.preventDefault();
          e.stopImmediatePropagation();
          showModernAlert(
            "Passwords do not match. Please ensure both passwords match.",
            "error",
            {
              title: "Error",
              targetInput: confirmPass,
            }
          );
          return false;
        }
      }

      if (typeof form.checkValidity === "function" && !form.checkValidity()) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const invalidEl = form.querySelector(":invalid");
        if (invalidEl) {
          const msg = buildValidationMessage(invalidEl);
          showModernAlert(msg, "warning", {
            title: "Warning",
            targetInput: invalidEl,
          });
        }
        return false;
      }
    },
    true
  );

  document.addEventListener(
    "invalid",
    function (e) {
      e.preventDefault();
    },
    true
  );

  function checkQueuedToasts() {

    try {
      const queued = sessionStorage.getItem("caresync_toast");
      if (queued) {
        sessionStorage.removeItem("caresync_toast");
        const data = JSON.parse(queued);
        setTimeout(() => {
          showModernAlert(data.message, data.type || "success", {
            title: data.title || (data.type === "error" ? "Error" : "Success"),
            duration: data.duration || DEFAULT_DURATION,
          });
        }, 120);
        return;
      }
    } catch (e) {}

    try {
      const params = new URLSearchParams(window.location.search);
      let triggered = false;

      if (params.get("login") === "success") {
        const path = window.location.pathname;
        let msg = "Login Successful";
        if (path.startsWith("/admin")) {
          msg = "Admin Login Successful";
        } else if (path.startsWith("/staff")) {
          msg = "Staff Login Successful";
        }
        showModernAlert(msg, "success", { title: "Success" });
        triggered = true;
      } else if (params.get("register") === "success") {
        showModernAlert("Account Registration Successful", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("appointment") === "success" || params.get("booked") === "1") {
        showModernAlert("Appointment Scheduled Successfully", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("vitals") === "logged") {
        showModernAlert("Patient Vitals Recorded Successfully", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("rx") === "success") {
        showModernAlert("Prescription Dispatched Successfully", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("report") === "success") {
        showModernAlert("Medical Report Uploaded Successfully", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("staff") === "added") {
        showModernAlert("Healthcare Staff Member Added Successfully", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("doctor") === "approved") {
        showModernAlert("Doctor Application Approved Successfully", "success", { title: "Success" });
        triggered = true;
      } else if (params.get("doctor") === "rejected") {
        showModernAlert("Doctor Application Rejected", "warning", { title: "Warning" });
        triggered = true;
      } else if (params.get("toast")) {
        const msg = params.get("toast");
        const type = params.get("type") || "success";
        const title = params.get("title") || (type === "error" ? "Error" : "Success");
        showModernAlert(msg, type, { title: title });
        triggered = true;
      }

      if (triggered) {
        params.delete("login");
        params.delete("register");
        params.delete("appointment");
        params.delete("booked");
        params.delete("vitals");
        params.delete("rx");
        params.delete("report");
        params.delete("staff");
        params.delete("doctor");
        params.delete("toast");
        params.delete("type");
        params.delete("title");

        const remainingQuery = params.toString();
        const newUrl =
          window.location.pathname +
          (remainingQuery ? "?" + remainingQuery : "") +
          (window.location.hash || "");
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkQueuedToasts);
  } else {
    setTimeout(checkQueuedToasts, 80);
  }

  window.showModernAlert = showModernAlert;
  window.showToast = showModernAlert;
  window.highlightField = highlightField;
  window.CareSyncAlert = {
    pop: showModernAlert,
    toast: showModernAlert,
    alert: showModernAlert,
    highlight: highlightField,
    originalAlert: originalAlert,
    dismissAll: function () {
      const container = document.getElementById(CONTAINER_ID);
      if (container) {
        const toasts = container.querySelectorAll(".caresync-pop-toast");
        toasts.forEach((t) => t.classList.add("is-dismissing"));
        setTimeout(() => {
          container.innerHTML = "";
        }, 280);
      }
    },
  };
})();
