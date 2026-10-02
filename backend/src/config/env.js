import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '' || value === null) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

/** Port must be a usable TCP port; ignore empty/0/garbage and fall back. */
function parsePort(name, fallback) {
  const raw = process.env[name];
  const port = Number(raw);
  if (raw === undefined || raw === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    return fallback;
  }
  return port;
}

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: parsePort('PORT', 3001),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/devclash'),
  jwtSecret: required('JWT_SECRET', nodeEnv === 'production' ? undefined : 'devclash-dev-secret-do-not-use-in-prod'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigins: (process.env.CLIENT_URL ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

if (nodeEnv === 'production' && env.jwtSecret === 'devclash-dev-secret-do-not-use-in-prod') {
  throw new Error('JWT_SECRET must be set to a strong value in production');
}
