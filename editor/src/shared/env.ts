export interface Environment {
  NODE_ENV: string;
  CLI_DIR: string;
  CLIENT_DIR: string;
  DOCS_DIR: string;
  EDITOR_DIR: string;
  ENGINE_DIR: string;
  GAME_DIR: string;
  SERVER_DIR: string;
  SHARED_DIR: string;
  STATE_DIR: string;
}

export const getStringEnv = (key: string): string => {
  const value = (import.meta.env as any as Record<string, string>)[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const getIntEnv = (key: string): number => {
  const value = getStringEnv(key);
  if (isNaN(parseInt(value))) {
    throw new Error(`Invalid environment variable: ${key}`);
  }

  return parseInt(value);
};

export const getFloatEnv = (key: string): number => {
  const value = getStringEnv(key);
  if (isNaN(parseFloat(value))) {
    throw new Error(`Invalid environment variable: ${key}`);
  }

  return parseFloat(value);
};

export const getBoolEnv = (key: string): boolean => {
  const value = getStringEnv(key);
  if (value !== "true" && value !== "false") {
    throw new Error(`Invalid environment variable: ${key}`);
  }

  return value === "true";
};

export const env: Environment = {
  NODE_ENV: getStringEnv("VITE_NODE_ENV"),
  CLI_DIR: getStringEnv("VITE_CLI_DIR"),
  CLIENT_DIR: getStringEnv("VITE_CLIENT_DIR"),
  DOCS_DIR: getStringEnv("VITE_DOCS_DIR"),
  EDITOR_DIR: getStringEnv("VITE_EDITOR_DIR"),
  ENGINE_DIR: getStringEnv("VITE_ENGINE_DIR"),
  GAME_DIR: getStringEnv("VITE_GAME_DIR"),
  SERVER_DIR: getStringEnv("VITE_SERVER_DIR"),
  SHARED_DIR: getStringEnv("VITE_SHARED_DIR"),
  STATE_DIR: getStringEnv("VITE_STATE_DIR"),
};
