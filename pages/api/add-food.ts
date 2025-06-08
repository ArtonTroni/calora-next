import type { NextApiRequest, NextApiResponse } from 'next';

// Temporäre Datenspeicherung (wie im Express Original)
let totalCalories = 0;
let recentItems: CalorieItem[] = [];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CalorieData>
) {
  if (req.method === 'POST') {
    const { food }: AddFoodRequest = req.body;

    // Simuliere Kalorienberechnung (später durch echte KI ersetzen)
    const calories = 100;
    totalCalories += calories;

    // Füge den Eintrag zur Liste hinzu
    recentItems.push({ name: food, calories });

    res.status(200).json({
      totalCalories,
      recentItems,
      aiText: "Simulierte KI-Antwort"
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}