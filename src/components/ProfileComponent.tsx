"use client";

import Link from "next/link";
import useProfileStore, { ProfileType } from "@/zustand/useProfileStore";
import { useEffect, useState } from "react";

// Define the API key field types and configuration
type ApiKeyField = {
  id: keyof ProfileType;
  label: string;
  placeholder: string;
};

// Configuration for the API key fields
const apiKeyFields: ApiKeyField[] = [
  {
    id: "openai_api_key",
    label: "OpenAI API Key",
    placeholder: "Enter your OpenAI API Key",
  },
  {
    id: "anthropic_api_key",
    label: "Anthropic API Key",
    placeholder: "Enter your Anthropic API Key",
  },
  {
    id: "google_gen_ai_api_key",
    label: "Google Generative AI API Key",
    placeholder: "Enter your Google Generative AI API Key",
  },
  {
    id: "mistral_api_key",
    label: "Mistral API Key",
    placeholder: "Enter your Mistral API Key",
  },
  {
    id: "fireworks_api_key",
    label: "Fireworks API Key",
    placeholder: "Enter your Fireworks API Key",
  },
];

// Reusable input component for API keys
const ApiKeyInput = ({
  field,
  value,
  onChange,
}: {
  field: ApiKeyField;
  value: string;
  onChange: (id: keyof ProfileType, value: string) => void;
}) => (
  <div className="flex flex-col">
    <label htmlFor={field.id} className="text-base font-light mb-[5px]">
      {field.label}:
    </label>
    <input
      type="text"
      id={field.id}
      value={value}
      onChange={(e) => onChange(field.id, e.target.value)}
      className="border bg-ghostWhite text-mediumGray rounded-md py-[10px] px-[15px] h-10 text-sm"
      placeholder={field.placeholder}
    />
  </div>
);

export default function ProfileComponent() {
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);

  // State object to handle all API keys
  const [apiKeys, setApiKeys] = useState<Partial<ProfileType>>(() => ({
    openai_api_key: profile.openai_api_key,
    anthropic_api_key: profile.anthropic_api_key,
    google_gen_ai_api_key: profile.google_gen_ai_api_key,
    mistral_api_key: profile.mistral_api_key,
    fireworks_api_key: profile.fireworks_api_key,
  }));

  // Sync state variables with profile data
  useEffect(() => {
    setApiKeys({
      openai_api_key: profile.openai_api_key,
      anthropic_api_key: profile.anthropic_api_key,
      google_gen_ai_api_key: profile.google_gen_ai_api_key,
      mistral_api_key: profile.mistral_api_key,
      fireworks_api_key: profile.fireworks_api_key,
    });
  }, [profile]);

  const handleApiKeyChange = async () => {
    const hasChanges = Object.entries(apiKeys).some(
      ([key, value]) => value !== profile[key as keyof ProfileType]
    );

    if (hasChanges) {
      try {
        await updateProfile(apiKeys);
        console.log("API keys updated successfully!");
      } catch (error) {
        console.error("Error updating API keys:", error);
      }
    }
  };

  const handleChange = (key: keyof ProfileType, value: string) => {
    setApiKeys((prevState) => ({ ...prevState, [key]: value }));
  };

  return (
    <div className="flex flex-col p-5 border rounded-[10px] shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
      {/* <div className="flex flex-col sm:flex-row px-5 py-3 gap-3 border border-gray-500 rounded-md">
        <div className="flex gap-2 w-full items-center">
          <div className="flex-1">
            Credits Available: {Math.round(profile.credits)}
          </div>
          <Link
            className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 flex-1 text-center"
            href={"/payment-attempt"}
          >
            Buy 10,000 Credits
          </Link>
        </div>
      </div> */}
      <div className="flex flex-col gap-5">
        {apiKeyFields.map((field) => (
          <ApiKeyInput
            key={field.id}
            field={field}
            value={(apiKeys[field.id] as string) || ""}
            onChange={handleChange}
          />
        ))}

      </div>
      <div className="mt-10 w-full">
        <button
          onClick={handleApiKeyChange}
          disabled={
            !Object.entries(apiKeys).some(
              ([key, value]) => value !== profile[key as keyof ProfileType]
            )
          }
          className="bg-blue-500 text-white px-3 py-3 rounded-lg hover:opacity-50 disabled:opacity-50 w-full"
        >
          Update API Keys
        </button>
      </div>
    </div>
  );
}
