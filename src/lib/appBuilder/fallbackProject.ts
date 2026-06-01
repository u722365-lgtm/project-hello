import type { AppPlatform, AppProject } from "./types";

function slugTitle(prompt: string): string {
  const words = prompt
    .replace(/^(build|create|make|generate|develop|design)\s+(me\s+)?(a\s+)?/i, "")
    .replace(/\b(mobile|web)\s+(app|application)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 4);
  if (words.length === 0) return "My App";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

const MOBILE_SHELL = (title: string, accent: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0f172a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-shell">
    <header class="top-bar">
      <button type="button" class="icon-btn" id="menu-btn" aria-label="Menu">☰</button>
      <h1>${title}</h1>
      <button type="button" class="icon-btn" id="profile-btn" aria-label="Profile">👤</button>
    </header>
    <main class="content" id="main-content">
      <section class="hero-card">
        <p class="eyebrow">Welcome back</p>
        <h2>Your ${title} is ready</h2>
        <p class="muted">Tap actions below — built as a mobile-first web app you can preview and extend in the IDE.</p>
      </section>
      <div class="action-grid" id="action-grid"></div>
      <section class="list-section">
        <h3>Recent</h3>
        <ul id="recent-list" class="item-list"></ul>
      </section>
    </main>
    <nav class="tab-bar" id="tab-bar">
      <button type="button" data-tab="home" class="active">🏠<span>Home</span></button>
      <button type="button" data-tab="explore">🔍<span>Explore</span></button>
      <button type="button" data-tab="add">➕<span>Add</span></button>
      <button type="button" data-tab="alerts">🔔<span>Alerts</span></button>
      <button type="button" data-tab="profile">👤<span>Profile</span></button>
    </nav>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

const WEB_SHELL = (title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav class="navbar">
    <span class="brand">${title}</span>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#app">App</a>
      <button type="button" class="btn-primary" id="cta-btn">Get Started</button>
    </div>
  </nav>
  <header class="hero">
    <h1>${title}</h1>
    <p id="hero-subtitle">A complete web app scaffold — edit, preview, and ship from ShadowTalk IDE.</p>
    <div class="hero-actions">
      <button type="button" class="btn-primary" id="primary-action">Launch app</button>
      <button type="button" class="btn-ghost" id="secondary-action">Learn more</button>
    </div>
  </header>
  <section id="features" class="features">
    <h2>Features</h2>
    <div class="feature-grid" id="feature-grid"></div>
  </section>
  <section id="app" class="app-panel">
    <h2>Live demo</h2>
    <div id="app-root" class="app-root"></div>
  </section>
  <footer><p>© ${new Date().getFullYear()} ${title}. Built with ShadowTalk.</p></footer>
  <script src="app.js"></script>
</body>
</html>`;

export function buildFallbackProject(prompt: string, platform: AppPlatform): AppProject {
  const title = slugTitle(prompt);
  const accent = platform === "mobile" ? "#6366f1" : "#8b5cf6";

  const styleCss =
    platform === "mobile"
      ? `* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --bg: #0f172a; --surface: #1e293b; --text: #f1f5f9; --muted: #94a3b8; --accent: ${accent}; }
body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); min-height: 100dvh; }
.app-shell { max-width: 430px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg); }
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; padding-top: max(0.75rem, env(safe-area-inset-top)); border-bottom: 1px solid #334155; }
.top-bar h1 { font-size: 1rem; font-weight: 700; }
.icon-btn { background: var(--surface); border: none; color: var(--text); width: 40px; height: 40px; border-radius: 12px; font-size: 1.1rem; cursor: pointer; }
.content { flex: 1; overflow-y: auto; padding: 1rem; padding-bottom: 5rem; }
.hero-card { background: linear-gradient(135deg, #1e293b, #312e81); border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; border: 1px solid #334155; }
.eyebrow { font-size: 0.75rem; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.06em; }
.hero-card h2 { font-size: 1.35rem; margin: 0.35rem 0; }
.muted { color: var(--muted); font-size: 0.9rem; line-height: 1.5; }
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem; }
.action-card { background: var(--surface); border: 1px solid #334155; border-radius: 14px; padding: 1rem; text-align: left; cursor: pointer; color: inherit; }
.action-card strong { display: block; margin-top: 0.35rem; }
.list-section h3 { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase; }
.item-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.item-list li { background: var(--surface); padding: 0.85rem 1rem; border-radius: 12px; border: 1px solid #334155; font-size: 0.9rem; }
.tab-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: min(430px, 100%); display: flex; background: #1e293bee; backdrop-filter: blur(12px); border-top: 1px solid #334155; padding-bottom: env(safe-area-inset-bottom); }
.tab-bar button { flex: 1; border: none; background: none; color: var(--muted); padding: 0.5rem; font-size: 0.65rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.tab-bar button.active { color: var(--accent); }`
      : `* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --bg: #0f172a; --surface: #1e293b; --text: #f1f5f9; --muted: #94a3b8; --accent: ${accent}; }
body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); }
.navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #334155; position: sticky; top: 0; background: #0f172aee; backdrop-filter: blur(10px); z-index: 10; }
.brand { font-weight: 800; font-size: 1.15rem; }
.nav-links { display: flex; align-items: center; gap: 1.5rem; }
.nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; }
.btn-primary { padding: 0.6rem 1.25rem; border: none; border-radius: 8px; background: var(--accent); color: white; font-weight: 600; cursor: pointer; }
.btn-ghost { padding: 0.6rem 1.25rem; border: 1px solid #334155; border-radius: 8px; background: transparent; color: var(--text); cursor: pointer; }
.hero { text-align: center; padding: 5rem 1.5rem 3rem; max-width: 720px; margin: 0 auto; }
.hero h1 { font-size: clamp(2rem, 5vw, 3rem); margin-bottom: 1rem; }
.hero p { color: var(--muted); line-height: 1.6; margin-bottom: 2rem; }
.hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.features { max-width: 1000px; margin: 0 auto; padding: 3rem 1.5rem; }
.features h2 { text-align: center; margin-bottom: 2rem; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.feature-card { background: var(--surface); border: 1px solid #334155; border-radius: 14px; padding: 1.25rem; }
.app-panel { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.app-root { background: var(--surface); border-radius: 16px; padding: 2rem; border: 1px solid #334155; min-height: 200px; }
footer { text-align: center; padding: 2rem; color: var(--muted); border-top: 1px solid #334155; }`;

  const appJs =
    platform === "mobile"
      ? `const actions = [
  { icon: '✨', title: 'Quick start', desc: 'Open your main flow' },
  { icon: '📊', title: 'Insights', desc: 'View stats & trends' },
  { icon: '📝', title: 'New item', desc: 'Add something new' },
  { icon: '⚙️', title: 'Settings', desc: 'Preferences & account' },
];

const recent = [
  'Updated profile — just now',
  'Completed onboarding — today',
  'Synced data — yesterday',
];

document.getElementById('action-grid').innerHTML = actions.map(a =>
  \`<button type="button" class="action-card" data-action="\${a.title}"><span>\${a.icon}</span><strong>\${a.title}</strong><span class="muted">\${a.desc}</span></button>\`
).join('');

document.getElementById('recent-list').innerHTML = recent.map(r => \`<li>\${r}</li>\`).join('');

document.querySelectorAll('.action-card').forEach(btn => {
  btn.addEventListener('click', () => alert(btn.dataset.action + ' — customize in app.js'));
});

document.querySelectorAll('#tab-bar button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tab-bar button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.tab === 'add') alert('Add flow — wire your create screen here');
  });
});

console.log('${title} mobile app loaded');`
      : `const features = [
  { title: 'Fast & responsive', body: 'Mobile-first layout with modern CSS.' },
  { title: 'Interactive UI', body: 'Client-side routing-ready structure in app.js.' },
  { title: 'Easy to extend', body: 'Multi-file project: HTML, CSS, and JavaScript.' },
  { title: 'Preview ready', body: 'Run live preview in ShadowTalk IDE.' },
];

document.getElementById('feature-grid').innerHTML = features.map(f =>
  \`<article class="feature-card"><h3>\${f.title}</h3><p>\${f.body}</p></article>\`
).join('');

const appRoot = document.getElementById('app-root');
appRoot.innerHTML = '<p>Interactive demo panel — replace with your app UI.</p><button type="button" class="btn-primary" id="demo-btn">Run demo action</button>';
document.getElementById('demo-btn')?.addEventListener('click', () => {
  appRoot.innerHTML += '<p style="margin-top:1rem;color:#94a3b8">Demo action completed ✓</p>';
});

document.getElementById('cta-btn')?.addEventListener('click', () => document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' }));
document.getElementById('primary-action')?.addEventListener('click', () => document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' }));
document.getElementById('secondary-action')?.addEventListener('click', () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }));

console.log('${title} web app loaded');`;

  const readme = `# ${title}

${platform === "mobile" ? "Mobile-first" : "Web"} app generated by ShadowTalk.

## User request
${prompt.slice(0, 500)}

## Files
- \`index.html\` — structure
- \`style.css\` — styles (${platform === "mobile" ? "375px-friendly" : "responsive"})
- \`app.js\` — behavior

## Preview
Open the IDE preview panel. For mobile apps, switch the viewport to **Mobile** (375px).

## Next steps
- Customize copy and colors in \`style.css\`
- Add screens and navigation in \`app.js\`
- Export or deploy when ready
`;

  return {
    title,
    platform,
    description: `Fallback scaffold for: ${prompt.slice(0, 120)}`,
    files: [
      {
        name: "index.html",
        language: "html",
        content: platform === "mobile" ? MOBILE_SHELL(title, accent) : WEB_SHELL(title),
      },
      { name: "style.css", language: "css", content: styleCss },
      { name: "app.js", language: "javascript", content: appJs },
      { name: "README.md", language: "markdown", content: readme },
    ],
  };
}
