/* =========================================================================
   BARBELL BRIGADE — interactions
   1. Mobile navigation
   2. Header state + active nav link on scroll
   3. Scroll reveal
   4. Animated stat counters
   5. Testimonial carousel
   6. Contact form validation
   7. Newsletter form
   ========================================================================= */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------ 1. Mobile navigation ------------------------- */
  var menuToggle = document.getElementById("menuToggle");
  var siteNav = document.getElementById("siteNav");

  function closeMenu() {
    siteNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });

    // Close the menu after tapping a link, and on Escape.
    siteNav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && siteNav.classList.contains("open")) {
        closeMenu();
        menuToggle.focus();
      }
    });
  }

  /* ------------------- 2. Header state + active nav link ----------------- */
  var header = document.getElementById("siteHeader");
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav a[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);

    // The section whose top has most recently passed the header line wins.
    var marker = window.scrollY + 120;
    var currentId = null;

    sections.forEach(function (section) {
      if (section.offsetTop <= marker) currentId = section.id;
    });

    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
    });
  }

  // rAF-throttled so the scroll handler never runs more than once per frame.
  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  onScroll();

  /* --------------------------- 3. Scroll reveal -------------------------- */
  var revealItems = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (!entry.isIntersecting) return;
          // Stagger siblings slightly so grids cascade instead of popping.
          setTimeout(function () {
            entry.target.classList.add("is-visible");
          }, index * 70);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ----------------------- 4. Animated stat counters --------------------- */
  var counters = document.querySelectorAll(".stat-number");

  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 1600;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    counters.forEach(runCounter);
  }

  /* ------------------------ 5. Testimonial carousel ---------------------- */
  var carousel = document.getElementById("carousel");
  var track = document.getElementById("carouselTrack");

  if (carousel && track) {
    var slides = track.querySelectorAll(".slide");
    var dotsWrap = document.getElementById("carouselDots");
    var prevBtn = document.getElementById("prevSlide");
    var nextBtn = document.getElementById("nextSlide");
    var index = 0;
    var autoplayTimer = null;
    var AUTOPLAY_MS = 7000;

    // Build one dot per slide.
    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1) + " of " + slides.length);
      dot.addEventListener("click", function () {
        goTo(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
    });

    var dots = dotsWrap.querySelectorAll(".dot");

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
      slides.forEach(function (slide, i) {
        // Keep off-screen quotes out of the accessibility tree.
        slide.setAttribute("aria-hidden", String(i !== index));
      });
    }

    // Autoplay is paused for as long as the reader is engaged with the
    // carousel — pointer over it, or keyboard focus inside it.
    function isEngaged() {
      return carousel.matches(":hover") || carousel.contains(document.activeElement);
    }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      // Every resume routes through here and re-checks live state, so callers
      // never have to know whether autoplay is currently allowed. Without the
      // isEngaged() guard, clicking prev/next while hovering would restart
      // autoplay under the reader's cursor.
      if (isEngaged()) return;
      // Clear before starting: mouseleave and focusout both land here, so two
      // starts can arrive without a stop between them. Without this, the older
      // interval keeps firing with its handle overwritten — unreachable by
      // stopAutoplay(), so hover no longer pauses and the carousel speeds up.
      stopAutoplay();
      autoplayTimer = window.setInterval(function () {
        goTo(index + 1);
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      window.clearInterval(autoplayTimer);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    prevBtn.addEventListener("click", function () {
      goTo(index - 1);
      restartAutoplay();
    });

    nextBtn.addEventListener("click", function () {
      goTo(index + 1);
      restartAutoplay();
    });

    // Pause while the user is reading or tabbing through.
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    goTo(0);
    startAutoplay();
  }

  /* --------------------- 6. Contact form validation ---------------------- */
  var contactForm = document.getElementById("contactForm");

  if (contactForm) {
    var formStatus = document.getElementById("formStatus");
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var PHONE_RE = /^[+()\d\s-]{7,20}$/;
    // Local numbers run to 8 digits here and 10 with the country code; 7 is a
    // safe international floor that still rejects punctuation-only input.
    var MIN_PHONE_DIGITS = 7;

    var rules = [
      {
        id: "name",
        test: function (v) {
          return v.trim().length >= 2;
        },
        message: "Please tell us your name.",
      },
      {
        id: "email",
        test: function (v) {
          return EMAIL_RE.test(v.trim());
        },
        message: "That doesn't look like a valid email address.",
      },
      {
        id: "phone",
        test: function (v) {
          var trimmed = v.trim();
          // Shape check alone is not enough: the character class is all
          // punctuation plus digits, so "-------" and "()()()()" passed it
          // while being unreachable. Require real digits as well.
          return PHONE_RE.test(trimmed) && (trimmed.match(/\d/g) || []).length >= MIN_PHONE_DIGITS;
        },
        message: "Enter a phone number we can reach you on.",
      },
      {
        id: "goal",
        test: function (v) {
          return v !== "";
        },
        message: "Pick the goal that fits you best.",
      },
      {
        id: "message",
        test: function () {
          return true; // optional
        },
        message: "",
      },
    ];

    function validateField(rule) {
      var input = document.getElementById(rule.id);
      var error = document.getElementById(rule.id + "Error");
      var valid = rule.test(input.value);

      input.parentElement.classList.toggle("invalid", !valid);
      error.textContent = valid ? "" : rule.message;
      input.setAttribute("aria-invalid", String(!valid));

      return valid;
    }

    // Re-validate a field once it has been touched, so errors clear as you fix them.
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      input.addEventListener("blur", function () {
        validateField(rule);
      });
      input.addEventListener("input", function () {
        // The confirmation from a previous submit describes an enquiry that has
        // already been sent — editing the form again makes it stale, and
        // leaving it up alongside a fresh error message reads as contradictory.
        if (formStatus.textContent) formStatus.textContent = "";
        if (input.parentElement.classList.contains("invalid")) validateField(rule);
      });
    });

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      var allValid = true;

      rules.forEach(function (rule) {
        var valid = validateField(rule);
        if (!valid) {
          allValid = false;
          if (!firstInvalid) firstInvalid = document.getElementById(rule.id);
        }
      });

      if (!allValid) {
        formStatus.textContent = "";
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // No backend on this build — log the payload so it is easy to wire up later.
      var payload = {};
      new FormData(contactForm).forEach(function (value, key) {
        payload[key] = typeof value === "string" ? value.trim() : value;
      });
      console.log("Free week request:", payload);

      // Split on whitespace rather than a single space: an untrimmed leading
      // space made split(" ")[0] return "", greeting the member as "Thanks  —".
      var firstName = payload.name.split(/\s+/)[0];
      formStatus.textContent =
        "Thanks " + firstName + " — we'll be in touch within one working day.";
      contactForm.reset();
    });
  }

  /* --------------------------- 7. Newsletter ----------------------------- */
  var newsletterForm = document.getElementById("newsletterForm");

  if (newsletterForm) {
    var newsletterStatus = document.getElementById("newsletterStatus");
    var newsletterEmail = document.getElementById("newsletterEmail");

    newsletterForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = newsletterEmail.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        newsletterStatus.style.color = "#ff6b5e";
        newsletterStatus.textContent = "Enter a valid email address.";
        newsletterEmail.focus();
        return;
      }

      console.log("Newsletter signup:", value);
      newsletterStatus.style.color = "";
      newsletterStatus.textContent = "You're on the list.";
      newsletterForm.reset();
    });
  }
})();
