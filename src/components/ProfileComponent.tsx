"use client";

import { getApiKeyStatus, saveApiKeys } from "@/actions/apiKeyActions";
import { API_KEY_FIELDS, type ApiKeyField } from "@/lib/ai/apiKeyFields";
import { CHAT_MODELS } from "@/lib/ai/providerModels";
import { AI_MODELS_LIST } from "@/lib/constants";
import { creditsAvailableLabel } from "@/lib/billing/creditBalance";
import { LoadingState } from "@/components/ui/LoadingState";
import useProfileStore from "@/zustand/useProfileStore";
import { useEffect, useState } from "react";

const FIELD_LABELS: Record<ApiKeyField, string> = {
  openai_api_key: "OpenAI API Key",
  anthropic_api_key: "Anthropic API Key",
  google_gen_ai_api_key: "Google Generative AI API Key",
  xai_api_key: "xAI API Key",
};

const MODEL_LABEL_BY_FIELD = Object.fromEntries(
  AI_MODELS_LIST.map((model) => [CHAT_MODELS[model].keyField, CHAT_MODELS[model].label])
) as Record<ApiKeyField, string>;

function emptyFieldMap<T>(value: T): Record<ApiKeyField, T> {
  return Object.fromEntries(API_KEY_FIELDS.map((field) => [field, value])) as Record<
    ApiKeyField,
    T
  >;
}

export default function ProfileComponent() {
  const credits = useProfileStore((state) => state.profile.credits);
  const creditsLoaded = useProfileStore((state) => state.creditsLoaded);
  const creditsLabel = creditsAvailableLabel(creditsLoaded, credits);
  const [drafts, setDrafts] = useState<Record<ApiKeyField, string>>(() => emptyFieldMap(""));
  const [saved, setSaved] = useState<Record<ApiKeyField, boolean>>(() => emptyFieldMap(false));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getApiKeyStatus()
      .then((status) => {
        if (!ignore) setSaved(status);
      })
      .catch(() => {
        if (!ignore) setMessage("API key status is unavailable.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const hasDraft = API_KEY_FIELDS.some((field) => drafts[field].trim().length > 0);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveApiKeys(drafts);
      const status = await getApiKeyStatus();
      setSaved(status);
      setDrafts(emptyFieldMap(""));
      setMessage("API keys saved.");
    } catch {
      setMessage("Could not save API keys.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col p-5 border rounded-[10px] shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
      <div className="mb-4 text-sm text-neutral-600" aria-live="polite" aria-busy={!creditsLoaded}>
        {creditsLabel ?? (
          <LoadingState
            size="sm"
            text="Loading credits"
            className="flex-row justify-start gap-2 py-0"
          />
        )}
      </div>
      <div className="flex flex-col gap-5">
        {API_KEY_FIELDS.map((field) => (
          <div key={field} className="flex flex-col">
            <label htmlFor={field} className="text-base font-light mb-[5px]">
              {FIELD_LABELS[field]} ({MODEL_LABEL_BY_FIELD[field]})
              {saved[field] ? " (saved)" : ""}:
            </label>
            <input
              type="password"
              id={field}
              name={field}
              autoComplete="off"
              value={drafts[field]}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [field]: event.target.value,
                }))
              }
              className="border bg-ghostWhite text-mediumGray rounded-sm py-[10px] px-[15px] h-10 text-sm"
              placeholder={
                saved[field]
                  ? "A key is saved. Enter a new one to replace it."
                  : `Enter your ${FIELD_LABELS[field]}`
              }
            />
          </div>
        ))}
      </div>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
      <div className="mt-10 w-full">
        <button
          onClick={handleSave}
          disabled={!hasDraft || saving}
          className="bg-blue-500 text-white px-3 py-3 rounded-sm hover:opacity-50 disabled:opacity-50 w-full"
        >
          Update API Keys
        </button>
      </div>
    </div>
  );
}
