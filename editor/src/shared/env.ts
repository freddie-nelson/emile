export interface Environment {
  NODE_ENV: string;
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
};
