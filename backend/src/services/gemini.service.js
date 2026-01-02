const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');
const config = require('../config/config');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Generate AI-scored recommendations with explanations
 * @param {Array} userHistory - List of { eventType, product: { name, category } }
 * @param {Array} candidates - List of candidate products { _id, name, category, price }
 * @returns {Promise<Array>} - List of { productId, explanation, aiScore }
 */
const generateAiRecommendations = async (userHistory, candidates) => {
    if (!config.gemini.apiKey) {
        logger.warn('GEMINI_API_KEY not set in config. Skipping AI recommendations.');
        return [];
    }

    try {
        // Use the configured model or default
        // Note: Model availability depends on your API key and region
        // If you get 404 errors, check Google Cloud Console for available models
        // Common models: gemini-2.5-flash-lite, gemini-2.0-flash, gemini-1.5-flash-002, gemini-1.5-pro-002, gemini-1.5-flash, gemini-1.5-pro
        const modelName = config.gemini.model || "gemini-2.5-flash-lite";
        
        logger.info(`Using Gemini model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
            }
        });

        // Succinct context for the model
        const historyText = userHistory.map(h =>
            `${h.eventType === 'view' ? 'Viewed' : 'Bought'} ${h.product?.name || 'Item'} (${h.product?.category})`
        ).join(', ');

        const candidatesText = candidates.map(p =>
            `- ID: ${p._id}, Name: ${p.name}, Category: ${p.category}`
        ).join('\n');

        const prompt = `
        User History: ${historyText}

        Candidate Products:
        ${candidatesText}

        Task: Select the top 5 most relevant products for this user based on their history.
        Return a valid JSON array of objects. Do not wrap in markdown or code blocks.
        Format:
        [
            { "productId": "ID", "explanation": "Short reason why", "score": 0-100 }
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim(); // Sanitize

        const aiRecommendations = JSON.parse(text);
        return aiRecommendations;

    } catch (error) {
        logger.error('Gemini AI Error occurred during recommendation generation.', {
            message: error.message,
            stack: error.stack,
            context: { historyLen: userHistory.length, candidatesLen: candidates.length }
        });
        return []; // Fallback to empty array
    }
};

module.exports = {
    generateAiRecommendations
};
