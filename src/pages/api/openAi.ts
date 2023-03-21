import { Configuration, OpenAIApi } from "openai";

type History = { user: "nata" | "franco"; message: string }[];

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
      },
    });
    return;
  }

  const prompt = req.body.prompt || [];

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      temperature: 1,
      max_tokens: 500,
      stop: ["\n"],
    });
    res.status(200).json({ message: completion.data.choices[0].text });
  } catch (error) {
    res.status(500).json({ error });
  }
}
