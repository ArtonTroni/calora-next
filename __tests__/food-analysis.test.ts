describe('AI Food Analysis', () => {
  
  function simulateAIAnalysis(foodText: string) {
    const lowerFood = foodText.toLowerCase();
    
    let calories = 100, protein = 5, carbs = 15, fat = 3, sugar = 5;
    let ingredients: string[] = [];
    
    if (lowerFood.includes('pasta') || lowerFood.includes('nudeln')) {
      calories = 520; protein = 18; carbs = 75; fat = 15; sugar = 8;
      ingredients = ['pasta', 'sauce'];
    } else if (lowerFood.includes('pizza')) {
      calories = 650; protein = 25; carbs = 80; fat = 25; sugar = 5;
      ingredients = ['dough', 'cheese', 'sauce'];
    } else if (lowerFood.includes('apfel') || lowerFood.includes('apple')) {
      calories = 80; protein = 0.5; carbs = 20; fat = 0; sugar = 15;
      ingredients = ['apple'];
    }
    
    return {
      calories, protein, carbs, fat, sugar,
      confidence: 0.85,
      ingredients
    };
  }

  test('should analyze pizza correctly', () => {
    const foodText = 'Pizza Margherita';
    const result = simulateAIAnalysis(foodText);
    
    expect(result.calories).toBe(650);
    expect(result.protein).toBe(25);
    expect(result.ingredients).toContain('dough');
    expect(result.ingredients).toContain('cheese');
    expect(result.confidence).toBe(0.85);
  });

  test('should analyze pasta correctly', () => {
    const foodText = 'Pasta mit Tomatensauce';
    const result = simulateAIAnalysis(foodText);
    
    expect(result.calories).toBe(520);
    expect(result.protein).toBe(18);
    expect(result.carbs).toBe(75);
    expect(result.ingredients).toEqual(['pasta', 'sauce']);
  });

  test('should analyze apple correctly', () => {
    const foodText = 'Grüner Apfel';
    const result = simulateAIAnalysis(foodText);
    
    expect(result.calories).toBe(80);
    expect(result.protein).toBe(0.5);
    expect(result.fat).toBe(0);
    expect(result.ingredients).toContain('apple');
  });

  test('should use default values for unknown food', () => {
    const foodText = 'Mysteriöses Essen';
    const result = simulateAIAnalysis(foodText);
    
    expect(result.calories).toBe(100);
    expect(result.protein).toBe(5);
    expect(result.carbs).toBe(15);
    expect(result.fat).toBe(3);
    expect(result.sugar).toBe(5);
  });

  test('should be case insensitive', () => {
    const foodText1 = 'PIZZA';
    const foodText2 = 'pizza';
    const foodText3 = 'PiZzA';
    
    const result1 = simulateAIAnalysis(foodText1);
    const result2 = simulateAIAnalysis(foodText2);
    const result3 = simulateAIAnalysis(foodText3);
    
    expect(result1.calories).toBe(result2.calories);
    expect(result2.calories).toBe(result3.calories);
  });
});