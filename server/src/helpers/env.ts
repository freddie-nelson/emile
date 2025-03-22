export interface Environment {
  NODE_ENV: string;
  PORT: number;
  MONITOR_PANEL_USERNAME: string;
  MONITOR_PANEL_PASSWORD: string;
  LOBBY_CHANNEL: string;
  TICKS_PER_SECOND: number;
  TICK_RATE: number;
  PATCHES_PER_SECOND: number;
  PATCH_RATE: number;
}

export const getStringEnv = (key: string): string => {
  const value = process.env[key];
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

export const env: Environment = {
  NODE_ENV: getStringEnv("NODE_ENV"),
  PORT: getIntEnv("PORT"),
  MONITOR_PANEL_USERNAME: getStringEnv("MONITOR_PANEL_USERNAME"),
  MONITOR_PANEL_PASSWORD: getStringEnv("MONITOR_PANEL_PASSWORD"),
  LOBBY_CHANNEL: getStringEnv("LOBBY_CHANNEL"),
  TICKS_PER_SECOND: getIntEnv("TICKS_PER_SECOND"),
  TICK_RATE: 1000 / getIntEnv("TICKS_PER_SECOND"),
  PATCHES_PER_SECOND: getIntEnv("PATCHES_PER_SECOND"),
  PATCH_RATE: 1000 / getIntEnv("PATCHES_PER_SECOND"),
};
