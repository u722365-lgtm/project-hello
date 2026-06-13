(function () {
  var ORIGIN = "https://www.shadowtalk-ai.com";
  var href = ORIGIN + "/chatbot?utm_source=embed&utm_medium=badge&utm_campaign=viral_widget";
  var el = document.createElement("a");
  el.href = href;
  el.target = "_blank";
  el.rel = "noopener noreferrer";
  el.setAttribute("data-shadowtalk-badge", "1");
  el.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;font:600 13px system-ui,sans-serif;color:#e8e8ef;background:linear-gradient(135deg,#0f172a,#1e1b4b);border:1px solid rgba(56,189,248,0.35);text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,0.25);";
  el.innerHTML = '<span style="color:#38bdf8">⚡</span> Powered by <strong style="color:#fff">ShadowTalk AI</strong>';
  var mount = document.currentScript && document.currentScript.parentNode;
  if (mount) mount.appendChild(el);
})();