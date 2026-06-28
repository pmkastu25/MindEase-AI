const { Ollama } = require("ollama");

// Resolve host URL from OLLAMA_HOST, or extract from OOLAMA_API_URL, defaulting to standard local port
const hostUrl = process.env.OLLAMA_HOST || 
                (process.env.OOLAMA_API_URL ? process.env.OOLAMA_API_URL.replace("/api/generate", "") : "") || 
                "http://127.0.0.1:11434";

console.log(`Initializing Ollama client targeting: ${hostUrl}`);
const ollama = new Ollama({ host: hostUrl });

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/**
 * Service wrapper to make generation calls to the local Ollama LLM
 * @param {string} prompt The text prompt to generate from
 * @param {string} model The Ollama model name to target (defaults to llama3)
 * @returns {Promise<string>} The generated reply
 */
async function generateContent(prompt, model = OLLAMA_MODEL) {
  try {
    const response = await ollama.generate({
      model: model,
      prompt: prompt,
      options: {
        temperature: 0.7
      }
    });
    return response.response.trim();
  } catch (err) {
    console.error("Ollama generation failed:", err.message);
    throw err;
  }
}

module.exports = {
  ollama,
  generateContent,
  modelName: OLLAMA_MODEL
};
