'use client';

import { useState } from 'react';
import Head from 'next/head';

export default function Maintain() {
  const [result, setResult] = useState<string>('Bitte gib deine Daten ein.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const age = parseInt(formData.get('age') as string);
    const height = parseFloat(formData.get('height') as string);
    const weight = parseFloat(formData.get('weight') as string);
    const gender = formData.get('gender') as string;
    const activity = parseFloat(formData.get('activity') as string);

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const maintenance = Math.round(bmr * activity);
    setResult(`Dein täglicher Maintenance-Kalorienbedarf beträgt ca. ${maintenance} kcal.`);
  };

  return (
    <>
      <Head>
        <title>Maintenance Kalorien - Calora</title>
      </Head>

      <div className="maintain-container">
        <div className="maintain-header">
          <h1>Maintenance-Kalorien berechnen</h1>
          <p className="subtitle">Berechne deinen täglichen Erhaltungskalorienbedarf</p>
        </div>

        <div className="maintain-content">
          <div className="left-panel">
            <h2>Deine Daten eingeben</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="age">Alter (Jahre)</label>
                <input type="number" name="age" placeholder="z.B. 25" required />
              </div>

              <div className="input-group">
                <label htmlFor="height">Größe (cm)</label>
                <input type="number" name="height" placeholder="z.B. 175" required />
              </div>

              <div className="input-group">
                <label htmlFor="weight">Gewicht (kg)</label>
                <input type="number" name="weight" placeholder="z.B. 70" required />
              </div>

              <div className="input-group">
                <label htmlFor="gender">Geschlecht</label>
                <select name="gender" required>
                  <option value="">Bitte wählen...</option>
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="activity">Aktivitätslevel</label>
                <select name="activity" required>
                  <option value="">Bitte wählen...</option>
                  <option value="1.2">Wenig aktiv (Bürojob, wenig Sport)</option>
                  <option value="1.375">Leicht aktiv (1-3x Sport/Woche)</option>
                  <option value="1.55">Mäßig aktiv (3-5x Sport/Woche)</option>
                  <option value="1.725">Sehr aktiv (6-7x Sport/Woche)</option>
                  <option value="1.9">Extrem aktiv (2x täglich Sport)</option>
                </select>
              </div>

              <button type="submit" className="btn calculate-btn">
                🧮 Maintenance-Kalorien berechnen
              </button>
            </form>
          </div>

          <div className="right-panel">
            <div className="result-section">
              <h2>Dein Ergebnis</h2>
              <div className="result-box">
                <div className="result-display">
                  <div className="result-icon">🎯</div>
                  <p>{result}</p>
                </div>
              </div>
            </div>

            <div className="back-link">
              <a href="/" className="btn back-btn">
                🏠 Zurück zur Startseite
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}