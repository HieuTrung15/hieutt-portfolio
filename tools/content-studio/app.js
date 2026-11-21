// HieuTT Content Studio — browser UI. Forms are generated from the Zod schemas (as JSON Schema) served
// by server.ts, so a new field in src/lib/content/schema.ts shows up here without UI code changes.
const token = document.querySelector('meta[name="studio-token"]').content;
const SITE = "http://127.0.0.1:3000";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TABS = [
  { id: "profile", label: "Hồ sơ cá nhân", path: "/", lead: "Thông tin hiển thị ở Hero, Introduce, trang About, Resume và Find Me On." },
  { id: "site", label: "Cài đặt website", path: "/", lead: "SEO, logo, màu nhấn, nhãn menu, tiêu đề/thứ tự/ẩn hiện section (bọc *từ* để tô màu nhấn), file CV và danh mục dự án." },
  { id: "highlights", label: "Highlights", path: "/#highlights", lead: "Các chỉ số dưới Hero. Chỉ dùng số liệu có cơ sở." },
  { id: "projects", label: "Dự án", path: "/projects" },
  { id: "experience", label: "Kinh nghiệm", path: "/about#experience", lead: "Mỗi mục là một công ty. Thứ tự trong danh sách là thứ tự hiển thị." },
  { id: "skills", label: "Kỹ năng", path: "/about#expertise", lead: "Liên kết kỹ năng ↔ dự án được chọn trong từng dự án (trường “Kỹ năng liên quan”)." },
  { id: "education", label: "Học vấn", path: "/about#education" },
  { id: "socialLinks", label: "Social links", path: "/#contact", lead: "Liên kết có URL trống sẽ tự ẩn trên website." },
];

let schemas;
let content;
let version;
let saved;
let tab = "profile";
let project = null;
let previewLocale = "en";
let uid = 0;
const LOCALES = ["en", "vi"];
const LOCALE_LABEL = { en: "EN", vi: "VI" };
/** Display string for a value that may be { en, vi }. */
const str = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v.en || v.vi || "" : v);
const openItems = new WeakSet();

// ---------- helpers ----------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (["value", "checked", "disabled", "hidden", "open", "htmlFor", "type", "id", "title", "placeholder", "accept"].includes(k)) el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

async function api(method, url, body, raw = false) {
  const res = await fetch(url, {
    method,
    headers: { "x-studio-token": token, ...(body && !raw ? { "Content-Type": "application/json" } : {}) },
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { data, status: res.status });
  return data;
}

function status(kind, message, errors = [], warnings = []) {
  const box = document.getElementById("status");
  box.className = `status ${kind}`;
  box.replaceChildren(
    h("div", {}, message),
    ...(errors.length ? [h("ul", {}, errors.map((e) => h("li", {}, e)))] : []),
    ...(warnings.length
      ? [h("details", { class: "warnings" }, h("summary", {}, `⚠ ${warnings.length} mục chưa dịch đủ (website sẽ hiển thị ngôn ngữ còn lại)`), h("ul", {}, warnings.map((w) => h("li", {}, w))))]
      : []),
  );
}
const clearStatus = () => document.getElementById("status").replaceChildren();
const isDirty = () => JSON.stringify(content) !== saved;
function changed() {
  document.getElementById("dirty").hidden = !isDirty();
}

const unwrap = (s) => {
  if (!s.anyOf) return s;
  const { anyOf, ...meta } = s;
  return { ...anyOf.find((x) => x.type !== "null"), ...meta, nullable: true };
};

function defaultFor(raw) {
  const s = unwrap(raw);
  if (s.default !== undefined) return structuredClone(s.default);
  if (s.nullable) return null;
  if (s.enum) return s.enum[0];
  switch (s.type) {
    case "object":
      return Object.fromEntries((s.required ?? []).map((k) => [k, defaultFor(s.properties[k])]));
    case "array":
      return s.minItems ? [defaultFor(s.items)] : [];
    case "boolean":
      return false;
    case "number":
    case "integer":
      return s.minimum != null && s.maximum != null ? (s.minimum + s.maximum) / 2 : (s.minimum ?? 0);
    default:
      return "";
  }
}

const itemLabel = (item, i) => {
  if (item && typeof item === "object") {
    const main = str(item.label ?? item.name ?? item.title ?? item.company ?? item.school ?? item.text ?? item.value ?? item.id ?? item.from);
    const extra = item.position ?? str(item.major) ?? (item.to ? `→ ${item.to}` : undefined);
    if (main) return extra ? `${main} · ${extra}` : String(main);
  }
  return `#${i + 1}`;
};

function refOptions(ref, ctx) {
  switch (ref) {
    case "skills":
      return content.skills.skills.map((s) => ({ value: s.id, label: s.name }));
    case "projects":
      return Object.values(content.projects).map((p) => ({ value: p.slug, label: p.shortTitle || p.title || p.slug }));
    case "categories":
      return content.site.projectCategories.map((c) => ({ value: c.id, label: str(c.label) }));
    case "skillGroups":
      return content.skills.groups.map((g) => ({ value: g.id, label: str(g.title) }));
    case "diagramNodes":
      return (ctx.project?.diagram?.nodes ?? []).map((n) => ({ value: n.id, label: n.label || n.id }));
    default:
      return [];
  }
}

// ---------- generic form ----------
function renderObject(schema, obj, ctx = {}) {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties).map(([key, prop]) => renderProp(key, prop, obj, required.has(key), ctx));
}

function field(label, s, control, id) {
  return h(
    "div",
    { class: "field" },
    h(id ? "label" : "span", { class: "label", htmlFor: id }, label, s.description ? h("span", { class: "desc" }, s.description) : null),
    control,
  );
}

function renderProp(key, raw, obj, required, ctx) {
  const s = unwrap(raw);
  const label = s.title ?? key;
  const id = `f${++uid}`;
  const set = (v) => {
    if (v === undefined) delete obj[key];
    else obj[key] = v;
    changed();
  };
  const value = obj[key];

  if (ctx.readonly?.includes(key)) return field(label, s, h("input", { type: "text", id, value: value ?? "", disabled: true }), id);

  if (s.widget?.startsWith("localized")) return localizedField(label, s, value, set, required, id);

  if (s.enum || (s.type === "string" && (s.ref === "skillGroups" || s.ref === "diagramNodes"))) {
    const select = h("select", { id });
    const fill = () => {
      const opts = s.enum ? s.enum.map((v) => ({ value: v, label: v })) : refOptions(s.ref, ctx);
      const current = obj[key] ?? "";
      if (current && !opts.some((o) => o.value === current)) opts.push({ value: current, label: `⚠ ${current} (không tồn tại)` });
      select.replaceChildren(!required || !current ? h("option", { value: "" }, "—") : null, opts.map((o) => h("option", { value: o.value }, o.label)));
      select.value = current;
    };
    fill();
    select.addEventListener("focus", fill);
    select.addEventListener("change", () => set(select.value || (required ? "" : undefined)));
    return field(label, s, select, id);
  }

  if (s.type === "boolean")
    return h("div", { class: "field" }, h("label", { class: "check" }, h("input", { type: "checkbox", checked: value ?? s.default ?? false, onchange: (e) => set(e.target.checked) }), label));

  if (s.type === "number" || s.type === "integer")
    return field(
      label,
      s,
      h("input", {
        type: "number",
        id,
        value: value ?? "",
        min: s.minimum,
        max: s.maximum,
        step: s.type === "integer" ? 1 : "any",
        oninput: (e) => set(e.target.value === "" ? (required ? 0 : undefined) : Number(e.target.value)),
      }),
      id,
    );

  if (s.type === "string") {
    const toValue = (v) => (v === "" && !required ? undefined : v);
    let input;
    if (s.widget === "textarea") input = h("textarea", { id, value: value ?? "", oninput: (e) => set(toValue(e.target.value)) });
    else if (s.widget === "color")
      input = h(
        "div",
        { class: "row" },
        h("input", { type: "color", value: value ?? "#2563eb", oninput: (e) => ((input.querySelector("input[type=text]").value = e.target.value), set(e.target.value)) }),
        h("input", { type: "text", id, value: value ?? "", oninput: (e) => set(toValue(e.target.value)) }),
      );
    else if (s.widget === "image" || s.widget === "pdf") input = assetInput(s.widget, id, value, (v) => set(toValue(v)));
    else input = h("input", { type: s.widget === "month" ? "month" : "text", id, value: value ?? "", oninput: (e) => set(toValue(e.target.value)) });

    if (!s.nullable) return field(label, s, input, id);
    const text = input.matches?.("input,textarea") ? input : input.querySelector("input[type=text]");
    text.disabled = value === null;
    return field(
      label,
      s,
      h(
        "div",
        { class: "row" },
        input,
        h(
          "label",
          { class: "check" },
          h("input", {
            type: "checkbox",
            checked: value === null,
            onchange: (e) => {
              text.disabled = e.target.checked;
              set(e.target.checked ? null : toValue(text.value));
            },
          }),
          s.nullLabel ?? "Không có",
        ),
      ),
      id,
    );
  }

  if (s.type === "array") {
    const arr = Array.isArray(value) ? value : [];
    const commit = () => {
      obj[key] = arr;
      changed();
    };
    if (s.items.type === "string" && s.ref) {
      const opts = refOptions(s.ref, ctx);
      for (const v of arr) if (!opts.some((o) => o.value === v)) opts.push({ value: v, label: `⚠ ${v} (không tồn tại)` });
      const chosen = new Set(arr);
      return field(
        label,
        s,
        h(
          "div",
          { class: "checks" },
          opts.length
            ? opts.map((o) =>
                h(
                  "label",
                  { class: "check" },
                  h("input", {
                    type: "checkbox",
                    checked: chosen.has(o.value),
                    onchange: (e) => {
                      if (e.target.checked) chosen.add(o.value);
                      else chosen.delete(o.value);
                      arr.splice(0, arr.length, ...opts.map((x) => x.value).filter((v) => chosen.has(v)));
                      commit();
                    },
                  }),
                  o.label,
                ),
              )
            : h("span", { class: "muted" }, "Chưa có lựa chọn nào."),
        ),
      );
    }
    if (s.items.type === "string")
      return field(
        label,
        { ...s, description: [s.description, "Mỗi dòng một mục."].filter(Boolean).join(" ") },
        h("textarea", {
          id,
          value: arr.join("\n"),
          oninput: (e) => {
            arr.splice(0, arr.length, ...e.target.value.split("\n").map((x) => x.trim()).filter(Boolean));
            commit();
          },
        }),
        id,
      );
    return h("fieldset", {}, h("legend", {}, label), s.description ? h("p", { class: "desc muted" }, s.description) : null, objectList(s.items, arr, ctx, commit));
  }

  if (s.type === "object") {
    if (value === undefined && !required)
      return h("div", { class: "field" }, h("button", { type: "button", onclick: () => (set(defaultFor(s)), render()) }, `+ Thêm ${label}`));
    return h(
      "fieldset",
      {},
      h("legend", {}, label),
      s.description ? h("p", { class: "desc muted" }, s.description) : null,
      renderObject(s, value, ctx),
      !required
        ? h("button", { type: "button", class: "danger", onclick: () => confirm(`Xóa “${label}”?`) && (set(undefined), render()) }, `Xóa ${label}`)
        : null,
    );
  }

  return field(label, s, h("code", {}, JSON.stringify(value)));
}

/** EN / VI inputs side by side for { en, vi } text or { en: [], vi: [] } lists. */
function localizedField(label, s, value, set, required, id) {
  const list = s.widget === "localized-list";
  const multiline = list || s.widget === "localized-textarea";
  const current = value ?? (list ? { en: [], vi: [] } : {});
  const inputs = {};
  const update = () => {
    if (list) return set(Object.fromEntries(LOCALES.map((l) => [l, inputs[l].value.split("\n").map((x) => x.trim()).filter(Boolean)])));
    const next = Object.fromEntries(LOCALES.map((l) => [l, inputs[l].value]).filter(([, v]) => v.trim() !== ""));
    set(Object.keys(next).length || required ? next : undefined);
  };
  const cols = LOCALES.map((l) => {
    const v = list ? (current[l] ?? []).join("\n") : (current[l] ?? "");
    inputs[l] = h(multiline ? "textarea" : "input", { type: multiline ? undefined : "text", id: l === "en" ? id : undefined, value: v, lang: l, oninput: update });
    return h("div", { class: "lang-col" }, h("span", { class: "lang-tag" }, LOCALE_LABEL[l]), inputs[l]);
  });
  const desc = [s.description, list ? "Mỗi dòng một mục." : null].filter(Boolean).join(" ");
  return field(label, { ...s, description: desc || undefined }, h("div", { class: "lang-grid" }, cols), id);
}

function objectList(itemSchema, arr, ctx, commit) {
  const box = h("div");
  const move = (i, d) => {
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    commit();
    draw();
  };
  const draw = () =>
    box.replaceChildren(
      ...arr.map((item, i) => {
        const name = h("span", { class: "name" }, itemLabel(item, i));
        const details = h("details", { class: "item", open: openItems.has(item) });
        details.addEventListener("toggle", () => (details.open ? openItems.add(item) : openItems.delete(item)));
        const stop = (fn) => (e) => (e.preventDefault(), fn());
        const body = h("div", { class: "body" }, renderObject(itemSchema, item, ctx));
        body.addEventListener("input", () => (name.textContent = itemLabel(item, i)));
        body.addEventListener("change", () => (name.textContent = itemLabel(item, i)));
        details.append(
          h(
            "summary",
            {},
            name,
            h("button", { type: "button", class: "icon", title: "Di chuyển lên", "aria-label": "Di chuyển lên", disabled: i === 0, onclick: stop(() => move(i, -1)) }, "↑"),
            h("button", { type: "button", class: "icon", title: "Di chuyển xuống", "aria-label": "Di chuyển xuống", disabled: i === arr.length - 1, onclick: stop(() => move(i, 1)) }, "↓"),
            h(
              "button",
              {
                type: "button",
                class: "icon danger",
                title: "Xóa",
                "aria-label": "Xóa",
                onclick: stop(() => {
                  if (!confirm(`Xóa “${itemLabel(item, i)}”?`)) return;
                  arr.splice(i, 1);
                  commit();
                  draw();
                }),
              },
              "✕",
            ),
          ),
          body,
        );
        return details;
      }),
      h(
        "button",
        {
          type: "button",
          onclick: () => {
            const item = defaultFor(itemSchema);
            arr.push(item);
            openItems.add(item);
            commit();
            draw();
          },
        },
        "+ Thêm mục",
      ),
    );
  draw();
  return box;
}

function assetInput(kind, id, value, onChange) {
  const text = h("input", { type: "text", id, value: value ?? "", placeholder: kind === "pdf" ? "/cv/ten-file.pdf" : "/uploads/ten-anh.jpg" });
  const thumb = kind === "image" ? h("img", { class: "thumb", alt: "", hidden: !value, src: value ? `/media${value}` : "" }) : null;
  text.addEventListener("input", () => onChange(text.value));
  const file = h("input", {
    type: "file",
    accept: kind === "pdf" ? ".pdf" : ".png,.jpg,.jpeg,.webp",
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const { path } = await api("POST", `/api/upload?kind=${kind}&name=${encodeURIComponent(f.name)}`, f, true);
        text.value = path;
        onChange(path);
        if (thumb) Object.assign(thumb, { src: `/media${path}`, hidden: false });
        status("ok", `Đã tải lên ${path}. Nhớ bấm “Lưu vào file” để lưu đường dẫn.`);
      } catch (err) {
        status("error", err.message);
      }
    },
  });
  return h("div", { class: "row" }, thumb, text, file);
}

// ---------- views ----------
function renderTabs() {
  document.getElementById("tabs").replaceChildren(
    ...TABS.map((t) =>
      h("button", { type: "button", "aria-current": String(t.id === tab), onclick: () => ((tab = t.id), render(), setFrame()) }, t.label),
    ),
  );
}

function renderSingleton(t) {
  const schema = schemas[t.id];
  const data = content[t.id];
  return [
    h("h1", {}, t.label),
    h("p", { class: "lead" }, t.lead ?? ""),
    schema.type === "array" ? objectList(schema.items, data, {}, changed) : renderObject(schema, data),
  ];
}

const sortedSlugs = () =>
  Object.keys(content.projects).sort((a, b) => (content.projects[a].order ?? 100) - (content.projects[b].order ?? 100) || a.localeCompare(b));

function renderProjects() {
  const slugs = sortedSlugs();
  if (!project || !content.projects[project]) project = slugs[0] ?? null;
  const reorder = (i, d) => {
    [slugs[i], slugs[i + d]] = [slugs[i + d], slugs[i]];
    slugs.forEach((s, idx) => (content.projects[s].order = idx + 1));
    changed();
    render();
  };
  const create = () => {
    const slug = prompt("Slug cho dự án mới (chữ thường, số, gạch ngang — vd: erp-moi):")?.trim();
    if (!slug) return;
    if (!SLUG.test(slug)) return status("error", "Slug không hợp lệ. Chỉ dùng a-z, 0-9 và dấu gạch ngang.");
    if (content.projects[slug]) return status("error", `Đã có dự án “${slug}”.`);
    content.projects[slug] = { slug, title: "Dự án mới", status: "draft", featured: false, order: slugs.length + 1 };
    project = slug;
    changed();
    render();
    setFrame();
  };
  const remove = (slug) => {
    if (!confirm(`Xóa dự án “${slug}” và case study của nó? (Bản cũ được sao lưu khi lưu file.)`)) return;
    delete content.projects[slug];
    delete content.caseStudies[slug];
    for (const e of content.experience) e.projects = (e.projects ?? []).filter((s) => s !== slug);
    project = null;
    changed();
    render();
    setFrame(); // the deleted project's page no longer exists
  };

  const list = h(
    "div",
    {},
    h("div", { class: "toolbar" }, h("button", { type: "button", class: "primary", onclick: create }, "+ Dự án mới")),
    h(
      "div",
      { class: "list" },
      slugs.map((slug, i) => {
        const p = content.projects[slug];
        return h(
          "div",
          {
            class: "list-item",
            "aria-current": String(slug === project),
            tabindex: "0",
            onclick: () => ((project = slug), render(), setFrame()),
            onkeydown: (e) => e.key === "Enter" && ((project = slug), render(), setFrame()),
          },
          h("span", { class: "name" }, p.shortTitle || p.title || slug),
          p.status === "draft" ? h("span", { class: "badge draft" }, "draft") : null,
          p.featured ? h("span", { class: "badge" }, "★") : null,
          h("button", { type: "button", class: "icon", "aria-label": "Lên", disabled: i === 0, onclick: (e) => (e.stopPropagation(), reorder(i, -1)) }, "↑"),
          h("button", { type: "button", class: "icon", "aria-label": "Xuống", disabled: i === slugs.length - 1, onclick: (e) => (e.stopPropagation(), reorder(i, 1)) }, "↓"),
        );
      }),
    ),
  );

  let form = h("p", { class: "muted" }, "Chưa có dự án nào.");
  if (project) {
    const p = content.projects[project];
    // One Markdown file per language: content/case-studies/<slug>.<en|vi>.md
    const editors = LOCALES.map((l) =>
      h(
        "div",
        { class: "field" },
        h(
          "label",
          { class: "label", htmlFor: `case-study-${l}` },
          `Case study — Business context (${LOCALE_LABEL[l]}, Markdown)`,
          l === "en" ? h("span", { class: "desc" }, "Hỗ trợ đoạn văn, **đậm**, danh sách, > trích dẫn, ## tiêu đề, bảng. HTML bị bỏ qua.") : null,
        ),
        h("textarea", {
          class: "code",
          id: `case-study-${l}`,
          lang: l,
          value: content.caseStudies[project]?.[l] ?? "",
          oninput: (e) => {
            const md = { ...(content.caseStudies[project] ?? {}) };
            if (e.target.value.trim()) md[l] = e.target.value;
            else delete md[l];
            if (Object.keys(md).length) content.caseStudies[project] = md;
            else delete content.caseStudies[project];
            changed();
            previewMarkdown();
          },
        }),
      ),
    );
    form = h(
      "div",
      {},
      renderObject(schemas.project, p, { readonly: ["slug"], project: p }),
      editors,
      h("div", { class: "toolbar" }, h("button", { type: "button", class: "danger", onclick: () => remove(project) }, "Xóa dự án")),
    );
  }
  return [h("h1", {}, "Dự án"), h("p", { class: "lead" }, "Lưu ở trạng thái draft để xem trước trên bản dev; chỉ published mới vào bản production."), h("div", { class: "split" }, list, form)];
}

function render() {
  renderTabs();
  const t = TABS.find((x) => x.id === tab);
  document.getElementById("editor").replaceChildren(...(tab === "projects" ? renderProjects() : renderSingleton(t)).flat(Infinity));
  document.getElementById("pv-md").disabled = tab !== "projects";
  if (tab === "projects") previewMarkdown();
}

// ---------- preview ----------
function setFrame() {
  const t = TABS.find((x) => x.id === tab);
  const base = tab === "projects" && project ? `/projects/${project}` : t.path;
  // Same rule as the site: English has no prefix, Vietnamese lives under /vi.
  const path = previewLocale === "en" ? base : base === "/" ? "/vi" : `/vi${base.startsWith("/#") ? base.slice(1) : base}`;
  document.getElementById("site-frame").src = SITE + path;
  document.getElementById("pv-open").href = SITE + path;
}

let mdTimer;
function previewMarkdown() {
  clearTimeout(mdTimer);
  mdTimer = setTimeout(async () => {
    const box = document.getElementById("md-preview");
    const p = content.projects[project];
    if (!p) return box.replaceChildren();
    try {
      const { html } = await api("POST", "/api/preview", { markdown: content.caseStudies[project]?.[previewLocale] ?? "" });
      const summary = p.summary?.[previewLocale] ?? "";
      const head = h("div", {}, h("h2", {}, p.title ?? ""), h("p", {}, h("b", {}, summary)));
      const body = h("div");
      body.innerHTML = html; // rendered server-side by react-markdown with raw HTML skipped
      box.replaceChildren(head, body);
    } catch (err) {
      box.textContent = err.message;
    }
  }, 300);
}

function showPreviewTab(which) {
  for (const [btn, panel] of [["pv-site", "pv-site-panel"], ["pv-md", "pv-md-panel"]]) {
    document.getElementById(btn).setAttribute("aria-selected", String(btn === which));
    document.getElementById(panel).hidden = btn !== which;
  }
}

// ---------- actions ----------
async function validate() {
  const { ok, errors, warnings } = await api("POST", "/api/validate", { content });
  if (ok) status("ok", "Nội dung hợp lệ ✓", [], warnings);
  else status("error", `Có ${errors.length} lỗi cần sửa trước khi lưu:`, errors, warnings);
  return ok;
}

async function save() {
  try {
    const res = await api("PUT", "/api/content", { content, version });
    version = res.version;
    saved = JSON.stringify(content);
    changed();
    render();
    const files = [...res.written, ...res.removed.map((f) => `${f} (đã xóa)`)];
    status("ok", files.length ? `Đã lưu ${files.length} file: ${files.join(", ")}. Website dev sẽ hiển thị thay đổi.` : "Không có thay đổi để lưu.", [], res.warnings ?? []);
    document.getElementById("site-frame").src = document.getElementById("site-frame").src;
  } catch (err) {
    if (err.status === 422) status("error", "Chưa lưu — nội dung không hợp lệ:", err.data.errors, err.data.warnings ?? []);
    else status("error", err.message);
  }
}

async function load() {
  const data = await api("GET", "/api/content");
  ({ schemas, content, version } = data);
  saved = JSON.stringify(content);
  changed();
  render();
}

async function exportBackup() {
  const res = await fetch("/api/export", { headers: { "x-studio-token": token } });
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "portfolio-content.json";
  const url = URL.createObjectURL(await res.blob());
  h("a", { href: url, download: name }).click();
  URL.revokeObjectURL(url);
  status("ok", `Đã xuất ${name} (nội dung đã lưu trên đĩa).`);
}

document.getElementById("btn-validate").addEventListener("click", () => validate().catch((e) => status("error", e.message)));
document.getElementById("btn-save").addEventListener("click", save);
document.getElementById("btn-export").addEventListener("click", () => exportBackup().catch((e) => status("error", e.message)));
document.getElementById("btn-revert").addEventListener("click", () => {
  if (!isDirty() || !confirm("Bỏ mọi thay đổi chưa lưu?")) return;
  content = JSON.parse(saved);
  changed();
  clearStatus();
  render();
});
document.getElementById("pv-site").addEventListener("click", () => showPreviewTab("pv-site"));
for (const l of LOCALES)
  document.getElementById(`pv-lang-${l}`).addEventListener("click", () => {
    previewLocale = l;
    for (const x of LOCALES) document.getElementById(`pv-lang-${x}`).setAttribute("aria-pressed", String(x === l));
    setFrame();
    if (tab === "projects") previewMarkdown();
  });
document.getElementById("pv-md").addEventListener("click", () => showPreviewTab("pv-md"));
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    save();
  }
});
window.addEventListener("beforeunload", (e) => {
  if (isDirty()) e.preventDefault();
});

load().catch((e) => status("error", `Không tải được nội dung: ${e.message}`));
