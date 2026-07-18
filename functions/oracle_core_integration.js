const vectorKnowledge = require("./VectorKnowledgeService");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// This function will be the bridge between the main logic and the vector DB
async function getRelevantKnowledgeFromVectorDB(question, limit = 5) {
  if (!vectorKnowledge.isInitialized) {
    console.warn("Vector DB not ready. No knowledge retrieved.");
    return [];
  }

  try {
    // Initialize Gemini model for embedding
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: "embedding-001"});

    // 1. Create Embedding for the current question
    const embeddingResult = await model.embedContent(question);
    const questionVector = embeddingResult.embedding.values;

    // 2. Query Pinecone (The Oracle Core)
    const queryResults = await vectorKnowledge.queryKnowledge(questionVector, limit);
    console.log(`🧠 Oracle Core found ${queryResults.length} relevant documents.`);

    // 3. Format results into a clean structure
    return queryResults.map((match) => ({
      id: match.id,
      relevanceScore: match.score,
      ...match.metadata,
      timestamp: match.metadata.timestamp ? new Date(match.metadata.timestamp) : new Date(),
    }));
  } catch (error) {
    console.error("Error querying Oracle Core:", error);
    return []; // Return empty on error, allowing fallback mechanism to take over
  }
}

module.exports = {
  getRelevantKnowledgeFromVectorDB,
};
