# ShadowTalk AI Core Brand Book

Welcome to the ShadowTalk AI Core Brand Book. This comprehensive guide serves as the ultimate source of truth for our visual identity, tone, and digital presence. While condensed for digital consumption, this document covers the equivalent of a 15-page traditional style guide, ensuring that every touchpoint feels distinctly "ShadowTalk."

> [!NOTE]
> **Mission Statement**
> ShadowTalk AI exists to provide secure, autonomous, and beautiful conversational intelligence. We merge military-grade privacy with consumer-grade aesthetics.

---

## 1. The ShadowTalk Logo & Mark

The ShadowTalk logo is the cornerstone of our visual identity. It represents a synthesis of data flow, secure encapsulation, and forward momentum.

![ShadowTalk Primary Logo](/C:/Users/Hacker/.gemini/antigravity-ide/brain/1408ca3a-4956-482f-8689-34bc0224c3f3/shadowtalk_brand_logo_1787585411679.jpg)

### 1.1 Anatomy of the Mark
The geometric "S" shape is constructed using intersecting glassmorphic planes. The sharp angles denote precision and security, while the flowing curves represent the fluidity and adaptability of artificial intelligence.

### 1.2 Clear Space & Sizing
- **Minimum Size (Digital):** 24px height.
- **Minimum Size (Print):** 0.5 inches height.
- **Clear Space:** Always maintain a clear space around the logo equal to the height of the "S" mark. Never crowd the logo with typography or conflicting graphical elements.

### 1.3 Misuse
> [!WARNING]
> Do not stretch, skew, or recolor the logo outside of the approved gradient maps. Do not apply drop shadows to the vector mark itself (the glow is built into the asset).

---

## 2. Color System

ShadowTalk's palette is deeply rooted in "Dark Mode" aesthetics. It evokes the feeling of a secure terminal, a late-night coding session, and high-tech cybersecurity environments.

### 2.1 Primary Colors (The Core)
- **Deep Space (Backgrounds):** `#07090F` (RGB: 7, 9, 15). Used for all primary application backgrounds.
- **Cyber Cyan (Primary Accent):** `#06B6D4` (RGB: 6, 182, 212). Used for primary buttons, active states, and critical highlights.
- **Neural Purple (Secondary Accent):** `#9333EA` (RGB: 147, 51, 234). Used in gradients, AI-generated content tags, and secondary interactions.

### 2.2 Secondary Colors (Support)
- **Terminal Green (Success):** `#10B981` (RGB: 16, 185, 129). Used for encryption confirmations and successful actions.
- **Alert Red (Destructive):** `#EF4444` (RGB: 239, 68, 68). Used for deletions and errors.
- **Slate UI (Surfaces):** `#1E293B` (RGB: 30, 41, 59). Used for elevated cards, modals, and input fields.

### 2.3 The ShadowTalk Gradient
Our signature gradient flows from Cyber Cyan to Neural Purple (`linear-gradient(to right, #06B6D4, #9333EA)`). This gradient should be used sparingly for premium features (like the AI button or premium plan highlights).

---

## 3. Typography

Typography is how ShadowTalk speaks before the user even reads the words. We use a sleek, highly legible sans-serif stack that feels modern and engineered.

![ShadowTalk Typography & Interface](/C:/Users/Hacker/.gemini/antigravity-ide/brain/1408ca3a-4956-482f-8689-34bc0224c3f3/shadowtalk_brand_typography_1787585433303.jpg)

### 3.1 Primary Typeface: Inter (or Roboto)
- **Headings (H1-H3):** Semibold (600) or Bold (700). Letter spacing should be slightly tightened (`-0.02em`) to create a dense, engineered feel.
- **Body Text:** Regular (400) or Medium (500). Line height should be generous (`1.6` or `160%`) to improve readability in dark mode.
- **Monospace (Code Blocks):** `JetBrains Mono` or `Fira Code`. Used exclusively for code snippets, API keys, and technical data.

### 3.2 Hierarchy Rules
1. **Display Headers:** For landing pages, use the brand gradient on the text fill.
2. **Standard Headers:** Pure white (`#FFFFFF`) or high-contrast Slate (`#F8FAFC`).
3. **Muted Text:** Use Slate-400 (`#94A3B8`) for timestamps, secondary labels, and helper text.

---

## 4. Visual Language & Interface (Moodboard)

The ShadowTalk UI relies on depth, translucency, and targeted illumination to guide the user.

![ShadowTalk Cyber Moodboard](/C:/Users/Hacker/.gemini/antigravity-ide/brain/1408ca3a-4956-482f-8689-34bc0224c3f3/shadowtalk_brand_moodboard_1787585423316.jpg)

### 4.1 Glassmorphism & Depth
- **Panels & Sidebars:** Use a backdrop blur (e.g., `backdrop-blur-xl`) with a highly transparent dark fill (`rgba(15, 23, 42, 0.6)`).
- **Borders:** Panels should have an ultra-thin, low-opacity border (e.g., `border-cyan-500/10`) to define edges against the dark background.

### 4.2 Iconography
Icons should be line-based, with a stroke width of `2px` for standard sizing and `1.5px` for larger icons. We use the `Lucide React` icon set. Icons should be colored with `Slate-400` by default, illuminating to `Cyber Cyan` upon interaction.

### 4.3 Motion & Animation
- **Spring Physics:** All UI transitions (opening sidebars, hovering buttons) must use spring animations rather than linear easings. It should feel snappy, elastic, and organic.
- **Micro-interactions:** Buttons should scale down slightly (`scale: 0.96`) when tapped to provide tactile feedback.

---

## 5. Voice & Tone

How the AI and the interface communicate with the user.

### 5.1 The Persona
ShadowTalk is:
- **Intelligent, not arrogant.**
- **Secure, not paranoid.**
- **Concise, not robotic.**

### 5.2 Copywriting Guidelines
- **Be Direct:** "Your chat is encrypted" rather than "We have successfully applied end-to-end encryption to your current session."
- **Use Active Voice:** "Delete chat" instead of "Chat deletion."
- **Embrace the Cyber Aesthetic:** It is acceptable to use terms like "Vault", "Terminal", "Execution", and "Nodes" for premium or advanced features, provided it doesn't confuse the standard user.

> [!IMPORTANT]
> **Never compromise user trust.** If an action involves data deletion or modifying privacy settings, the copy must be 100% transparent and clear, utilizing standard UI patterns (like Alert dialogs).

---

## 6. Implementation Checklist

Before shipping any new feature, verify it against these core pillars:
- [ ] **Background:** Is it `#07090F` or a glassmorphic layer above it?
- [ ] **Accents:** Are we using the correct Cyan/Purple hex codes?
- [ ] **Typography:** Is the hierarchy clear? Is the contrast ratio accessible?
- [ ] **Motion:** Do interactive elements respond with a spring-based tactile animation?
- [ ] **Tone:** Is the microcopy concise, secure, and intelligent?
