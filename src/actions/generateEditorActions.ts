"use server";

import { db } from "@/firebase/firebaseAdminConfig";
import { generateResponse } from "./generateActions";
import { AI_MODEL_CLAUDE, AI_MODEL_GEMINI, AI_MODEL_GPT, AI_MODEL_LLAMA, AI_MODEL_MISTRAL, AI_MODELS_LIST, COST_POINT_PER_TOKEN, DEFAULT_AI_MODEL, MAX_OUTPUT_TOKEN, RESPONSE_CODE, USER_COLLECTION } from "@/lib/constants";
import { AIOptions } from "@/interfaces/general";
import { auth } from "@clerk/nextjs/server";

class User {
    userRef: FirebaseFirestore.DocumentReference;
    userSnapshot: FirebaseFirestore.DocumentSnapshot | null;
    constructor(public id: string) {
        this.userRef = db.collection(USER_COLLECTION).doc(id).collection("profile").doc("userData");
        this.userSnapshot = null;
    }

    async loadUserSnapshot() {
        if (!this.userSnapshot) {
            this.userSnapshot = await this.userRef.get();
        }
        return this.userSnapshot;
    }

    async getUserData() {
        const userSnapshot = await this.loadUserSnapshot();
        return userSnapshot.data();
    }

    async getAIModel() {
        const data = await this.getUserData();
        const availableModelKeys = [];
        if (data && data.openai_api_key) availableModelKeys.push(AI_MODEL_GPT);
        if (data && data.anthropic_api_key) availableModelKeys.push(AI_MODEL_GEMINI);
        if (data && data.google_gen_ai_api_key) availableModelKeys.push(AI_MODEL_MISTRAL);
        if (data && data.mistral_api_key) availableModelKeys.push(AI_MODEL_CLAUDE);
        if (data && data.fireworks_api_key) availableModelKeys.push(AI_MODEL_LLAMA);

        if (availableModelKeys.length == 0) {
            // throw new Error("API key not set.", { cause: { code: RESPONSE_CODE.api_key_not_set } });
            return { status: false, code: RESPONSE_CODE.api_key_not_set };
        }

        const aiModelKeys: Record<string, string> = {
            [AI_MODEL_GPT]: data && data.openai_api_key ? data.openai_api_key : "",
            [AI_MODEL_GEMINI]:
                data && data.anthropic_api_key ? data.anthropic_api_key : "",
            [AI_MODEL_MISTRAL]:
                data && data.google_gen_ai_api_key ? data.google_gen_ai_api_key : "",
            [AI_MODEL_CLAUDE]: data && data.mistral_api_key ? data.mistral_api_key : "",
            [AI_MODEL_LLAMA]:
                data && data.fireworks_api_key ? data.fireworks_api_key : "",
        };

        if (typeof data != "object") {
            throw new Error("User data not found.");
        }

        if (
            Object.keys(data).includes("ai_model") &&
            typeof data.ai_model == "string" &&
            AI_MODELS_LIST.includes(data.ai_model)
        ) {
            // if user has selected ai model then use only that
            if (!availableModelKeys.includes(data.ai_model))
                throw new Error("AI key not found.", { cause: { code: RESPONSE_CODE.api_key_not_found } });
        }

        // If not selected then use first default model
        if (availableModelKeys.includes(DEFAULT_AI_MODEL))
            return {
                status: true,
                data: { model: DEFAULT_AI_MODEL, key: aiModelKeys[DEFAULT_AI_MODEL] },
            };

        // If default ai model does not have key then use model which key is set
        const aiModel = availableModelKeys[0];
        return { status: true, data: { model: aiModel, key: aiModelKeys[aiModel] } };
    }

    async checkExpectedPointForPrompt(prompt: string, expectedOutputTokens: number = MAX_OUTPUT_TOKEN) {

        // Rough estimate by considering each word as a token
        const data = await this.getUserData();
        const userCredits = data && data.credits ? data.credits : 0;

        if (userCredits <= 0) return false;

        const inputTokens = countTokens(prompt);  // Implement token counting logic
        const totalTokens = inputTokens + expectedOutputTokens;
        return pointsForPrompt(totalTokens) <= userCredits ? true : false;
    }
    async deductPoint(inputPrompt: string, outputPrompt: string) {
        // Rough estimate by considering each word as a token
        const data = await this.getUserData();
        const userCredits = data && data.credits ? data.credits : 0;
        const updatedCredits = userCredits - pointsForPrompt(countTokens(inputPrompt) + countTokens(outputPrompt));

        await this.userRef.set({
            credits: updatedCredits
        }, { merge: true });
    }
}

const aiCommandPrompts: Record<AIOptions, (text: string, command: string) => { systemPrompt: string, userPrompt: string }> = {
    continue: (text: string) => ({
        systemPrompt:
            "You are an AI writing assistant that continues existing text based on context from prior text. " +
            "Give more weight/priority to the later characters than the beginning ones. " +
            "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
            "Use Markdown formatting when appropriate.",
        userPrompt: text,
    }),
    improve: (text: string) => ({
        systemPrompt:
            "You are an AI writing assistant that improves existing text. " +
            "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
            "Use Markdown formatting when appropriate.",
        userPrompt: `The existing text is: ${text}`,
    }),
    shorter: (text: string) => ({
        systemPrompt:
            "You are an AI writing assistant that shortens existing text. " +
            "Use Markdown formatting when appropriate.",
        userPrompt: `The existing text is: ${text}`,
    }),

    longer: (text: string) => ({
        systemPrompt:
            "You are an AI writing assistant that lengthens existing text. " +
            "Use Markdown formatting when appropriate.",
        userPrompt: `The existing text is: ${text}`,
    }),
    fix: (text: string) => ({
        systemPrompt:
            "You are an AI writing assistant that fixes existing text. " +
            "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
            "Use Markdown formatting when appropriate.",
        userPrompt: `The existing text is: ${text}`,
    }),
    zap: (text: string, command: string) => ({
        systemPrompt:
            "You are an AI writing assistant that generates text based on a prompt. " +
            "You take an input from the user and a command for manipulating the text" +
            "Use Markdown formatting when appropriate.",
        userPrompt: `For this text: ${text}. You have to respect the command: ${command}`,
    }),
}
// const costPerToken = 0.1; // Example point cost per token

function countTokens(text: string) {
    // Rough estimate by considering each word as a token
    return text.split(/\s+/).length;
}

function pointsForPrompt(tokens: number) {
    return tokens * COST_POINT_PER_TOKEN;
}

export async function generateText(
    prompt: string,
    option: AIOptions,
    command: string
) {
    const { userId } = auth();
    if (!userId) {
        throw new Error("User is not signed in.", { cause: { status: 401 } });
    }

    const user = new User(userId);

    const modelOfUser = await user.getAIModel();
    console.log("modelOfUser", modelOfUser);

    const { systemPrompt, userPrompt } = aiCommandPrompts[option](prompt, command);
    // let deductUserPoints = false;
    let modelName = DEFAULT_AI_MODEL;
    let api_key = process.env.OPENAI_API_KEY ?? '';
    if (modelOfUser.status === false) {
        if (modelOfUser.code === RESPONSE_CODE.api_key_not_set) {
            const hasExpectedPoint = await user.checkExpectedPointForPrompt(userPrompt);
            // deductUserPoints = true;
            if (!hasExpectedPoint) {
                throw new Error("You don't have enough points to run this command.", { cause: { code: RESPONSE_CODE.insufficient_points } });
            }
        } else {
            throw new Error("You have not added any credit or AI key.", { cause: { code: modelOfUser.code } });
        }
    } else if (!modelOfUser.data) {
        // Calculate expected credit require user to run ai command
        throw new Error("You have not added any credit or AI key.", { cause: { code: modelOfUser.code } });
    } else {
        modelName = modelOfUser.data.model;
        api_key = modelOfUser.data.key;
    }





    const response = await generateResponse(systemPrompt, userPrompt, modelName, api_key);
    user.deductPoint(userPrompt, response);

    return response;
}