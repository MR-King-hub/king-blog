/** 常见中文词组 → 英文 slug 片段（按长度降序匹配） */
const PHRASES: Array<[string, string]> = [
  ["技术栈概览", "tech-stack-overview"],
  ["技术栈", "tech-stack"],
  ["概览", "overview"],
  ["实践", "practice"],
  ["指南", "guide"],
  ["入门", "getting-started"],
  ["解析", "analysis"],
  ["总结", "summary"],
  ["思考", "thoughts"],
  ["探索", "exploration"],
  ["开发", "development"],
  ["前端", "frontend"],
  ["后端", "backend"],
  ["全栈", "fullstack"],
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length > 0 && slug.length <= 80;
}

/** 规范化用户手动传入的 slug */
export function normalizeSlug(input: string): string {
  return (
    input
      .normalize("NFKC")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 80) || "post"
  );
}

/** 从标题生成 ASCII kebab-case slug（不含随机后缀） */
export function slugifyTitle(title: string): string {
  let text = title.normalize("NFKC").trim().toLowerCase();

  for (const [cn, en] of PHRASES) {
    text = text.split(cn).join(` ${en} `);
  }

  return (
    text
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 80) || "post"
  );
}
