/* =========================================================================
   BARBELL BRIGADE — interactions
   1. Mobile navigation
   2. Header state + active nav link on scroll
   3. Scroll reveal
   4. Animated stat counters
   5. Testimonial carousel
   6. Contact form validation
   7. Newsletter form
   8. Starter-kit download capture
   ========================================================================= */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Shared by more than one form, so these live up here rather than inside
     whichever section happened to need them first. §6 and §8 are both lead
     capture into the same inbox: two copies of an endpoint is one copy that
     gets missed when it changes. */

  // Deliberately loose: the only thing worth rejecting in the browser is a
  // typo, and the address is really verified by whether the email arrives.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Where enquiries go. FormSubmit relays to this address; it needs no account,
  // but the FIRST submission triggers a confirmation email that must be clicked
  // before anything is delivered.
  //
  // The address is visible in the page source here, which is scrapeable. After
  // activating, FormSubmit issues an alias (formsubmit.co/ajax/<hash>) that
  // relays to the same inbox without publishing it — swap it in below and
  // nothing else needs to change.
  var ENQUIRY_ENDPOINT = "https://formsubmit.co/ajax/roy@steerconstruction.com";
  var CONTACT_FALLBACK = "roy@steerconstruction.com";
  var HONEYPOT_FIELD = "_honey";

  // Absolute because it travels in an email. robots.txt keeps this page out of
  // search, which is what makes it worth an email address.
  var GUIDE_URL = "https://roy866.github.io/Barbell-Brigade-/assets/first-session-guide.html";

  // The goal <select> submits terse values; both the relayed notification and
  // the mailto fallback read better with the words the member actually chose.
  var GOAL_LABELS = {
    general: "Just get fit and feel better",
    strength: "Get stronger",
    weight: "Lose weight",
    return: "Return after a break or injury",
    performance: "Train for a sport or event",
  };

  // Last-resort delivery path when the relay refuses. A mailto: depends on
  // nothing but the visitor's own mail client, so it survives the relay being
  // down, rate-limited or not yet activated — the cases where an enquiry would
  // otherwise be lost silently.
  function buildEnquiryMailto(payload) {
    var lines = [
      "Name:  " + payload.name,
      "Email: " + payload.email,
      "Phone: " + payload.phone,
      "Goal:  " + (GOAL_LABELS[payload.goal] || payload.goal),
      "",
      payload.message || "(no additional message)",
    ];
    return (
      "mailto:" +
      CONTACT_FALLBACK +
      "?subject=" +
      encodeURIComponent("Free week request — " + payload.name) +
      "&body=" +
      encodeURIComponent(lines.join("\n"))
    );
  }

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
    var submitBtn = contactForm.querySelector('button[type="submit"]');

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

      var payload = {};
      new FormData(contactForm).forEach(function (value, key) {
        payload[key] = typeof value === "string" ? value.trim() : value;
      });

      // Bots fill every field they find. A real person never sees this one, so
      // anything in it means the submission is automated — drop it silently
      // rather than bouncing it, which would only tell the bot to try again.
      if (payload[HONEYPOT_FIELD]) {
        contactForm.reset();
        return;
      }
      delete payload[HONEYPOT_FIELD];

      // Split on whitespace rather than a single space: an untrimmed leading
      // space made split(" ")[0] return "", greeting the member as "Thanks  —".
      var firstName = payload.name.split(/\s+/)[0];

      submitBtn.disabled = true;
      formStatus.style.color = "";
      formStatus.textContent = "Sending…";

      window
        .fetch(ENQUIRY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            goal: GOAL_LABELS[payload.goal] || payload.goal,
            message: payload.message,
            _subject: "Free week request — " + payload.name,
            // FormSubmit shows its own captcha page otherwise, which breaks the
            // AJAX flow: the POST resolves but no mail is ever sent.
            _captcha: "false",
          }),
        })
        .then(function (response) {
          // FormSubmit answers 200 even when it refuses to deliver — an
          // unactivated form, a blocked address — and puts the real verdict in
          // the body. Trusting the status code alone showed the visitor a
          // confirmation for an enquiry that was never sent.
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              if (!response.ok || String(data.success) !== "true") {
                throw new Error(data.message || "HTTP " + response.status);
              }
            });
        })
        .then(function () {
          formStatus.style.color = "";
          formStatus.textContent =
            "Thanks " + firstName + " — we'll be in touch within one working day.";
          contactForm.reset();
        })
        .catch(function (error) {
          // Never claim success we cannot verify. The relay is a third party
          // that can be down, rate-limited or awaiting activation, so failure
          // has to leave a route that depends on nothing but the visitor's own
          // mail client — asking them to retype it into an email is how an
          // enquiry gets abandoned. Hand them one prefilled and ready to send.
          formStatus.style.color = "var(--danger)";
          formStatus.textContent = "Sorry — that didn't send. ";

          var rescue = document.createElement("a");
          rescue.href = buildEnquiryMailto(payload);
          rescue.textContent = "Send it as an email instead";
          formStatus.appendChild(rescue);
          formStatus.appendChild(
            document.createTextNode(" — it opens prefilled, nothing to retype.")
          );

          if (window.console) console.error("Enquiry submission failed:", error);
        })
        .then(function () {
          submitBtn.disabled = false;
        });
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

      if (!EMAIL_RE.test(value)) {
        newsletterStatus.classList.add("is-error");
        newsletterStatus.textContent = "Enter a valid email address.";
        newsletterEmail.focus();
        return;
      }

      console.log("Newsletter signup:", value);
      newsletterStatus.classList.remove("is-error");
      newsletterStatus.textContent = "You're on the list.";
      newsletterForm.reset();
    });
  }

  /* -------------------- 8. Starter-kit download capture ------------------- */
  /* The low-commitment ask: one field, so it gets its own tiny handler rather
     than a rule in the §6 array — there is no error paragraph per field to
     drive, and success swaps the form out for a panel instead of printing a
     line of status text. */
  var kitForm = document.getElementById("kitForm");

  if (kitForm) {
    var kitEmail = document.getElementById("kitEmail");
    var kitError = document.getElementById("kitError");
    var kitStatus = document.getElementById("kitStatus");
    var kitDone = document.getElementById("kitDone");
    var kitDoneEmail = document.getElementById("kitDoneEmail");
    var kitSubmit = kitForm.querySelector('button[type="submit"]');

    function setKitError(message) {
      kitError.textContent = message;
      kitEmail.parentElement.classList.toggle("invalid", Boolean(message));
      kitEmail.setAttribute("aria-invalid", String(Boolean(message)));
    }

    // Clear the error as soon as they start fixing it, matching §6's behaviour.
    kitEmail.addEventListener("input", function () {
      if (kitError.textContent) setKitError("");
    });

    kitForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = kitEmail.value.trim();

      if (!EMAIL_RE.test(value)) {
        setKitError("We need a working address to send the plan to.");
        kitEmail.focus();
        return;
      }

      // A bot that fills the trap gets the same confirmation a person does, so
      // it has no signal to retry against — but nothing is sent.
      if (kitForm.elements[HONEYPOT_FIELD] && kitForm.elements[HONEYPOT_FIELD].value) {
        showKitDone(value);
        return;
      }

      setKitError("");
      kitSubmit.disabled = true;
      kitStatus.classList.remove("is-error");
      kitStatus.textContent = "Sending…";

      window
        .fetch(ENQUIRY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            email: value,
            _subject: "First Four Weeks download — " + value,
            // This is what makes the confirmation panel true: FormSubmit mails
            // the address that submitted, so the reader genuinely receives the
            // link rather than only seeing it on screen.
            _autoresponse:
              "Here's your First Four Weeks plan: " +
              GUIDE_URL +
              "\n\nIt prints onto two sides of one sheet, or keep it on your phone.\n\n" +
              "When you're ready to do it with a coach watching, your first week is free — " +
              "just reply to this email.\n\n— Barbell Brigade",
            _captcha: "false",
          }),
        })
        .then(function (response) {
          // FormSubmit answers 200 even when it refuses to deliver, and puts
          // the real verdict in the body — same trap as §6.
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              if (!response.ok || String(data.success) !== "true") {
                throw new Error(data.message || "HTTP " + response.status);
              }
            });
        })
        .then(function () {
          showKitDone(value);
        })
        .catch(function (error) {
          // The guide is a static page, so a failed POST costs them the emailed
          // copy but not the plan itself. Hand the link over directly rather
          // than asking them to retry for something already sitting there —
          // built from nodes because it carries a real link, not just text.
          kitStatus.classList.add("is-error");
          kitStatus.textContent = "That didn't send, so we couldn't email your copy. ";

          var rescue = document.createElement("a");
          rescue.href = GUIDE_URL;
          rescue.textContent = "Open the plan here";
          kitStatus.appendChild(rescue);
          kitStatus.appendChild(
            document.createTextNode(" — or mail " + CONTACT_FALLBACK + " and we'll send it over.")
          );

          if (window.console) console.error("Starter kit submission failed:", error);
        })
        .then(function () {
          kitSubmit.disabled = false;
        });
    });

    function showKitDone(email) {
      // textContent, never innerHTML: this string came from a form field.
      kitDoneEmail.textContent = email;
      kitStatus.textContent = "";
      kitForm.hidden = true;
      kitDone.hidden = false;
      // Move focus into the panel — otherwise focus is left on a button that is
      // no longer in the document and the swap goes unannounced.
      kitDone.setAttribute("tabindex", "-1");
      kitDone.focus();
    }
  }
})();
