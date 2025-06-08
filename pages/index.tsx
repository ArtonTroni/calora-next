import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [recentItems, setRecentItems] = useState<CalorieItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [aiResponse, setAiResponse] = useState('...');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const food = formData.get('food') as string;

    const response = await fetch('/api/add-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food })
    });

    const data: CalorieData = await response.json();
    
    setTotalCalories(data.totalCalories);
    setRecentItems(data.recentItems);
    setAiResponse(data.aiText || "Iss mehr Gemüse!");

    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <Head>
        <title>Calora - Kalorienzähler</title>
        <meta name="description" content="KI-gestützte Kalorienzählung" />
      </Head>

      <div className="container">
        <div className="left-panel">
          <h2>Aktuelle Kalorien: <span>{totalCalories}</span> kcal</h2>

          <div className="ai-box">
            <p>KI-Empfehlung: <span>{aiResponse}</span></p>
            <button className="btn">Zustimmen</button>
          </div>

          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              name="food"
              placeholder="Was hast du gegessen?" 
              required 
            />
            <button type="submit" className="btn">Hinzufügen</button>
          </form>
        </div>

        <div className="right-panel">
          <h3>Zuletzt hinzugefügt:</h3>
          <ul>
            {recentItems.map((item, index) => (
              <li key={index}>
                {item.name} ({item.calories} kcal)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
