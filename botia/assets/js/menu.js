// BOTIA shared hamburger menu
(() => {
  "use strict";

  const SUPPORTED_LANGUAGES = new Set([
    "en", "es", "ar", "de", "fr", "nl", "it", "pt",
    "pl", "ro", "ru", "tr", "zh", "id"
  ]);

  let menuRequest;
  let labelRequest;

  const normaliseLanguage = value => {
    const language = String(value || "").toLowerCase().split("-")[0];
    return SUPPORTED_LANGUAGES.has(language) ? language : "en";
  };

  const currentLanguage = () => {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    if (queryLanguage) return normaliseLanguage(queryLanguage);

    try {
      const storedLanguage = localStorage.getItem("botia-lang");
      if (storedLanguage) return normaliseLanguage(storedLanguage);
    } catch (_) {
      // localStorage can be unavailable in some WebViews.
    }

    return normaliseLanguage(document.documentElement.lang || navigator.language);
  };

  const loadMenu = () => {
    if (!menuRequest) {
      menuRequest = fetch("/botia/assets/menu.json", { cache: "force-cache" })
        .then(response => {
          if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);
          return response.json();
        });
    }
    return menuRequest;
  };

  const loadLabels = language => {
    if (!labelRequest) {
      const fetchLanguage = lang => fetch(`/i18n/${lang}/landing.json`, { cache: "force-cache" })
        .then(response => {
          if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
          return response.json();
        });

      labelRequest = fetchLanguage(language)
        .catch(() => language === "en" ? {} : fetchLanguage("en"));
    }
    return labelRequest;
  };

  const translated = (labels, key) => labels[key] || key;

  const preserveLanguage = (path, language) => {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("lang", language);
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const createLink = (item, labels, language, className) => {
    const link = document.createElement("a");
    link.className = className;
    link.href = preserveLanguage(item.url, language);
    link.textContent = translated(labels, item.label_key);

    if (new URL(link.href).pathname === window.location.pathname) {
      link.setAttribute("aria-current", "page");
    }

    return link;
  };

  const buildDrawer = (menu, labels, language) => {
    const overlay = document.createElement("div");
    overlay.id = "botiaMenuOverlay";
    overlay.className = "botia-menu-overlay";
    overlay.hidden = true;

    const drawer = document.createElement("aside");
    drawer.id = "botiaDrawer";
    drawer.className = "botia-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-label", "BOTIA menu");

    const header = document.createElement("div");
    header.className = "botia-drawer-header";

    const brand = document.createElement("span");
    brand.className = "botia-drawer-brand";
    brand.textContent = "BOTIA";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "botia-menu-close";
    closeButton.setAttribute("aria-label", "Close menu");
    closeButton.textContent = "×";

    header.append(brand, closeButton);

    const navigation = document.createElement("nav");
    navigation.className = "botia-drawer-nav";
    navigation.setAttribute("aria-label", "BOTIA");

    menu.sections.forEach((section, index) => {
      if (section.url) {
        navigation.appendChild(createLink(
          section,
          labels,
          language,
          "botia-menu-link botia-menu-main-link"
        ));
        return;
      }

      const group = document.createElement("section");
      group.className = "botia-menu-group";

      const sectionButton = document.createElement("button");
      sectionButton.type = "button";
      sectionButton.className = "botia-menu-section-title";
      sectionButton.textContent = translated(labels, section.label_key);
      sectionButton.setAttribute("aria-expanded", "false");

      const submenuId = `botiaSubmenu${index}`;
      sectionButton.setAttribute("aria-controls", submenuId);

      const submenu = document.createElement("div");
      submenu.id = submenuId;
      submenu.className = "botia-submenu";
      submenu.hidden = true;

      section.items.forEach(item => {
        submenu.appendChild(createLink(
          item,
          labels,
          language,
          "botia-menu-link botia-submenu-link"
        ));
      });

      sectionButton.addEventListener("click", () => {
        const expanded = sectionButton.getAttribute("aria-expanded") === "true";
        sectionButton.setAttribute("aria-expanded", String(!expanded));
        submenu.hidden = expanded;
      });

      group.append(sectionButton, submenu);
      navigation.appendChild(group);
    });

    drawer.append(header, navigation);
    document.body.append(overlay, drawer);

    return { overlay, drawer, closeButton };
  };

  const initialise = async () => {
    const menuButton = document.getElementById("menuBtn");
    if (!menuButton) return;

    menuButton.type = "button";
    menuButton.setAttribute("aria-controls", "botiaDrawer");
    menuButton.setAttribute("aria-expanded", "false");

    const language = currentLanguage();

    try {
      const [menu, labels] = await Promise.all([
        loadMenu(),
        loadLabels(language)
      ]);

      const { overlay, drawer, closeButton } = buildDrawer(menu, labels, language);
      let previousFocus = null;

      const openDrawer = () => {
        previousFocus = document.activeElement;
        overlay.hidden = false;
        requestAnimationFrame(() => document.body.classList.add("botia-menu-open"));
        drawer.setAttribute("aria-hidden", "false");
        menuButton.setAttribute("aria-expanded", "true");
        closeButton.focus();
      };

      const closeDrawer = () => {
        document.body.classList.remove("botia-menu-open");
        drawer.setAttribute("aria-hidden", "true");
        menuButton.setAttribute("aria-expanded", "false");
        window.setTimeout(() => {
          overlay.hidden = true;
          if (previousFocus instanceof HTMLElement) previousFocus.focus();
        }, 220);
      };

      menuButton.addEventListener("click", openDrawer);
      closeButton.addEventListener("click", closeDrawer);
      overlay.addEventListener("click", closeDrawer);
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && document.body.classList.contains("botia-menu-open")) {
          closeDrawer();
        }
      });
    } catch (error) {
      console.error("BOTIA menu could not be loaded.", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
