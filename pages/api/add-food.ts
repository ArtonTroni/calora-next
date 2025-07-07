import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CalorieData>
) {
  if (req.method === 'POST') {
    try {
      const { food }: AddFoodRequest = req.body;

      // Weiterleitung an neuen REST API Endpoint
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/food-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodText: food,
          meal: 'snack' // Default für Homepage
        })
      });

      if (!response.ok) {
        throw new Error(`Food API error: ${response.status}`);
      }

      const newEntry = await response.json();

      // Aktuelle Einträge des Users abrufen (für Kompatibilität mit Frontend)
      const entriesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/food-entries?date=today`);
      
      if (!entriesResponse.ok) {
        throw new Error(`Entries API error: ${entriesResponse.status}`);
      }

      const { entries, totalCalories } = await entriesResponse.json();

      // Format für bestehende Homepage (Kompatibilität)
      const recentItems: CalorieItem[] = entries.map((entry: any) => ({
        name: entry.foodText,
        calories: entry.aiAnalysis.calories
      }));

      // AI-Text für Homepage
      const aiText = generateAIResponse(totalCalories, newEntry.aiAnalysis.calories);

      res.status(200).json({
        totalCalories,
        recentItems,
        aiText
      });

    } catch (error) {
      console.error('Error in add-food API:', error);
      res.status(500).json({
        totalCalories: 0,
        recentItems: [],
        aiText: "Fehler beim Speichern. Versuche es nochmal!"
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// AI-Response Generator für Homepage
function generateAIResponse(totalCalories: number, newEntryCalories: number): string {
  const responses = [
    `Gut! ${newEntryCalories} kcal hinzugefügt. Du hast heute schon ${totalCalories} kcal gegessen.`,
    `${newEntryCalories} kcal eingetragen! Dein Tagessaldo: ${totalCalories} kcal.`,
    `Prima! +${newEntryCalories} kcal. Heute insgesamt: ${totalCalories} kcal.`
  ];

  // Empfehlungen basierend auf Kalorien
  if (totalCalories > 2500) {
    responses.push("Du bist schon über deinem Tagesbedarf. Vielleicht etwas Sport? 🏃‍♀️");
  } else if (totalCalories < 1000) {
    responses.push("Du solltest noch etwas mehr essen heute! 🥗");
  } else if (totalCalories > 1500 && totalCalories < 2200) {
    responses.push("Perfekt im grünen Bereich! Weiter so! 💚");
  }

  return responses[Math.floor(Math.random() * responses.length)];
}