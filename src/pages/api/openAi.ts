import { Configuration, OpenAIApi } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

type Data = {
  message: string;
};

type Error = {
  error: {
    message: string;
  };
};

async function getRes(req: NextApiRequest, res: NextApiResponse<Error | Data>) {
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
    const message = completion.data.choices[0].text;
    if (message) {
      res.status(200).json({ message });
    } else {
      res.status(500).json({
        error: {
          message: "No message returned from OpenAI",
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: {
        message: error.message,
      },
    });
  }
}

export default getRes;
