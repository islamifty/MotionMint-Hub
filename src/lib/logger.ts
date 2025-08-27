import fs from 'fs/promises';
import path from 'path';

// Use the /tmp directory for logs, as it's writable in serverless environments.
const logFilePath = path.join('/tmp', 'app-logs.log');

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

async function writeLog(level: LogLevel, message: string, data?: object) {
  try {
    const timestamp = new Date().toISOString();
    const dataString = data ? `\n---DATA---\n${JSON.stringify(data, null, 2)}\n---END DATA---` : '';
    const logEntry = `${timestamp} [${level}] - ${message}${dataString}\n\n`;
    await fs.appendFile(logFilePath, logEntry, 'utf8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

export const logger = {
  info: (message: string, data?: object) => writeLog('INFO', message, data),
  warn: (message: string, data?: object) => writeLog('WARN', message, data),
  error: (message: string, data?: object) => writeLog('ERROR', message, data),
};

export async function readLogs(): Promise<string> {
  try {
    // Ensure log file exists
    await fs.access(logFilePath).catch(async () => {
        await fs.writeFile(logFilePath, '', 'utf8');
    });
    return await fs.readFile(logFilePath, 'utf8');
  } catch (error) {
    console.error('Failed to read log file:', error);
    return 'Could not read log file.';
  }
}

export async function clearLogsFile(): Promise<void> {
    try {
        await fs.writeFile(logFilePath, '', 'utf8');
    } catch (error) {
        console.error('Failed to clear log file:', error);
        throw new Error('Could not clear log file.');
    }
}
