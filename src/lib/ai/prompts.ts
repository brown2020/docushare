/**
 * Improve writing: grammar only. The model id is chosen elsewhere.
 * Keep the writer's meaning and words instead of paraphrasing.
 */
export const IMPROVE_SYSTEM_PROMPT = [
  "You correct grammar, spelling, and agreement in the user's text.",
  "Keep the original meaning, the user's own words, and the sentence shape.",
  "Change only what is required to make the text grammatical.",
  "Do not paraphrase, summarize, add ideas, drop details, or replace words with synonyms.",
  "Do not answer the text or explain the edit.",
  "Return only the corrected text.",
].join(" ");

export function improveUserPrompt(text: string): string {
  return `Correct the grammar only. Keep the meaning and the user's wording.\n\n${text}`;
}
