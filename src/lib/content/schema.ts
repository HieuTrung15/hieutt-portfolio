// Single source of truth for content shape. Used by the site (build time), the Content Studio and tests.
// `.meta()` keys (title, description, widget, ref, nullLabel) are read by the Studio form generator.
//
// Translatable text is stored as { "en": "...", "vi": "..." } (at least one language required; a missing
// language falls back to the other). Translatable lists are { "en": [...], "vi": [...] }.
// Language-neutral values (names, technologies, ids, dates) stay plain strings.
import { z } from "zod";

import { DEFAULT_LOCALE, LOCALES, type Locale } from "../i18n.ts";
import { SKILL_ICONS } from "../skill-icons.ts";

export { DEFAULT_LOCALE, LOCALES, type Locale };

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Chỉ dùng chữ thường a-z, số và dấu gạch ngang (vd: eup-group)");
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Định dạng YYYY-MM (vd: 2021-01)");
const required = (title: string, description?: string) =>
  z.string().trim().min(1, "Không được để trống").meta({ title, description });
const optionalText = (title: string, description?: string) => z.string().optional().meta({ title, description });
const stringList = (title: string, description?: string) =>
  z.array(z.string().trim().min(1)).default([]).meta({ title, description });
const refList = (ref: string, title: string, description?: string) =>
  z.array(slug).default([]).meta({ title, description, ref });
// Paths inside /public only; blocks "..", URLs and query strings.
const publicPathString = z
  .string()
  .regex(/^(\/(?!.*\.\.)[A-Za-z0-9._\-/]+)?$/, "Đường dẫn trong thư mục public, bắt đầu bằng / (vd: /uploads/avatar.jpg)");
const publicPath = (title: string, widget: "image" | "pdf", description?: string) =>
  publicPathString.optional().meta({ title, description, widget });

/** Translatable text: { en, vi }, at least one filled in. */
const localized = (title: string, description?: string, multiline = false) =>
  z
    .object({ en: z.string().trim().optional(), vi: z.string().trim().optional() })
    .refine((v) => !!(v.en || v.vi), "Cần nội dung cho ít nhất một ngôn ngữ (en hoặc vi)")
    .meta({ title, description, widget: multiline ? "localized-textarea" : "localized" });
/** Translatable list: one array per language. */
const localizedList = (title: string, description?: string) =>
  z
    .object({ en: z.array(z.string().trim().min(1)).default([]), vi: z.array(z.string().trim().min(1)).default([]) })
    .default({ en: [], vi: [] })
    .meta({ title, description, widget: "localized-list" });

export const SECTION_IDS = ["home", "highlights", "work", "expertise", "experience", "about", "education", "contact"] as const;

export const SiteSchema = z.object({
  title: localized("Tiêu đề website (SEO)"),
  description: localized("Mô tả SEO", undefined, true),
  logoText: required("Logo text", "Hiển thị ở góc sidebar, vd: TH."),
  url: z
    .string()
    .regex(/^(https:\/\/[^\s/]+)?$/, "Domain dạng https://example.com, không có dấu / ở cuối")
    .optional()
    .meta({ title: "Domain production", description: "Để trống nếu chưa có. Dùng cho canonical, hreflang, sitemap, Open Graph." }),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu hex 6 ký tự, vd: #2563EB")
    .default("#2563EB")
    .meta({ title: "Màu nhấn (accent)", widget: "color" }),
  cvPath: publicPath("File CV (PDF)", "pdf", "Để trống để ẩn nút Tải CV. File phải nằm trong public/ và có đuôi .pdf"),
  pageLabels: z
    .object({
      home: localized("Nhãn trang Home"),
      about: localized("Nhãn trang About"),
      projects: localized("Nhãn trang Projects"),
      resume: localized("Nhãn trang Resume"),
    })
    .meta({ title: "Nhãn menu (navbar)" }),
  sections: z
    .array(
      z.object({
        id: z.enum(SECTION_IDS).meta({ title: "Section" }),
        label: localized("Nhãn ngắn", "Dùng trong Command Palette."),
        title: localized("Tiêu đề section", "Bọc một từ trong *dấu sao* để tô màu nhấn, vd: Professional *Skillset*").optional(),
        description: localized("Mô tả section", undefined, true).optional(),
        visible: z.boolean().default(true).meta({ title: "Hiển thị" }),
      }),
    )
    .meta({
      title: "Các section",
      description: "Trang chủ: home, about, highlights, contact · Trang About: expertise, experience, education · Trang Projects: work. Thứ tự trong danh sách là thứ tự hiển thị trong từng trang.",
    }),
  projectCategories: z
    .array(z.object({ id: slug.meta({ title: "ID" }), label: localized("Tên hiển thị") }))
    .meta({ title: "Danh mục dự án (bộ lọc)", description: "Chỉ danh mục có dự án mới hiện trên website." }),
});

export const ProfileSchema = z.object({
  name: required("Họ tên"),
  title: required("Chức danh"),
  tagline: required("Tagline"),
  eyebrow: required("Vai trò (hiệu ứng gõ chữ ở Hero)", "Các vai trò cách nhau bằng dấu ·"),
  greeting: localized("Lời chào Hero", "vd: Hi There!"),
  statement: localized("Thông điệp chính", undefined, true),
  intro: localized("Giới thiệu ngắn (Hero)", "Cách đoạn bằng một dòng trống.", true),
  location: localized("Địa điểm"),
  email: z.email("Email không hợp lệ").meta({ title: "Email công khai" }),
  avatar: publicPath("Ảnh đại diện", "image", "Để trống để hiển thị chữ viết tắt."),
  careerStart: yearMonth.meta({ title: "Bắt đầu sự nghiệp", description: "Dùng để tự tính số năm kinh nghiệm.", widget: "month" }),
  coreStack: stringList("Công nghệ chính (Hero)"),
  about: z
    .object({
      heading: localized("Tiêu đề"),
      statement: localized("Câu dẫn"),
      body: localized("Giới thiệu đầy đủ", "Cách đoạn bằng một dòng trống.", true),
    })
    .meta({ title: "About Me" }),
  interests: localizedList("Sở thích"),
  contact: z
    .object({
      heading: localized("Tiêu đề"),
      description: localized("Mô tả", undefined, true),
    })
    .meta({ title: "Contact" }),
});

export const HighlightsSchema = z
  .array(
    z.object({
      value: required("Giá trị", "Hỗ trợ {years} (số năm từ ngày bắt đầu sự nghiệp) và {companies} (số công ty)."),
      label: localized("Nhãn").optional(),
      description: localized("Mô tả", undefined, true),
    }),
  )
  .meta({ title: "Professional Highlights" });

export const ExperienceSchema = z
  .array(
    z.object({
      id: slug.meta({ title: "ID" }),
      company: localized("Công ty"),
      shortName: optionalText("Tên ngắn", "vd: Vinatex"),
      position: required("Chức danh"),
      start: yearMonth.meta({ title: "Bắt đầu", widget: "month" }),
      end: yearMonth.nullable().meta({ title: "Kết thúc", widget: "month", nullLabel: "Hiện tại (Present)" }),
      summary: localized("Tóm tắt", undefined, true).optional(),
      responsibilities: localizedList("Công việc", "Mỗi dòng một mục."),
      technologies: stringList("Công nghệ"),
      projects: refList("projects", "Dự án liên quan"),
    }),
  )
  .meta({ title: "Kinh nghiệm", description: "Thứ tự trong danh sách là thứ tự hiển thị (mới nhất trước)." });

export const SkillsSchema = z.object({
  groups: z
    .array(
      z.object({
        id: slug.meta({ title: "ID" }),
        title: localized("Tên nhóm"),
        description: localized("Mô tả").optional(),
      }),
    )
    .meta({ title: "Nhóm kỹ năng" }),
  skills: z
    .array(
      z.object({
        id: slug.meta({ title: "ID" }),
        name: required("Tên kỹ năng"),
        group: slug.meta({ title: "Nhóm", ref: "skillGroups" }),
        icon: z
          .enum(SKILL_ICONS)
          .optional()
          .meta({ title: "Icon", description: "Logo thương hiệu (python, mysql…) hoặc biểu tượng chung. Để trống: dùng icon của nhóm." }),
        visible: z.boolean().default(true).meta({ title: "Hiển thị" }),
      }),
    )
    .meta({ title: "Kỹ năng", description: "Liên kết kỹ năng với dự án được khai báo trong từng dự án (skillIds)." }),
});

export const EducationSchema = z
  .array(
    z.object({
      school: localized("Trường"),
      major: localized("Chuyên ngành"),
      start: yearMonth.meta({ title: "Bắt đầu", widget: "month" }),
      end: yearMonth.nullable().meta({ title: "Kết thúc", widget: "month", nullLabel: "Đang học" }),
    }),
  )
  .meta({ title: "Học vấn" });

export const SocialLinksSchema = z
  .array(
    z.object({
      icon: z.enum(["github", "linkedin", "facebook", "website", "other"]).meta({ title: "Loại" }),
      label: required("Nhãn"),
      url: z
        .string()
        .regex(/^(https:\/\/\S+)?$/, "URL phải bắt đầu bằng https://")
        .default("")
        .meta({ title: "URL", description: "Để trống để ẩn liên kết này." }),
    }),
  )
  .meta({ title: "Social links" });

export const RESPONSIBILITY_TYPES = ["development", "team", "management", "operations"] as const;
export const DIAGRAM_ICONS = [
  "circle", "users", "file-text", "dashboard", "plug", "smartphone", "cart", "factory", "clipboard",
  "warehouse", "truck", "chart", "shield", "handshake", "calculator", "store", "server", "database", "workflow", "settings",
] as const;

export const DiagramSchema = z
  .object({
    kind: z
      .enum(["conceptual", "documented"])
      .default("conceptual")
      .meta({ title: "Loại sơ đồ", description: "conceptual = minh họa theo phạm vi dự án; documented = kiến trúc thực tế đã xác thực." }),
    title: localized("Tiêu đề sơ đồ").optional(),
    nodes: z
      .array(
        z.object({
          id: slug.meta({ title: "ID" }),
          label: required("Nhãn"),
          description: localized("Mô tả", undefined, true).optional(),
          icon: z.enum(DIAGRAM_ICONS).default("circle").meta({ title: "Icon" }),
          x: z.number().min(0).max(100).meta({ title: "Vị trí X (0–100)" }),
          y: z.number().min(0).max(100).meta({ title: "Vị trí Y (0–100)" }),
          technologies: stringList("Công nghệ liên quan"),
          responsibilities: localizedList("Chức năng phụ trách"),
        }),
      )
      .min(1)
      .meta({ title: "Nodes" }),
    edges: z
      .array(
        z.object({
          from: slug.meta({ title: "Từ node", ref: "diagramNodes" }),
          to: slug.meta({ title: "Đến node", ref: "diagramNodes" }),
          label: localized("Nhãn").optional(),
        }),
      )
      .default([])
      .meta({ title: "Kết nối (edges)" }),
  })
  .meta({ title: "Sơ đồ hệ thống (Interactive System Explorer)" });

export const ProjectSchema = z
  .object({
    slug: slug.meta({ title: "Slug (URL)", description: "Không đổi được sau khi tạo." }),
    title: required("Tên dự án"),
    shortTitle: optionalText("Tên ngắn", "Dùng trên card và menu, vd: VHRM"),
    status: z.enum(["draft", "published"]).default("draft").meta({ title: "Trạng thái", description: "Chỉ published mới xuất hiện trên website production." }),
    featured: z.boolean().default(false).meta({ title: "Dự án nổi bật" }),
    order: z.number().int().default(100).meta({ title: "Thứ tự", description: "Số nhỏ hiển thị trước." }),
    organization: localized("Tổ chức").optional(),
    industry: localized("Lĩnh vực").optional(),
    role: optionalText("Vị trí"),
    start: yearMonth.optional().meta({ title: "Bắt đầu", widget: "month", description: "Để trống nếu chưa xác nhận — website sẽ hiển thị giai đoạn công tác liên quan." }),
    end: yearMonth.nullable().optional().meta({ title: "Kết thúc", widget: "month", nullLabel: "Hiện tại (Present)" }),
    category: optionalText("Nhãn phân loại", "vd: Enterprise HRM"),
    categories: refList("categories", "Danh mục lọc"),
    summary: localized("Tóm tắt (card)", "Bắt buộc khi published. 1–2 câu.", true).optional(),
    overview: localized("Tổng quan (case study)", undefined, true).optional(),
    technologies: stringList("Công nghệ"),
    skillIds: refList("skills", "Kỹ năng liên quan", "Dùng cho bộ lọc Skill → Project."),
    responsibilities: z
      .array(
        z.object({
          text: localized("Nội dung"),
          type: z.enum(RESPONSIBILITY_TYPES).default("development").meta({
            title: "Loại",
            description: "development = trực tiếp phát triển; team = tham gia cùng nhóm; management = quản lý triển khai; operations = hỗ trợ vận hành",
          }),
        }),
      )
      .default([])
      .meta({ title: "Trách nhiệm" }),
    modules: z
      .array(
        z.object({
          name: required("Tên phân hệ"),
          description: localized("Mô tả").optional(),
          items: localizedList("Chức năng"),
        }),
      )
      .default([])
      .meta({ title: "Phân hệ chức năng" }),
    contributions: z
      .array(z.object({ label: localized("Hạng mục"), value: localized("Nội dung", undefined, true) }))
      .default([])
      .meta({ title: "Kết quả & đóng góp", description: "Chỉ ghi thông tin đã xác nhận, không tự tạo số liệu." }),
    coverImage: publicPath("Ảnh minh họa", "image", "Chỉ dùng ảnh được phép công bố."),
    coverAlt: localized("Mô tả ảnh (alt)").optional(),
    gallery: z
      .array(
        z.object({
          src: publicPathString.min(1, "Chọn ảnh").meta({ title: "Ảnh", widget: "image" }),
          alt: localized("Mô tả ảnh (alt)"),
          caption: localized("Chú thích").optional(),
        }),
      )
      .default([])
      .meta({ title: "Thư viện ảnh" }),
    diagram: DiagramSchema.optional(),
  })
  .superRefine((p, ctx) => {
    if (p.status === "published" && !(p.summary?.en || p.summary?.vi))
      ctx.addIssue({ code: "custom", path: ["summary"], message: "Dự án published cần có tóm tắt" });
    if (p.start && p.end && p.end < p.start)
      ctx.addIssue({ code: "custom", path: ["end"], message: "Ngày kết thúc trước ngày bắt đầu" });
  });

export const SINGLETONS = {
  site: { file: "site.json", schema: SiteSchema },
  profile: { file: "profile.json", schema: ProfileSchema },
  highlights: { file: "highlights.json", schema: HighlightsSchema },
  experience: { file: "experience.json", schema: ExperienceSchema },
  skills: { file: "skills.json", schema: SkillsSchema },
  education: { file: "education.json", schema: EducationSchema },
  socialLinks: { file: "social-links.json", schema: SocialLinksSchema },
} as const;

// ---- Types ----
// `*Source` = what is stored in files (with { en, vi } objects).
// Plain names = the same data resolved to one language, which is what components receive.
export type LocalizedText = { en?: string; vi?: string };
export type LocalizedList = { en: string[]; vi: string[] };

/** Turns every { en, vi } into string and every { en: [], vi: [] } into string[]. */
export type Resolved<T> = T extends (infer U)[]
  ? Resolved<U>[]
  : T extends object
    ? string extends keyof T // Record<string, …> (e.g. case studies by slug) is a map, not a translation
      ? { [K in keyof T]: Resolved<T[K]> }
      : T extends LocalizedText
        ? string
        : T extends LocalizedList
          ? string[]
          : { [K in keyof T]: Resolved<T[K]> }
    : T;

export type ContentSource = {
  site: z.infer<typeof SiteSchema>;
  profile: z.infer<typeof ProfileSchema>;
  highlights: z.infer<typeof HighlightsSchema>;
  experience: z.infer<typeof ExperienceSchema>;
  skills: z.infer<typeof SkillsSchema>;
  education: z.infer<typeof EducationSchema>;
  socialLinks: z.infer<typeof SocialLinksSchema>;
  projects: z.infer<typeof ProjectSchema>[];
  /** Markdown per project slug and language. */
  caseStudies: Record<string, LocalizedText>;
};

export type Content = Resolved<ContentSource> & { locale: Locale };
export type SiteSettings = Content["site"];
export type Profile = Content["profile"];
export type Highlight = Content["highlights"][number];
export type Experience = Content["experience"][number];
export type Skills = Content["skills"];
export type Skill = Skills["skills"][number];
export type SkillGroup = Skills["groups"][number];
export type Education = Content["education"][number];
export type SocialLink = Content["socialLinks"][number];
export type Project = Content["projects"][number];
export type ProjectDiagram = NonNullable<Project["diagram"]>;
export type ResponsibilityType = (typeof RESPONSIBILITY_TYPES)[number];
export type DiagramIcon = (typeof DIAGRAM_ICONS)[number];
export type SectionId = (typeof SECTION_IDS)[number];

/** Raw, unvalidated content as read from disk (or sent by the Studio). */
export type RawContent = {
  [K in keyof typeof SINGLETONS]: unknown;
} & { projects: Record<string, unknown>; caseStudies: Record<string, LocalizedText> };
