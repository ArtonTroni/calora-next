import '@testing-library/jest-dom';

// mongodb memory server für tests
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// vor allen tests: memory server starten
beforeAll(async () => {
  // memory server erstellen
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.0',
    },
  });
  
  // connection string vom memory server
  const mongoUri = mongoServer.getUri();
  
  // mit memory server verbinden
  await mongoose.connect(mongoUri);
  
  console.log('MongoDB Memory Server gestartet');
});

// nach allen tests: aufräumen
afterAll(async () => {
  // verbindungen schließen
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // memory server stoppen
  await mongoServer.stop();
  
  console.log('MongoDB Memory Server gestoppt');
});

// vor jedem test: db leeren (außer bei spezifischen tests)
beforeEach(async () => {
  // nur collections löschen die existieren
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// timeouts erhöhen (für db operationen)
jest.setTimeout(30000);