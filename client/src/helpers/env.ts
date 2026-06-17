export interface Environment {
  NODE_ENV: string;
  GAME_SERVER_URL: string;
  TITLE: string;
  TITLE_PREFIX: string;
  GA_TRACKING_ID: string;
}

export const getStringEnv = (key: string): string => {
  const value = import.meta.env[key];
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
  GAME_SERVER_URL: getStringEnv("VITE_GAME_SERVER_URL"),
  GA_TRACKING_ID: getStringEnv("VITE_GA_TRACKING_ID"),
  TITLE: getStringEnv("VITE_TITLE"),
  TITLE_PREFIX: getStringEnv("VITE_TITLE_PREFIX") + " ",
};
