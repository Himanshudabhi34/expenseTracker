export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daily_expense_tracker',
  jwtSecret: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  // Expense agent LLM (optional). When disabled or unreachable the agent falls
  // back to the deterministic rule-based engine.
  llmEnabled: (process.env.LLM_ENABLED || 'true').toLowerCase() !== 'false',
  llmProvider: process.env.LLM_PROVIDER || 'ollama',
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1',
  llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS, 10) || 60000,
  llmMaxTurns: parseInt(process.env.LLM_MAX_TURNS, 10) || 5,
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
};

export default config;
