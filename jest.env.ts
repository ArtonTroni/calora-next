// jest.env.ts
// Umgebungsvariablen für Tests setzen

// TypeScript-freundliche Variablen-Setzung
(process.env as any).NODE_ENV = 'test';
(process.env as any).NEXTAUTH_URL = 'http://localhost:3000';
(process.env as any).NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';

// MongoDB URI wird dynamisch vom Memory Server gesetzt
if (!process.env.MONGODB_URI) {
  (process.env as any).MONGODB_URI = 'mongodb://localhost:27017/calora_test';
}

console.log('Test-Umgebung konfiguriert');