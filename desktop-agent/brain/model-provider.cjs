const DEFAULT_ENDPOINT = "https://api.openai.com/v1/chat/completions";

class ModelConfigurationError extends Error {
  constructor(message) { super(message); this.name = "ModelConfigurationError"; }
}

class OpenAICompatibleProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.APLUSCITY_MODEL_API_KEY || "";
    this.model = options.model || process.env.APLUSCITY_MODEL || "";
    this.baseUrl = (options.baseUrl || process.env.APLUSCITY_MODEL_BASE_URL || DEFAULT_ENDPOINT).replace(/\/+$/, "");
    this.timeoutMs = Number(options.timeoutMs || process.env.APLUSCITY_MODEL_TIMEOUT_MS || 30000);
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
  }
  isConfigured() { return Boolean(this.apiKey && this.model); }
  async generate({ system, user, temperature = 0.2, maxTokens = 1800 } = {}) {
    if (!this.isConfigured()) throw new ModelConfigurationError("Configure APLUSCITY_MODEL_API_KEY and APLUSCITY_MODEL to enable model reasoning.");
    if (typeof this.fetchImpl !== "function") throw new Error("This Node.js runtime does not provide fetch().");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.baseUrl, {
        method: "POST",
        headers: { "Authorization": "Bearer " + this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, temperature, max_tokens: maxTokens,
          messages: [{ role: "system", content: system || "" }, { role: "user", content: user || "" }] }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload && payload.error && payload.error.message;
        throw new Error("Model provider request failed (" + response.status + "): " + (message || "unknown provider error"));
      }
      const content = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("Model provider returned an empty response.");
      return content.trim();
    } finally { clearTimeout(timer); }
  }
}

class UnconfiguredModelProvider {
  isConfigured() { return false; }
  async generate() { throw new ModelConfigurationError("No model provider configured."); }
}
module.exports = { OpenAICompatibleProvider, UnconfiguredModelProvider, ModelConfigurationError };
