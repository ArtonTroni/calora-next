import { useState, useEffect } from 'react';
import Head from 'next/head';

// TypeScript Interfaces für API
interface FoodEntry {
  id: string;
  foodText: string;
  aiAnalysis: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    confidence: number;
    ingredients: string[];
  };
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: string;
}

interface CreateFoodEntryData {
  foodText: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function Home() {
  // State für echte Database-Daten
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [foodInput, setFoodInput] = useState('');
  const [lastAnalysis, setLastAnalysis] = useState<string>('');

  // Mock ChatGPT Analyse (nur für UI-Anzeige)
  const generateMockAnalysis = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('pizza')) {
      return 'ChatGPT: "Pizza enthält ca. 650 kcal - viele Kohlenhydrate durch Teig, Fett durch Käse"';
    } else if (lower.includes('apfel') || lower.includes('apple')) {
      return 'ChatGPT: "Apfel hat nur 80 kcal - perfekter gesunder Snack mit Vitaminen!"';
    } else if (lower.includes('müsli') || lower.includes('cereal')) {
      return 'ChatGPT: "Müsli ca. 350 kcal - gute Ballaststoffe, aber achte auf Zuckerzusatz"';
    } else {
      return `ChatGPT: "${input} schätze ich auf 200-250 kcal - für genaue Analyse bräuchte ich mehr Details"`;
    }
  };

  // Echte API: Food Entries von heute laden
  const loadTodaysFoodEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/food-entries?date=today');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      setEntries(data.entries || []);
      setTotalCalories(data.totalCalories || 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      console.error('Fehler beim Laden:', err);
    } finally {
      setLoading(false);
    }
  };

  // Echte API: Neuen Food Entry erstellen
  const createFoodEntry = async (foodText: string, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack') => {
    if (!foodText.trim()) {
      alert('Bitte geben Sie ein Lebensmittel ein!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock-Analyse für UI anzeigen (bevor API-Call)
      const mockAnalysis = generateMockAnalysis(foodText);
      setLastAnalysis(mockAnalysis);

      // Echter API-Call
      const response = await fetch('/api/food-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          foodText: foodText.trim(),
          meal 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      // Erfolg: Form zurücksetzen und Daten neu laden
      setFoodInput('');
      await loadTodaysFoodEntries(); // Neu laden um aktuelle Daten zu zeigen

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
      console.error('Fehler beim Erstellen:', err);
    } finally {
      setLoading(false);
    }
  };

  // Echte API: Food Entry löschen (ohne Bestätigung)
  const deleteFoodEntry = async (entryId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/food-entries/${entryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Bei 404 oder anderen Fehlern
        if (response.status === 404) {
          setError('Eintrag wurde bereits gelöscht');
        } else {
          setError(`Fehler beim Löschen (${response.status})`);
        }
        return;
      }

      // Erfolg: Daten neu laden
      await loadTodaysFoodEntries();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
      console.error('Fehler beim Löschen:', err);
    } finally {
      setLoading(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFoodEntry(foodInput);
  };

  // Initial load: Heutige Einträge laden
  useEffect(() => {
    loadTodaysFoodEntries();
  }, []);

  // Meal-Label Helper
  const getMealLabel = (meal: string) => {
    const mealLabels = {
      breakfast: 'Frühstück',
      lunch: 'Mittagessen', 
      dinner: 'Abendessen',
      snack: 'Snack'
    };
    return mealLabels[meal as keyof typeof mealLabels] || meal;
  };

  // Zeit formatieren
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>Calora - Kalorienzähler</title>
        <meta name="description" content="KI-gestützte Kalorienzählung mit MongoDB" />
      </Head>

      <div className="container">
        <div className="left-panel">
          <h2>Aktuelle Kalorien: <span>{totalCalories}</span> kcal</h2>

          {/* Mock ChatGPT API Box */}
          <div className="ai-box">
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              🤖 ChatGPT API (Mock):
            </p>
            <p>
              {lastAnalysis || 'Gib ein Lebensmittel ein für KI-Analyse...'}
            </p>
          </div>

          {/* Form für Food Entry */}
          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              placeholder="Was hast du gegessen?" 
              required 
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn"
              disabled={loading || !foodInput.trim()}
            >
              {loading ? 'Speichere...' : 'Hinzufügen'}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '0.5rem', 
              marginTop: '1rem',
              borderRadius: '4px',
              fontSize: '0.9em'
            }}>
              ❌ {error}
              <button 
                onClick={() => setError(null)}
                style={{ 
                  marginLeft: '1rem', 
                  background: 'none', 
                  border: 'none', 
                  color: '#721c24', 
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Schließen
              </button>
            </div>
          )}

          {/* Database Status */}
          <div style={{ 
            fontSize: '0.8em', 
            color: '#666', 
            marginTop: '1rem',
            fontStyle: 'italic'
          }}>
            💾 Daten werden in MongoDB gespeichert
            {loading && ' • Lade...'}
          </div>
        </div>

        <div className="right-panel">
          <h3>Heute gegessen ({entries.length}):</h3>
          
          {loading && entries.length === 0 ? (
            <p>Lade heutige Einträge...</p>
          ) : entries.length === 0 ? (
            <p>Noch keine Einträge heute. Füge dein erstes Lebensmittel hinzu!</p>
          ) : (
            <ul>
              {entries.map((entry) => (
                <li key={entry.id} style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  borderLeft: '4px solid #007bff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1em', color: '#333' }}>
                        {entry.foodText}
                      </strong>
                      <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>
                        <span style={{ 
                          backgroundColor: getMealLabel(entry.meal) === 'Frühstück' ? '#fff3cd' :
                                          getMealLabel(entry.meal) === 'Mittagessen' ? '#d4edda' :
                                          getMealLabel(entry.meal) === 'Abendessen' ? '#cce5ff' : '#e2e3e5',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '12px',
                          fontSize: '0.75em',
                          fontWeight: 'bold'
                        }}>
                          {getMealLabel(entry.meal)}
                        </span>
                        <span style={{ marginLeft: '0.5rem' }}>
                          {formatTime(entry.createdAt)}
                        </span>
                      </div>
                      {entry.aiAnalysis.ingredients.length > 0 && (
                        <div style={{ fontSize: '0.75em', color: '#888', marginTop: '0.25rem' }}>
                          🍽️ Zutaten: {entry.aiAnalysis.ingredients.join(', ')}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0.25rem' }}>
                        Protein: {entry.aiAnalysis.protein}g • 
                        Kohlenhydrate: {entry.aiAnalysis.carbs}g • 
                        Fett: {entry.aiAnalysis.fat}g
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      marginLeft: '1rem'
                    }}>
                      <div style={{ 
                        fontSize: '1.1em', 
                        fontWeight: 'bold', 
                        color: '#007bff',
                        marginBottom: '0.5rem'
                      }}>
                        {entry.aiAnalysis.calories} kcal
                      </div>
                      <button
                        onClick={() => deleteFoodEntry(entry.id)}
                        disabled={loading}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75em',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Refresh Button */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              onClick={loadTodaysFoodEntries}
              disabled={loading}
              className="btn"
              style={{ fontSize: '0.9em', padding: '0.5rem 1rem' }}
            >
              {loading ? '🔄 Lade...' : '🔄 Aktualisieren'}
            </button>
          </div>

          {/* Quick Add Buttons */}
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1em', marginBottom: '0.5rem' }}>Schnell hinzufügen:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { food: 'Apfel', meal: 'snack' },
                { food: 'Pizza', meal: 'dinner' },
                { food: 'Müsli', meal: 'breakfast' },
                { food: 'Kaffee', meal: 'snack' }
              ].map(item => (
                <button
                  key={item.food}
                  onClick={async () => {
                    console.log(`Quick-Add: ${item.food}`); // Debug
                    await createFoodEntry(item.food, item.meal as any);
                  }}
                  disabled={loading}
                  className="btn"
                  style={{ 
                    fontSize: '0.8em', 
                    padding: '0.3rem 0.6rem',
                    backgroundColor: '#6c757d',
                    border: 'none'
                  }}
                >
                  + {item.food}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}