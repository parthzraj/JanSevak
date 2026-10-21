/** Same rules as the backend (backend/core_api/app/services/report_quality.py), so people see the problem before submitting. */
export const MIN_TITLE_CHARS = 8;
export const MIN_DESCRIPTION_CHARS = 30;
export const MIN_DESCRIPTION_WORDS = 6;

const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function descriptionProblem(text: string): string | null {
  const t = text.trim();
  const w = words(t);
  const compact = t.replace(/\s/g, '');
  if (t.length < MIN_DESCRIPTION_CHARS || w.length < MIN_DESCRIPTION_WORDS) {
    return `Describe the problem (at least ${MIN_DESCRIPTION_CHARS} characters and ${MIN_DESCRIPTION_WORDS} words): what is wrong, where exactly, and who it affects.`;
  }
  const letters = (compact.match(/[A-Za-z]/g) ?? []).length;
  const counts: Record<string, number> = {};
  for (const c of compact.toLowerCase()) counts[c] = (counts[c] ?? 0) + 1;
  if (new Set(w).size < 4 || letters < 0.6 * compact.length || Math.max(...Object.values(counts)) > 0.4 * compact.length) {
    return 'The description does not look like a real description. Please explain the problem in your own words.';
  }
  return null;
}

export interface ReportChecklist {
  photo: boolean;
  title: boolean;
  description: boolean;
  location: boolean;
  ok: boolean;
}

export function reportChecklist(input: { title: string; description: string; photoCount: number; hasLocation: boolean }): ReportChecklist {
  const photo = input.photoCount > 0;
  const title = input.title.trim().length >= MIN_TITLE_CHARS;
  const description = descriptionProblem(input.description) === null;
  const location = input.hasLocation;
  return { photo, title, description, location, ok: photo && title && description && location };
}
