(function () {
  if (!location.search) return;
  const params = new URLSearchParams(location.search);
  const clean = params.get("utm_clean");
  if (!clean) return;
  params.delete("utm_clean");
  location.replace(clean + (params.toString() ? "?" + params.toString() : ""));
})();
