const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Add a robust retry mechanism with exponential backoff for rate limit (429) errors
model.generateContentWithRetry = async function (options, retries = 3, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await model.generateContent(options);
    } catch (err) {
      const errMsg = err.message || "";
      const isRateLimit = 
        errMsg.includes("429") || 
        err.status === 429 || 
        err.statusCode === 429 || 
        errMsg.toLowerCase().includes("too many requests");
        
      if (isRateLimit && i < retries) {
        console.warn(`Gemini API 429 Rate Limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff (1000ms -> 2000ms -> 4000ms)
        continue;
      }
      throw err;
    }
  }
};

module.exports = model;
