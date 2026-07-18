const {Pinecone} = require("@pinecone-database/pinecone");

class VectorKnowledgeService {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const apiKey = process.env.PINECONE_API_KEY;
      const environment = process.env.PINECONE_ENVIRONMENT;
      const indexName = process.env.PINECONE_INDEX_NAME || "injection-molding-knowledge";

      if (!apiKey || !environment) {
        throw new Error("PINECONE_API_KEY and PINECONE_ENVIRONMENT must be set");
      }

      this.pinecone = new Pinecone({
        apiKey,
        environment,
      });

      // Check if index exists, create if not (basic setup)
      const existingIndexes = await this.pinecone.listIndexes();
      if (!existingIndexes.includes(indexName)) {
        console.log(`Creating Pinecone index: ${indexName}...`);
        await this.pinecone.createIndex({
          name: indexName,
          dimension: 768, // Dimension for Gemini embeddings (example)
          metric: "cosine",
        });
        console.log(`Index ${indexName} created.`);
      }

      this.index = this.pinecone.index(indexName);
      this.isInitialized = true;
      console.log("✅ Pinecone VectorKnowledgeService initialized successfully.");
    } catch (error) {
      console.error("❌ Failed to initialize VectorKnowledgeService:", error);
      this.isInitialized = false;
    }
  }

  async upsertKnowledge(id, vector, metadata) {
    if (!this.isInitialized) {
      console.warn("Attempted to upsert before initialization.");
      return;
    }
    try {
      await this.index.upsert([{
        id,
        values: vector,
        metadata,
      }]);
      console.log(`🧠 Upserted knowledge with ID: ${id}`);
    } catch (error) {
      console.error(`❌ Error upserting knowledge for ID ${id}:`, error);
    }
  }

  async queryKnowledge(vector, topK = 5) {
    if (!this.isInitialized) {
      console.warn("Attempted to query before initialization.");
      return [];
    }
    try {
      const queryResponse = await this.index.query({
        topK,
        vector,
        includeMetadata: true,
      });
      return queryResponse.matches || [];
    } catch (error) {
      console.error("❌ Error querying knowledge:", error);
      return [];
    }
  }
}

module.exports = new VectorKnowledgeService();
