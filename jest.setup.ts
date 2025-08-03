// jest.setup.ts
import '@testing-library/jest-dom';

// MongoDB Memory Server für Tests
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Vor allen Tests: MongoDB Memory Server starten
beforeAll(async () => {
  // MongoDB Memory Server erstellen
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.0',
    },
  });
  
  // Connection String vom Memory Server bekommen
  const mongoUri = mongoServer.getUri();
  
  // Mit Memory Server verbinden
  await mongoose.connect(mongoUri);
  
  console.log('MongoDB Memory Server gestartet für Tests');
});

// Nach allen Tests: Aufräumen
afterAll(async () => {
  // Alle Verbindungen schließen
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Memory Server stoppen
  await mongoServer.stop();
  
  console.log('MongoDB Memory Server gestoppt');
});

// Vor jedem Test: Datenbank leeren (außer bei spezifischen Tests)
beforeEach(async () => {
  // Nur Collections löschen, die existieren
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Globale Test-Timeouts erhöhen (für Datenbankoperationen)
jest.setTimeout(30000);