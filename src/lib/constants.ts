import { AiToneOption, LanguageOption } from "@/components/types";

export const DOCUMENT_COLLECTION = "docs";
export const USER_COLLECTION = "users";

export const MAX_OUTPUT_TOKEN = 100;
export const COST_POINT_PER_TOKEN = 0.1;

export const AI_MODEL_GPT = "gpt-4o";
export const AI_MODEL_GEMINI = "gemini-1.5-pro";
export const AI_MODEL_MISTRAL = "mistral-large";
export const AI_MODEL_CLAUDE = "claude-3-5-sonnet";
export const AI_MODEL_LLAMA = "llama-v3p1-405b";

export const AI_MODELS_LIST = [
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_MISTRAL,
  AI_MODEL_CLAUDE,
  AI_MODEL_LLAMA
];

export const DEFAULT_AI_MODEL = AI_MODEL_GPT;

export const RESPONSE_CODE = {
  api_key_not_found: "api_key_not_found",
  api_key_not_set: "api_key_not_set",
  insufficient_points: "insufficient_points"
}

export const languages: LanguageOption[] = [
  { name: 'arabic', label: 'Arabic', value: 'ar' as LanguageOption['value'] },
  { name: 'chinese', label: 'Chinese', value: 'zh' as LanguageOption['value'] },
  { name: 'english', label: 'English', value: 'en' as LanguageOption['value'] },
  { name: 'french', label: 'French', value: 'fr' as LanguageOption['value'] },
  { name: 'german', label: 'German', value: 'de' as LanguageOption['value'] },
  { name: 'greek', label: 'Greek', value: 'gr' as LanguageOption['value'] },
  { name: 'italian', label: 'Italian', value: 'it' as LanguageOption['value'] },
  { name: 'japanese', label: 'Japanese', value: 'jp' as LanguageOption['value'] },
  { name: 'korean', label: 'Korean', value: 'ko' as LanguageOption['value'] },
  { name: 'russian', label: 'Russian', value: 'ru' as LanguageOption['value'] },
  { name: 'spanish', label: 'Spanish', value: 'es' as LanguageOption['value'] },
  { name: 'swedish', label: 'Swedish', value: 'sv' as LanguageOption['value'] },
  { name: 'ukrainian', label: 'Ukrainian', value: 'ua' as LanguageOption['value'] },
]

export const tones: AiToneOption[] = [
  { name: 'academic', label: 'Academic', value: 'academic' },
  { name: 'business', label: 'Business', value: 'business' },
  { name: 'casual', label: 'Casual', value: 'casual' },
  { name: 'childfriendly', label: 'Childfriendly', value: 'childfriendly' },
  { name: 'conversational', label: 'Conversational', value: 'conversational' },
  { name: 'emotional', label: 'Emotional', value: 'emotional' },
  { name: 'humorous', label: 'Humorous', value: 'humorous' },
  { name: 'informative', label: 'Informative', value: 'informative' },
  { name: 'inspirational', label: 'Inspirational', value: 'inspirational' },
  { name: 'memeify', label: 'Memeify', value: 'meme' },
  { name: 'narrative', label: 'Narrative', value: 'narrative' },
  { name: 'objective', label: 'Objective', value: 'objective' },
  { name: 'persuasive', label: 'Persuasive', value: 'persuasive' },
  { name: 'poetic', label: 'Poetic', value: 'poetic' },
]

export const userColors = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc', '#f0abfc']

export const themeColors = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc']
