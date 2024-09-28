import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { generateText, OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";
import { match } from "ts-pattern";
import { openai as openai1 } from '@ai-sdk/openai'; // Ensure OPENAI_API_KEY environment variable is set

// Create an OpenAI API client (that's edge friendly!)

// IMPORTANT! Set the runtime to edge: https://vercel.com/docs/functions/edge-functions/edge-runtime
export const runtime = "edge";

export async function POST(req){
  // const demotext = "Hello, World!";
  // await new Promise((resolve) => setTimeout(resolve, 3000));

  // return new Response(JSON.stringify({ response: demotext }))
  
  if(process.env.IS_UAT == "1"){
    return new Response(JSON.stringify({ response: `# Gandhi Jayanti: A Reflection on the Life and Legacy of Mahatma Gandhi` }))

    return new Response(JSON.stringify({ response: `# Gandhi Jayanti: A Reflection on the Life and Legacy of Mahatma Gandhi

Gandhi Jayanti, observed on October 2nd every year, is one of India's three officially declared national holidays, alongside Republic Day and Independence Day. This day commemorates the birth anniversary of Mohandas Karamchand Gandhi, popularly known as Mahatma Gandhi, who was born on October 2, 1869. Gandhi is revered as the 'Father of the Nation' in India for his pivotal role in the Indian independence movement against British rule through non-violent means.

## The Significance of Gandhi Jayanti

Gandhi Jayanti is not only a day to honor the memory of Mahatma Gandhi but also to reaffirm the values of non-violence, peace, and truth. The celebration is marked by prayer services and tributes across India, especially at Raj Ghat, Gandhi's memorial in New Delhi where he was cremated following his assassination in 1948.

### Activities on Gandhi Jayanti

- **Prayer Meetings:** People gather to sing Gandhi's favorite devotional songs and read from religious scriptures. This reflects Gandhi's belief in the power of spirituality.
- **Award Ceremonies:** Various awards for promoting peace and non-violence are presented.
- **Educational Events:** Schools and colleges organize events that include debates, essay competitions, and art exhibitions themed around Gandhi's life and teachings.
- **Community Service:** Emphasizing Gandhi's principle of 'Seva' or service, many volunteer groups engage in community cleanup, tree planting, and helping the underprivileged.

## Gandhi's Philosophy and Its Global Impact

Gandhi's philosophy of non-violence, or 'Ahimsa', and his methodology of passive resistance, known as 'Satyagraha', have inspired numerous global leaders and movements. From Martin Luther King Jr.'s leadership of the Civil Rights Movement in the United States to Nelson Mandela's struggle against apartheid in South Africa, Gandhi's impact is profound and far-reaching.

### Key Principles Taught by Gandhi:

1. **Non-violence:** Advocating for peaceful methods to bring about social and political change.
2. **Truth:** The pursuit of truth was central to Gandhi's philosophy, believing it to be the ultimate reality.
3. **Simplicity:** Gandhi led a minimalist lifestyle and advocated for simple living as a way to personal and societal reform.
4. **Self-discipline:** He believed in self-governance and discipline as essential to personal growth and integrity.

## Challenges in Preserving Gandhi's Legacy

While Gandhi's teachings continue to inspire, there are challenges in translating his ideals into practice in the contemporary world fraught with conflict and materialism. The commercialization of Gandhi's image and principles for political or monetary gains sometimes undermines the profoundness of his message.

## Conclusion

Gandhi Jayanti serves not only as a reminder of Gandhi's dedication to social justice and human rights but also as a day to reflect on how his teachings can be applied in today's world. It is a day to recommit to peace, tolerance, and understanding across cultures and communities. As the world continues to face divisions and conflicts, Gandhi's message of non-violence remains as relevant as ever, urging us to strive for a more just and compassionate world.

On this day, let us remember that the true tribute to Gandhi would be a genuine adherence to his principles and striving towards the peaceful and inclusive world he envisioned.` }))
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
  // Check if the OPENAI_API_KEY is set, if not return 400
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "") {
    return new Response("Missing OPENAI_API_KEY - make sure to add it to your .env file.", {
      status: 400,
    });
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(`novel_ratelimit_${ip}`);

    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  const { prompt, option, command } = await req.json();
  const messages = match(option)
    .with("continue", () => ({
      system: "You are an AI writing assistant that continues existing text based on context from prior text. " +
          "Give more weight/priority to the later characters than the beginning ones. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
          "Use Markdown formatting when appropriate.",
      prompt: prompt
    }))
    .with("improve", () => ({
      system: "You are an AI writing assistant that improves existing text. " +
        "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
        "Use Markdown formatting when appropriate.",
      prompt: `The existing text is: ${prompt}`
    }))
    .with("shorter", () => ({
      system: "You are an AI writing assistant that shortens existing text. " +
        "Use Markdown formatting when appropriate.",
      prompt: `The existing text is: ${prompt}`
    }))
    .with("longer", () => ({
      system: "You are an AI writing assistant that lengthens existing text. " +
        "Use Markdown formatting when appropriate.",
      prompt: `The existing text is: ${prompt}`
    }))
    .with("fix", () => ({
      system: "You are an AI writing assistant that fixes existing text. " +
        "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
        "Use Markdown formatting when appropriate.",
      prompt: `The existing text is: ${prompt}`
    }))
    .with("zap", () => ({
      system: "You area an AI writing assistant that generates text based on a prompt. " +
          "You take an input from the user and a command for manipulating the text" +
          "Use Markdown formatting when appropriate.",
      prompt: `For this text: ${prompt}. You have to respect the command: ${command}`
    }))
    .with("aiBlock", () => ({
      system: "You area an AI writing assistant that generates text based on a prompt. " +
          "Use Markdown formatting when appropriate.",
      prompt: `${command}`
    }))
    .run();
  // const messages = match(option)
  //   .with("continue", () => [
  //     {
  //       role: "system",
  //       content:
  //         "You are an AI writing assistant that continues existing text based on context from prior text. " +
  //         "Give more weight/priority to the later characters than the beginning ones. " +
  //         "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
  //         "Use Markdown formatting when appropriate.",
  //     },
  //     {
  //       role: "user",
  //       content: prompt,
  //     },
  //   ])
  //   .with("improve", () => [
  //     {
  //       role: "system",
  //       content:
  //         "You are an AI writing assistant that improves existing text. " +
  //         "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
  //         "Use Markdown formatting when appropriate.",
  //     },
  //     {
  //       role: "user",
  //       content: `The existing text is: ${prompt}`,
  //     },
  //   ])
  //   .with("shorter", () => [
  //     {
  //       role: "system",
  //       content:
  //         "You are an AI writing assistant that shortens existing text. " + "Use Markdown formatting when appropriate.",
  //     },
  //     {
  //       role: "user",
  //       content: `The existing text is: ${prompt}`,
  //     },
  //   ])
  //   .with("longer", () => [
  //     {
  //       role: "system",
  //       content:
  //         "You are an AI writing assistant that lengthens existing text. " +
  //         "Use Markdown formatting when appropriate.",
  //     },
  //     {
  //       role: "user",
  //       content: `The existing text is: ${prompt}`,
  //     },
  //   ])
  //   .with("fix", () => [
  //     {
  //       role: "system",
  //       content:
  //         "You are an AI writing assistant that fixes grammar and spelling errors in existing text. " +
  //         "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
  //         "Use Markdown formatting when appropriate.",
  //     },
  //     {
  //       role: "user",
  //       content: `The existing text is: ${prompt}`,
  //     },
  //   ])
  //   .with("zap", () => [
  //     {
  //       role: "system",
  //       content:
  //         "You area an AI writing assistant that generates text based on a prompt. " +
  //         "You take an input from the user and a command for manipulating the text" +
  //         "Use Markdown formatting when appropriate.",
  //     },
  //     {
  //       role: "user",
  //       content: `For this text: ${prompt}. You have to respect the command: ${command}`,
  //     },
  //   ])
  //   .run();

  //   console.log("messages", messages);
    console.log("Asking for response....");
    
  const { text } = await generateText({
    model: openai1('gpt-4-turbo'),
    ...messages,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });
  
  return new Response(JSON.stringify({ response: text }))

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    n: 1,
  });
  // return new Response(JSON.stringify({ response: response }))
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
