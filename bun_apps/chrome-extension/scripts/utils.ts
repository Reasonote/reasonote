import fs from 'fs';
import path from 'path';

/**
 * Find the root directory containing the .env file
 */
export const findRootDir = () => {
  let currentDir = process.cwd();
  while (!fs.existsSync(path.join(currentDir, '.env'))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error('Could not find root directory with .env file');
    }
    currentDir = parentDir;
  }
  return currentDir;
};

/**
 * Parse a .env file into key-value pairs
 */
export const parseEnvFile = (filePath: string) => {
  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes if present
      envVars[key] = value;
    }
  });
  
  return envVars;
};

/**
 * Get development environment configuration
 */
export const getDevConfig = () => {
  const rootDir = findRootDir();
  const envPath = path.join(rootDir, '.env');
  console.log(`Using environment file: ${envPath}`);
  
  const envVars = parseEnvFile(envPath);

  console.log('envVars', envVars);

  const devConfig = {
    supabase: {
      url: envVars.SUPABASE_URL || 'http://localhost:65432',
      anonKey: envVars.SUPABASE_ANON_KEY || ''
    },
    api: {
      baseUrl: 'http://localhost:3456/api'
    }
  };

  console.log('devConfig', devConfig);
  
  return devConfig;
}; 