import ollama from 'ollama';

export class OllamaClient {
  constructor() {
    this.visionModel = process.env.VISION_MODEL || 'llama3.2-vision:11b';
    this.reasoningModel = process.env.REASONING_MODEL || 'deepseek-r1:7b';
    this.coderModel = process.env.CODER_MODEL || 'qwen2.5-coder:7b';
    this.host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  }

  async analyzeImage(imageBase64, prompt) {
    try {
      const response = await ollama.chat({
        model: this.visionModel,
        messages: [{
          role: 'user',
          content: prompt,
          images: [imageBase64]
        }]
      });
      return response.message.content;
    } catch (error) {
      console.error('[Ollama Vision Error]', error.message);
      throw error;
    }
  }

  async analyzeError(errorContext) {
    try {
      const prompt = `Analyze this error and suggest 3 solutions in JSON format:
Error Type: ${errorContext.error_type}
Message: ${errorContext.error_message}
Context: ${JSON.stringify(errorContext.context, null, 2)}

Previous successful strategies:
${JSON.stringify(errorContext.similar_errors, null, 2)}

Return ONLY valid JSON: { "strategies": [{"action": "...", "params": {...}, "confidence": 0.9}] }`;

      const response = await ollama.chat({
        model: this.reasoningModel,
        messages: [{ role: 'user', content: prompt }]
      });
      
      return response.message.content;
    } catch (error) {
      console.error('[Ollama Reasoning Error]', error.message);
      return JSON.stringify({ strategies: [{ action: 'retry', params: {}, confidence: 0.5 }] });
    }
  }

  async generateCodeFix(codeContext, errorDescription) {
    try {
      const prompt = `Fix this code error:
Error: ${errorDescription}

Code:
${codeContext}

Return ONLY the fixed code, no explanations.`;

      const response = await ollama.chat({
        model: this.coderModel,
        messages: [{ role: 'user', content: prompt }]
      });
      
      return response.message.content;
    } catch (error) {
      console.error('[Ollama Coder Error]', error.message);
      throw error;
    }
  }

  async isAvailable() {
    try {
      await ollama.list();
      return true;
    } catch {
      return false;
    }
  }
}
