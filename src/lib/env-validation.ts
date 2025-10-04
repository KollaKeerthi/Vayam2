// Environment variables validation for production
export function validateEnvVars() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'REDIS_URL',
    'SENDER_EMAIL',
    'SENDER_PASS'
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure all environment variables are set before starting the application.'
    );
  }

  // Validate URLs
  if (process.env.NEXTAUTH_URL && !isValidUrl(process.env.NEXTAUTH_URL)) {
    throw new Error('NEXTAUTH_URL must be a valid URL');
  }

  if (process.env.DATABASE_URL && !isValidUrl(process.env.DATABASE_URL)) {
    throw new Error('DATABASE_URL must be a valid URL');
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Validate environment variables in production
if (process.env.NODE_ENV === 'production') {
  validateEnvVars();
}