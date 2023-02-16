// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Configuration, CreateCompletionRequest, OpenAIApi } from "openai";
import GPT3Tokenizer from "gpt3-tokenizer";

export class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message);
  }
}

export class UserError extends ApplicationError {}

type Data = {
  query?: string;
  error?: string;
  response?: string;
  prompt?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.OPENAI_KEY
    ) {
      return res.status(500).send({
        error:
          "Server is missing required configuration variables and cannot complete request",
      });
    }

    console.log(req.query);
    if (!req.query.q) {
      return res.status(400).send({
        error: "Please provide a query",
      });
    }

    const sanitizedQuery = (<string>req.query.q).trim();

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY });
    const openai = new OpenAIApi(configuration);

    // Moderate the content to comply with OpenAI T&C
    const moderationResponse = await openai.createModeration({
      input: sanitizedQuery,
    });
    const [results] = moderationResponse.data.results;

    if (results.flagged) {
      throw new UserError("Flagged content", {
        flagged: true,
        categories: results.categories,
      });
    }

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: sanitizedQuery.replaceAll("\n", " "),
    });

    if (embeddingResponse.status !== 200) {
      throw new ApplicationError(
        "Failed to create embedding for question",
        embeddingResponse
      );
    }

    const [{ embedding }] = embeddingResponse.data.data;

    const { error: matchError, data: pageSections } = await supabaseClient.rpc(
      "match_page_sections",
      {
        embedding,
        match_threshold: 0.78,
        match_count: 10,
        min_content_length: 50,
      }
    );

    if (matchError) {
      throw new ApplicationError("Failed to match page sections", matchError);
    }

    const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
    let tokenCount = 0;
    let contextText = "";

    for (let i = 0; i < pageSections.length; i++) {
      const pageSection = pageSections[i];
      const content = pageSection.content;
      const encoded = tokenizer.encode(content);
      tokenCount += encoded.text.length;

      if (tokenCount >= 1500) {
        break;
      }

      contextText += `${content.trim()}\n---\n`;
    }

    const prompt = `You are a very enthusiastic New York Times representative who loves to help people! Given the following sections from the New York Times help center, answer the question using only that information, outputted in markdown format. If you are unsure and the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that."

Context sections:
${contextText}

Question: """
${sanitizedQuery}
"""

Answer in a markdown format (include any images or code snippets if available):
`;

    const completionOptions: CreateCompletionRequest = {
      model: "text-davinci-003",
      prompt,
      max_tokens: 512,
      temperature: 0,
      // stream: true,
    };

    const completion = await openai.createCompletion(completionOptions);

    console.log(completion.data.choices);

    res.status(200).json({
      query: sanitizedQuery,
      prompt,
      response: completion.data.choices[0].text,
    });
  } catch (err: unknown) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "There was a problem processing this request" });
  }
}
