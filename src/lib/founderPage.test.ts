import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PAGE_SEO } from "./seo";
import { CHAT_SIDEBAR_NAV } from "./chatSidebarNav";

const pagesDir = path.resolve(__dirname, "../pages");
const appTsxPath = path.resolve(__dirname, "../App.tsx");
const footerPath = path.resolve(__dirname, "../components/Footer.tsx");
const cmdPalettePath = path.resolve(__dirname, "../components/CommandPalette.tsx");

describe("Dedicated Founder Page Verification", () => {
  it("FounderPage.tsx exists and contains comprehensive production content", () => {
    const filePath = path.join(pagesDir, "FounderPage.tsx");
    expect(fs.existsSync(filePath), "FounderPage.tsx should exist").toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    expect(content.length).toBeGreaterThan(3000);
    expect(content).toContain("SEOHead");
    expect(content).toContain("Navigation");
    expect(content).toContain("Footer");
    expect(content).toContain("FOUNDER_FULL_NAME");
    expect(content).toContain("Zain Ahmed");
    expect(content).toContain("Karachi, Pakistan");
    expect(content).toContain("FOUNDER_STORY_CHAPTERS");
  });

  it("App.tsx registers /founder and alias routes", () => {
    const appSource = fs.readFileSync(appTsxPath, "utf-8");
    expect(appSource).toContain('path="/founder"');
    expect(appSource).toContain('path="/zain-ahmed"');
    expect(appSource).toContain('path="/zain-ahmed-fahad-patel"');
    expect(appSource).toContain("FounderPage");
  });

  it("PAGE_SEO has complete metadata for founder page", () => {
    const seo = (PAGE_SEO as Record<string, any>)["founder"];
    expect(seo, "PAGE_SEO.founder should exist").toBeDefined();
    expect(seo.title).toContain("Zain Ahmed Fahad Patel");
    expect(seo.description).toContain("Zain Ahmed");
    expect(seo.canonical).toBe("https://www.shadowtalk-ai.com/founder");
    expect(seo.keywords?.length).toBeGreaterThan(4);
  });

  it("CHAT_SIDEBAR_NAV links to /founder", () => {
    const founderItem = CHAT_SIDEBAR_NAV.find((item) => item.to === "/founder");
    expect(founderItem, "Sidebar navigation should contain Founder link").toBeDefined();
    expect(founderItem?.label).toBe("Founder Story");
  });

  it("Footer and CommandPalette link to /founder", () => {
    const footerSource = fs.readFileSync(footerPath, "utf-8");
    expect(footerSource).toContain('href: "/founder"');

    const cmdSource = fs.readFileSync(cmdPalettePath, "utf-8");
    expect(cmdSource).toContain('href: "/founder"');
  });

  it("FatimaPage.tsx exists and contains comprehensive production content", () => {
    const filePath = path.join(pagesDir, "FatimaPage.tsx");
    expect(fs.existsSync(filePath), "FatimaPage.tsx should exist").toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    expect(content.length).toBeGreaterThan(3000);
    expect(content).toContain("SEOHead");
    expect(content).toContain("Navigation");
    expect(content).toContain("Footer");
    expect(content).toContain("COFOUNDER_FULL_NAME");
    expect(content).toContain("Fatima");
    expect(content).toContain("Sadaf Tayyaba");
    expect(content).toContain("sadaftayyaba655@gmail.com");
    expect(content).toContain("Karachi, Pakistan");
  });

  it("App.tsx registers /fatima and alias routes", () => {
    const appSource = fs.readFileSync(appTsxPath, "utf-8");
    expect(appSource).toContain('path="/fatima"');
    expect(appSource).toContain('path="/co-founder"');
    expect(appSource).toContain('path="/sadaf-tayyaba"');
    expect(appSource).toContain("FatimaPage");
  });

  it("PAGE_SEO has complete metadata for fatima co-founder page", () => {
    const seo = (PAGE_SEO as Record<string, any>)["fatima"];
    expect(seo, "PAGE_SEO.fatima should exist").toBeDefined();
    expect(seo.title).toContain("Fatima");
    expect(seo.description).toContain("Co-Founder");
    expect(seo.canonical).toBe("https://www.shadowtalk-ai.com/fatima");
    expect(seo.keywords?.length).toBeGreaterThan(4);
  });

  it("Footer and CommandPalette link to /fatima", () => {
    const footerSource = fs.readFileSync(footerPath, "utf-8");
    expect(footerSource).toContain('href: "/fatima"');

    const cmdSource = fs.readFileSync(cmdPalettePath, "utf-8");
    expect(cmdSource).toContain('href: "/fatima"');
  });
});
