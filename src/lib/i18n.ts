// UI strings (labels, buttons, hints) and locale routing helpers. Content text lives in content/.
// English is the default and is served without a prefix; Vietnamese lives under /vi.
// No imports on purpose: client components use this file, and it must not pull Zod into the bundle.

export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_INFO: Record<Locale, { label: string; short: string; htmlLang: string; ogLocale: string; hreflang: string }> = {
  en: { label: "English", short: "EN", htmlLang: "en-US", ogLocale: "en_US", hreflang: "en-US" },
  vi: { label: "Tiếng Việt", short: "VI", htmlLang: "vi", ogLocale: "vi_VN", hreflang: "vi-VN" },
};

/** "/projects" → "/vi/projects"; "/#work" → "/vi#work"; unchanged for the default locale. */
export function localePath(locale: Locale, path: string) {
  if (locale === DEFAULT_LOCALE) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path.startsWith("/#") ? path.slice(1) : path}`;
}

/** "/vi/projects" → "/projects", "/vi" → "/". */
export function stripLocale(pathname: string) {
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

/** Same page in another language; internal routes such as /_not-found fall back to the home page. */
export function switchLocalePath(pathname: string, locale: Locale) {
  const base = stripLocale(pathname);
  return localePath(locale, base.startsWith("/_") ? "/" : base);
}

export const localeFromPath = (pathname: string): Locale =>
  LOCALES.find((l) => l !== DEFAULT_LOCALE && (pathname === `/${l}` || pathname.startsWith(`/${l}/`))) ?? DEFAULT_LOCALE;

/** localStorage key holding the language a visitor picked with the EN | VI switch. */
export const LOCALE_STORAGE_KEY = "preferred-locale";

/** Called when the visitor explicitly picks a language (not when they merely open a /vi link). */
export function rememberLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage blocked (private mode, disabled cookies): the site still works, just without memory.
  }
}

/**
 * Inline script for <head>, run on every full page load before first paint:
 *  1. sets <html lang> from the URL (the static HTML always says the default language);
 *  2. if the visitor picked another language earlier and opened a default-language URL, replaces it with the
 *     same page in that language. URLs that already name a language (/vi/…) are never redirected, so shared
 *     links open as sent; crawlers (no storage) and iframes (Studio preview) are left alone.
 */
export function localeBootScript() {
  const prefixed = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
  const htmlLang = Object.fromEntries(LOCALES.map((l) => [l, LOCALE_INFO[l].htmlLang]));
  return `(function(){try{var p=location.pathname,L=${JSON.stringify(prefixed)},H=${JSON.stringify(htmlLang)},c=${JSON.stringify(DEFAULT_LOCALE)};for(var i=0;i<L.length;i++)if(p==="/"+L[i]||p.indexOf("/"+L[i]+"/")===0)c=L[i];document.documentElement.lang=H[c];var w=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});if(c===${JSON.stringify(DEFAULT_LOCALE)}&&w&&L.indexOf(w)>=0&&window.top===window.self)location.replace("/"+w+(p==="/"?"":p)+location.search+location.hash)}catch(e){}})();`;
}

const en = {
  nav: { main: "Main", toggleMenu: "Toggle navigation menu", skip: "Skip to content", home: "Home page" },
  footer: {
    designedBy: (name: string) => `Designed and Developed by ${name}`,
    copyright: (year: number, mark: string) => `Copyright © ${year} ${mark}`,
  },
  search: { button: "Search…", aria: "Search projects, skills and sections", open: "Open command palette" },
  common: {
    copied: "Copied",
    copyFailed: "Couldn't copy",
    copyEmail: "Copy email",
    sendEmail: "Send email",
    downloadCv: "Download CV",
    theme: "Toggle light / dark theme",
    language: "Language",
    projectsCount: (n: number) => `${n} ${n === 1 ? "project" : "projects"}`,
  },
  palette: {
    title: "Command palette",
    description: "Search projects and skills, jump to a section or run a quick action.",
    placeholder: "Search projects, skills, sections…",
    empty: "No matching results.",
    navigation: "Navigation",
    projects: "Projects",
    skills: "Skills",
    actions: "Actions",
    copiedEmail: "Email copied",
    switchLanguage: "Xem bằng Tiếng Việt",
    hints: ["↑↓ navigate", "↵ select", "esc close"],
  },
  hero: { iam: "I'M", illustration: "Illustration: ERP modules connected to a central platform" },
  findMe: { connect: "Feel free to *connect* with me", email: "Email me", copy: "Copy email" },
  work: {
    explorer: "Interactive System *Explorer*",
    chooseSystem: "Choose a system",
    viewCase: (name: string) => `View the ${name} case study`,
  },
  explorer: {
    diagram: "Diagram",
    components: "Components",
    system: "system",
    responsibilities: "Responsibilities",
    technologies: "Related technologies",
    connections: "Connections",
    to: "to",
    from: "from",
    hintPointer: "Hover or select a component to see details.",
    hintTouch: "Select a component to see details.",
  },
  skills: { usedIn: "Used in", reset: "Clear", empty: "No published project is linked to this skill yet." },
  experience: { current: "Current", responsibilities: (n: number) => `Responsibilities (${n})`, projects: "Projects:" },
  about: {
    intro: (name: string, location: string) => `Hi everyone! I'm *${name}* from *${location}*.`,
    current: (position: string, company: string) => `I'm currently working as *${position}* at *${company}*.`,
    outside: "Outside of work, I love:",
    illustration: "Illustration: a developer workspace with code and ERP dashboards",
  },
  projects: {
    intro: "Each project has its own case study: context, responsibilities, functional modules, technologies and an interactive system diagram.",
    metaDescription: (name: string) =>
      `ERP and enterprise software projects by ${name}: ERPNext, Frappe Framework, Odoo, HRM, manufacturing, warehousing and system integration.`,
    filterAria: "Filter by category",
    all: "All",
    searchLabel: "Search projects",
    searchPlaceholder: "Name, organization, technology, domain…",
    count: (shown: number, total: number) => `${shown} / ${total} projects`,
    emptyTitle: "No matching projects",
    emptyText: "Try another keyword or clear the category filter.",
    clear: "Clear filters",
    draft: "Draft (dev only)",
    featured: "Featured",
    caseStudy: "Case Study",
  },
  caseStudy: {
    home: "Home",
    projects: "Projects",
    draft: "Draft — not published",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    organization: "Organization",
    industry: "Industry",
    role: "Role",
    period: "Period",
    contextPeriod: "Employment period",
    pending: "Detailed content for this project is being prepared. This page only shows confirmed information.",
    context: "Business context",
    responsibilities: "My responsibilities",
    modules: "Functional modules",
    stack: "Technology & skills",
    stackShort: "Technology",
    techStack: "Technical stack",
    relatedSkills: "Related skills",
    system: "System diagram",
    results: "Results & contributions",
    gallery: "Gallery",
    onThisPage: "On this page",
    tocAria: "Case study contents",
    related: "Related projects",
    navAria: "Project navigation",
    previous: "Previous project",
    next: "Next project",
    allProjects: "All projects",
    types: { development: "Hands-on development", team: "Team contribution", management: "Implementation & management", operations: "Operations & support" },
  },
  profile: {
    metaDescription: (name: string, title: string) => `Profile and work experience of ${name} — ${title}.`,
  },
  notFound: {
    title: "Page not found",
    text: "The page you're looking for doesn't exist or has been moved. Head back home or browse the projects.",
    home: "Back to home",
    projects: "Browse projects",
  },
  resume: {
    metaDescription: (name: string) => `Résumé of ${name}: work experience, projects, technical skills and education.`,
    download: "Download CV",
    print: "Print / Save as PDF",
    work: "Work Experience",
    projects: "Projects",
    skills: "Technical Skills",
    education: "Education",
  },
  og: { caseStudy: "Case study" },
};

type Dict = typeof en;

const vi: Dict = {
  nav: { main: "Chính", toggleMenu: "Mở / đóng menu điều hướng", skip: "Bỏ qua điều hướng", home: "Trang chủ" },
  footer: {
    designedBy: (name: string) => `Thiết kế và phát triển bởi ${name}`,
    copyright: (year: number, mark: string) => `Copyright © ${year} ${mark}`,
  },
  search: { button: "Tìm kiếm…", aria: "Tìm kiếm dự án, kỹ năng, mục", open: "Mở bảng lệnh tìm kiếm" },
  common: {
    copied: "Đã sao chép",
    copyFailed: "Không thể sao chép",
    copyEmail: "Sao chép email",
    sendEmail: "Gửi email",
    downloadCv: "Tải CV",
    theme: "Chuyển giao diện sáng / tối",
    language: "Ngôn ngữ",
    projectsCount: (n: number) => `${n} dự án`,
  },
  palette: {
    title: "Bảng lệnh",
    description: "Tìm dự án, kỹ năng, mục trên trang hoặc thực hiện thao tác nhanh.",
    placeholder: "Tìm dự án, kỹ năng, mục…",
    empty: "Không tìm thấy kết quả phù hợp.",
    navigation: "Điều hướng",
    projects: "Dự án",
    skills: "Kỹ năng",
    actions: "Thao tác",
    copiedEmail: "Đã sao chép email",
    switchLanguage: "View in English",
    hints: ["↑↓ di chuyển", "↵ chọn", "esc đóng"],
  },
  hero: { iam: "TÔI LÀ", illustration: "Minh họa: các phân hệ ERP kết nối với một nền tảng trung tâm" },
  findMe: { connect: "Đừng ngại *kết nối* với tôi", email: "Gửi email", copy: "Sao chép email" },
  work: {
    explorer: "Interactive System *Explorer*",
    chooseSystem: "Chọn hệ thống",
    viewCase: (name: string) => `Xem case study ${name}`,
  },
  explorer: {
    diagram: "Sơ đồ",
    components: "Các thành phần",
    system: "hệ thống",
    responsibilities: "Chức năng phụ trách",
    technologies: "Công nghệ liên quan",
    connections: "Kết nối",
    to: "đến",
    from: "từ",
    hintPointer: "Di chuột hoặc chọn một thành phần để xem chi tiết.",
    hintTouch: "Chọn một thành phần để xem chi tiết.",
  },
  skills: { usedIn: "Dự án sử dụng", reset: "Bỏ chọn", empty: "Chưa có dự án công khai nào được gắn với kỹ năng này." },
  experience: { current: "Hiện tại", responsibilities: (n: number) => `Trách nhiệm (${n})`, projects: "Dự án:" },
  about: {
    intro: (name: string, location: string) => `Xin chào mọi người! Tôi là *${name}*, đến từ *${location}*.`,
    current: (position: string, company: string) => `Hiện tôi đang làm *${position}* tại *${company}*.`,
    outside: "Ngoài công việc, tôi thích:",
    illustration: "Minh họa: góc làm việc của lập trình viên với mã nguồn và dashboard ERP",
  },
  projects: {
    intro: "Mỗi dự án có trang case study riêng: bối cảnh, trách nhiệm, phân hệ chức năng, công nghệ và sơ đồ hệ thống tương tác.",
    metaDescription: (name: string) =>
      `Các dự án ERP và phần mềm doanh nghiệp ${name} đã tham gia: ERPNext, Frappe Framework, Odoo, HRM, sản xuất, kho vận và tích hợp hệ thống.`,
    filterAria: "Lọc theo danh mục",
    all: "Tất cả",
    searchLabel: "Tìm dự án",
    searchPlaceholder: "Tên, tổ chức, công nghệ, lĩnh vực…",
    count: (shown: number, total: number) => `${shown} / ${total} dự án`,
    emptyTitle: "Không có dự án phù hợp",
    emptyText: "Thử từ khóa khác hoặc bỏ bộ lọc danh mục.",
    clear: "Xóa bộ lọc",
    draft: "Draft (chỉ hiện khi dev)",
    featured: "Nổi bật",
    caseStudy: "Xem chi tiết",
  },
  caseStudy: {
    home: "Trang chủ",
    projects: "Dự án",
    draft: "Draft — không xuất bản",
    copyLink: "Sao chép liên kết",
    linkCopied: "Đã sao chép liên kết",
    organization: "Tổ chức",
    industry: "Lĩnh vực",
    role: "Vị trí",
    period: "Thời gian",
    contextPeriod: "Giai đoạn công tác",
    pending: "Nội dung chi tiết của dự án này đang được bổ sung. Trang hiện chỉ trình bày những thông tin đã được xác nhận.",
    context: "Bối cảnh nghiệp vụ",
    responsibilities: "Trách nhiệm của tôi",
    modules: "Phân hệ chức năng",
    stack: "Công nghệ & kỹ năng",
    stackShort: "Công nghệ",
    techStack: "Technical stack",
    relatedSkills: "Kỹ năng liên quan",
    system: "Sơ đồ hệ thống",
    results: "Kết quả & đóng góp",
    gallery: "Hình ảnh",
    onThisPage: "Trên trang này",
    tocAria: "Mục lục case study",
    related: "Dự án liên quan",
    navAria: "Điều hướng dự án",
    previous: "Dự án trước",
    next: "Dự án tiếp theo",
    allProjects: "Tất cả dự án",
    types: { development: "Phát triển trực tiếp", team: "Tham gia cùng nhóm", management: "Quản lý & triển khai", operations: "Vận hành & hỗ trợ" },
  },
  profile: {
    metaDescription: (name: string, title: string) => `Hồ sơ và kinh nghiệm làm việc của ${name} — ${title}.`,
  },
  notFound: {
    title: "Không tìm thấy trang",
    text: "Trang bạn tìm không tồn tại hoặc đã được di chuyển. Bạn có thể quay về trang chủ hoặc xem danh sách dự án.",
    home: "Về trang chủ",
    projects: "Xem dự án",
  },
  resume: {
    metaDescription: (name: string) => `Hồ sơ CV của ${name}: kinh nghiệm làm việc, dự án, kỹ năng chuyên môn và học vấn.`,
    download: "Tải CV",
    print: "In / Lưu PDF",
    work: "Kinh nghiệm làm việc",
    projects: "Dự án",
    skills: "Kỹ năng chuyên môn",
    education: "Học vấn",
  },
  og: { caseStudy: "Case study" },
};

export const dictionaries: Record<Locale, Dict> = { en, vi };
export const t = (locale: Locale) => dictionaries[locale];
