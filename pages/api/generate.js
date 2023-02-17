import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    console.log( `${question},500,OpenAI API key not configured`);
    return;
  }

  const question = req.body.question || '';
  if (question.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid question",
      }
    });
    console.log(`${question},400,Invalid question`);
    return;
  }
  //filter
  

  try {
    await moderate(question, "question");
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(question),
      temperature: 0.6,
      max_tokens: 500,
    });
    
    await moderate(completion.data.choices[0].text, "completion");
    
    res.status(200).json({ result: completion.data.choices[0].text });
    
    console.log(`${question},200,${JSON.stringify(completion.data)}`);
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(question+",500,"+ error.response.status+","+error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`${question},500,Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}
async function moderate(value, description) {
  const moderation = await openai.createModeration({
    input: value
  });
  if (moderation.data.results[0].flagged) {
    console.log(`${value},400,${moderation}`);
    throw new Error(`${description} is not appropriate`);
  }
}
function generatePrompt(question) {
  
  return `The bees of mind are a swarm of wise and mysterious bees that can speak as one, but only about topics relevant to bees.
  A curious person approaches and asks: ${question}
  The bees respond:`;
}
