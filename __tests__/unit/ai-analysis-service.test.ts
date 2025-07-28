// AI Analysis Service als separate Klasse
class AIAnalysisService {
  
  static simulateAIAnalysis(foodText: string) {
    const lowerFood = foodText.toLowerCase();
    
    let calories = 100, protein = 5, carbs = 15, fat = 3, sugar = 5;
    let ingredients: string[] = [];
    let confidence = 0.85;
    
    if (lowerFood.includes('pasta') || lowerFood.includes('nudeln')) {
      calories = 520; protein = 18; carbs = 75; fat = 15; sugar = 8;
      ingredients = ['pasta', 'sauce'];
      confidence = 0.88;
    } else if (lowerFood.includes('pizza')) {
      calories = 650; protein = 25; carbs = 80; fat = 25; sugar = 5;
      ingredients = ['dough', 'cheese', 'sauce'];
      confidence = 0.85;
    } else if (lowerFood.includes('apfel') || lowerFood.includes('apple')) {
      calories = 80; protein = 0.5; carbs = 20; fat = 0; sugar = 15;
      ingredients = ['apple'];
      confidence = 0.95;
    } else if (lowerFood.includes('müsli') || lowerFood.includes('cereal')) {
      calories = 340; protein = 12; carbs = 58; fat = 8; sugar = 22;
      ingredients = ['oats', 'milk'];
      confidence = 0.92;
    } else if (lowerFood.includes('salat') || lowerFood.includes('salad')) {
      calories = 150; protein = 8; carbs = 12; fat = 8; sugar = 6;
      ingredients = ['lettuce', 'vegetables', 'dressing'];
      confidence = 0.78;
    }
    
    return {
      calories, protein, carbs, fat, sugar,
      confidence,
      ingredients
    };
  }

  static validateNutritionData(analysis: any): boolean {
    if (!analysis || typeof analysis !== 'object') return false;
    if (typeof analysis.calories !== 'number' || analysis.calories < 0) return false;
    if (typeof analysis.protein !== 'number' || analysis.protein < 0) return false;
    if (typeof analysis.carbs !== 'number' || analysis.carbs < 0) return false;
    if (typeof analysis.fat !== 'number' || analysis.fat < 0) return false;
    if (typeof analysis.sugar !== 'number' || analysis.sugar < 0) return false;
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) return false;
    if (!Array.isArray(analysis.ingredients)) return false;
    
    return true;
  }

  static calculateMacroPercentages(analysis: any) {
    const totalMacros = analysis.protein + analysis.carbs + analysis.fat;
    if (totalMacros === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round((analysis.protein / totalMacros) * 100),
      carbs: Math.round((analysis.carbs / totalMacros) * 100),
      fat: Math.round((analysis.fat / totalMacros) * 100)
    };
  }
}

describe('AI Analysis Service (Unit Tests)', () => {
  
  describe('simulateAIAnalysis', () => {
    
    test('should analyze pizza correctly', async () => {
      const foodText = 'Pizza Margherita';
      const result = AIAnalysisService.simulateAIAnalysis(foodText);
      
      expect(result.calories).toBe(650);
      expect(result.protein).toBe(25);
      expect(result.carbs).toBe(80);
      expect(result.fat).toBe(25);
      expect(result.sugar).toBe(5);
      expect(result.confidence).toBe(0.85);
      expect(result.ingredients).toEqual(['dough', 'cheese', 'sauce']);
    });

    test('should analyze pasta correctly', async () => {
      const foodText = 'Pasta mit Tomatensauce';
      const result = AIAnalysisService.simulateAIAnalysis(foodText);
      
      expect(result.calories).toBe(520);
      expect(result.protein).toBe(18);
      expect(result.carbs).toBe(75);
      expect(result.ingredients).toEqual(['pasta', 'sauce']);
      expect(result.confidence).toBe(0.88);
    });

    test('should handle multiple keywords', async () => {
      const foodText = 'Große Pizza mit extra Käse';
      const result = AIAnalysisService.simulateAIAnalysis(foodText);
      
      expect(result.calories).toBe(650);
      expect(result.ingredients).toContain('cheese');
    });

    test('should be case insensitive', async () => {
      const variations = ['PIZZA', 'pizza', 'Pizza', 'PiZzA'];
      
      variations.forEach(variation => {
        const result = AIAnalysisService.simulateAIAnalysis(variation);
        expect(result.calories).toBe(650);
        expect(result.ingredients).toContain('dough');
      });
    });

    test('should return default values for unknown food', async () => {
      const unknownFood = 'Geheimnisvolles exotisches Gericht';
      const result = AIAnalysisService.simulateAIAnalysis(unknownFood);
      
      expect(result.calories).toBe(100);
      expect(result.protein).toBe(5);
      expect(result.carbs).toBe(15);
      expect(result.fat).toBe(3);
      expect(result.sugar).toBe(5);
      expect(result.confidence).toBe(0.85);
      expect(result.ingredients).toEqual([]);
    });

    test('should handle empty string', async () => {
      const emptyFood = '';
      const result = AIAnalysisService.simulateAIAnalysis(emptyFood);
      
      expect(result.calories).toBe(100);
      expect(result.confidence).toBe(0.85);
    });
  });

  describe('validateNutritionData', () => {
    
    test('should validate correct nutrition data', async () => {
      const validData = {
        calories: 650,
        protein: 25,
        carbs: 80,
        fat: 25,
        sugar: 5,
        confidence: 0.85,
        ingredients: ['dough', 'cheese']
      };
      
      const isValid = AIAnalysisService.validateNutritionData(validData);
      expect(isValid).toBe(true);
    });

    test('should reject data with negative values', async () => {
      const invalidData = {
        calories: -100, // negative
        protein: 25,
        carbs: 80,
        fat: 25,
        sugar: 5,
        confidence: 0.85,
        ingredients: ['test']
      };
      
      const isValid = AIAnalysisService.validateNutritionData(invalidData);
      expect(isValid).toBe(false);
    });

    test('should reject data with invalid confidence', async () => {
      const invalidData = {
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        sugar: 5,
        confidence: 1.5, // > 1.0
        ingredients: ['test']
      };
      
      const isValid = AIAnalysisService.validateNutritionData(invalidData);
      expect(isValid).toBe(false);
    });

    test('should reject null or undefined data', async () => {
      expect(AIAnalysisService.validateNutritionData(null)).toBe(false);
      expect(AIAnalysisService.validateNutritionData(undefined)).toBe(false);
      expect(AIAnalysisService.validateNutritionData({})).toBe(false);
    });
  });

  describe('calculateMacroPercentages', () => {
    
    test('should calculate macro percentages correctly', async () => {
      const analysis = {
        protein: 25,  // 25g
        carbs: 80,    // 80g  
        fat: 25       // 25g - total: 130g
      };
      
      const percentages = AIAnalysisService.calculateMacroPercentages(analysis);
      
      expect(percentages.protein).toBe(19); // 25/130 ≈ 19%
      expect(percentages.carbs).toBe(62);   // 80/130 ≈ 62%
      expect(percentages.fat).toBe(19);     // 25/130 ≈ 19%
      
      const total = percentages.protein + percentages.carbs + percentages.fat;
      expect(total).toBe(100);
    });

    test('should handle zero macros', async () => {
      const analysis = {
        protein: 0,
        carbs: 0,
        fat: 0
      };
      
      const percentages = AIAnalysisService.calculateMacroPercentages(analysis);
      
      expect(percentages.protein).toBe(0);
      expect(percentages.carbs).toBe(0);
      expect(percentages.fat).toBe(0);
    });

    test('should handle single macro type', async () => {
      const analysis = {
        protein: 0,
        carbs: 100,
        fat: 0
      };
      
      const percentages = AIAnalysisService.calculateMacroPercentages(analysis);
      
      expect(percentages.protein).toBe(0);
      expect(percentages.carbs).toBe(100);
      expect(percentages.fat).toBe(0);
    });
  });
});