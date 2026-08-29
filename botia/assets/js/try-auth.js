(() => {
  "use strict";

  const GOOGLE_CLIENT_ID =
    "888782651551-oqrtul7q13m1jt5rpma5q7s6d14v5623.apps.googleusercontent.com";

  const ACCESS_ENDPOINT =
  "https://check-user-access-halal-4c77i2y4pq-ew.a.run.app";

  const TOKEN_KEY = "botia_web_google_token";
  const UID_KEY = "botia_web_uid";

  let googleToken = "";
  let uid = "";

  function lang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q) return q.toLowerCase().split("-")[0];

    try {
      const saved = localStorage.getItem("botia-lang");
      if (saved) return saved;
    } catch (_) {}

    return (navigator.language || "en").toLowerCase().split("-")[0];
  }

  function text() {
    if (lang() === "es") {
      return {
        title: "Continuar con Google",
        intro: "Identifícate para usar BOTIA.",
        checking: "Comprobando acceso…",
        denied: "Has alcanzado tu límite de escaneos.",
        error: "No se ha podido comprobar el acceso. Inténtalo de nuevo."
      };
    }

    return {
      title: "Continue with Google",
      intro: "Sign in to use BOTIA.",
      checking: "Checking access…",
      denied: "You have reached your scan limit.",
      error: "BOTIA could not verify access. Try again."
    };
  }

  function setStatus(message, error = false) {
    const node = document.getElementById("botia-auth-status");
    if (!node) return;

    node.textContent = message || "";
    node.style.color = error ? "#d97070" : "#c0a08c";
  }

  function showLogin() {
    const panel = document.getElementById("botia-auth-panel");
    const box = document.querySelector(".try-box");

    if (panel) {
      panel.hidden = false;
      // Restore the login content if it was replaced
      const copy = text();
      panel.innerHTML = `
        <div style="color:#ffd8bd;font-size:1.05rem;font-weight:700;margin-bottom:8px">
          ${copy.title}
        </div>
        <div style="color:#9c8578;font-size:.88rem;margin-bottom:16px">
          ${copy.intro}
        </div>
        <div id="botia-google-button" style="display:flex;justify-content:center"></div>
        <div id="botia-auth-status"
             style="font-size:.86rem;margin-top:12px;min-height:1.3em"></div>
      `;
      // Re-render Google button
      renderGoogleButton();
    }
    if (box) box.hidden = true;
  }

  function showLimitReached() {
    const panel = document.getElementById("botia-auth-panel");
    const box = document.querySelector(".try-box");

    if (panel) {
      panel.hidden = false;
      const copy = text();
      panel.innerHTML = `
        <div style="color:#ffd8bd;font-size:1.05rem;font-weight:700;margin-bottom:8px">
          ${copy.denied}
        </div>
        <div id="botia-auth-status"
             style="font-size:.86rem;margin-top:12px;min-height:1.3em;color:#d97070"></div>
      `;
    }
    if (box) box.hidden = true;
  }

  function showTry() {
    const panel = document.getElementById("botia-auth-panel");
    const box = document.querySelector(".try-box");

    if (panel) panel.hidden = true;
    if (box) box.hidden = false;
  }

  function clearSession() {
    googleToken = "";
    uid = "";

    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(UID_KEY);
    } catch (_) {}
  }

  async function checkAccess() {
    if (!googleToken) {
      showLogin();
      return { allowed: false, uid: "" };
    }

    setStatus(text().checking);

    const form = new FormData();
    form.append("google_id_token", googleToken);
    form.append("lang", lang());
    form.append("zona", "");

    if (uid) {
      form.append("uid", uid);
    }

    try {
      const response = await fetch(ACCESS_ENDPOINT, {
        method: "POST",
        body: form
      });

      let data = {};

      try {
        data = await response.json();
      } catch (_) {}

      if (
        response.status === 401 ||
        data.error === "GOOGLE_AUTH_REQUIRED" ||
        data.error === "INVALID_GOOGLE_TOKEN" ||
        data.error === "INVALID_GOOGLE_IDENTITY"
      ) {
        clearSession();
        showLogin();
        setStatus(text().error, true);
        return { allowed: false, uid: "" };
      }

      if (!response.ok || data.error) {
        setStatus(text().error, true);
        return { allowed: false, uid: uid };
      }

      uid = data.uid || uid;

      try {
        sessionStorage.setItem(TOKEN_KEY, googleToken);
        sessionStorage.setItem(UID_KEY, uid);
      } catch (_) {}

      if (data.allowed !== true) {
        // Do NOT show the Google login again. Show limit reached message.
        showLimitReached();
        setStatus(text().denied, true);
        return {
          allowed: false,
          uid: uid,
          reason: data.reason || ""
        };
      }

      setStatus("");
      showTry();

      return {
        allowed: true,
        uid: uid,
        reason: data.reason || ""
      };
    } catch (error) {
      console.error("BOTIA access check failed", error);
      setStatus(text().error, true);

      return {
        allowed: false,
        uid: uid
      };
    }
  }

  async function handleGoogleCredential(response) {
    googleToken = response && response.credential
      ? response.credential
      : "";

    if (!googleToken) {
      setStatus(text().error, true);
      return;
    }

    await checkAccess();
  }

  function renderGoogleButton() {
    if (!window.google || !google.accounts || !google.accounts.id) {
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential
    });

    google.accounts.id.renderButton(
      document.getElementById("botia-google-button"),
      {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 280
      }
    );
  }

  function loadGoogle() {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setStatus(text().error, true);
    document.head.appendChild(script);
  }

  function buildPanel() {
    const box = document.querySelector(".try-box");
    if (!box) return;

    const copy = text();

    const panel = document.createElement("section");
    panel.id = "botia-auth-panel";
    panel.style.cssText =
      "background:rgba(24,13,13,.92);" +
      "border:1px solid rgba(190,122,72,.35);" +
      "border-radius:14px;" +
      "padding:22px 20px;" +
      "margin:0 0 24px;" +
      "text-align:center;";

    panel.innerHTML = `
      <div style="color:#ffd8bd;font-size:1.05rem;font-weight:700;margin-bottom:8px">
        ${copy.title}
      </div>
      <div style="color:#9c8578;font-size:.88rem;margin-bottom:16px">
        ${copy.intro}
      </div>
      <div id="botia-google-button" style="display:flex;justify-content:center"></div>
      <div id="botia-auth-status"
           style="font-size:.86rem;margin-top:12px;min-height:1.3em"></div>
    `;

    box.before(panel);
    box.hidden = true;
  }

  async function init() {
    buildPanel();

    try {
      googleToken = sessionStorage.getItem(TOKEN_KEY) || "";
      uid = sessionStorage.getItem(UID_KEY) || "";
    } catch (_) {}

    loadGoogle();

    if (googleToken) {
      await checkAccess();
    } else {
      showLogin();
    }
  }

  window.BOTIA_WEB_AUTH = {
    ensureAccess: checkAccess,
    getUid: () => uid
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
