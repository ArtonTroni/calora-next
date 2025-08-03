// __tests__/unit/utils.test.ts
// Einfache Unit Tests ohne Datenbank

describe('Basic Utility Functions', () => {
  
  test('should calculate BMR for female', () => {
    // Given
    const weight = 60; // kg
    const height = 165; // cm
    const age = 25; // years
    const gender = 'female';
    
    // When - Mifflin-St Jeor Formula
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    
    // Then
    expect(bmr).toBe(1439); // 600 + 1031.25 - 125 - 161
    expect(bmr).toBeGreaterThan(1000);
    expect(bmr).toBeLessThan(2000);
  });

  test('should calculate BMR for male', () => {
    // Given
    const weight = 75; // kg
    const height = 180; // cm
    const age = 30; // years
    const gender = 'male';
    
    // When - Mifflin-St Jeor Formula  
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    
    // Then
    expect(bmr).toBe(1730); // 750 + 1125 - 150 + 5
    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2500);
  });

  test('should calculate maintenance calories', () => {
    // Given
    const bmr = 1439;
    const activityLevel = 1.55; // moderately active
    
    // When
    const maintenanceCalories = Math.round(bmr * activityLevel);
    
    // Then
    expect(maintenanceCalories).toBe(2230);
    expect(maintenanceCalories).toBeGreaterThan(bmr);
  });

  test('should format food text properly', () => {
    // Given
    const rawText = '  PIZZA margherita  ';
    
    // When
    const formatted = rawText.trim().toLowerCase();
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    // Then
    expect(formatted).toBe('pizza margherita');
    expect(capitalized).toBe('Pizza margherita');
  });

  test('should validate meal types', () => {
    // Given
    const validMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
    const testMeal = 'breakfast';
    const invalidMeal = 'dessert';
    
    // When & Then
    expect(validMeals.includes(testMeal)).toBe(true);
    expect(validMeals.includes(invalidMeal)).toBe(false);
  });

  test('should calculate percentage of daily calories', () => {
    // Given
    const consumedCalories = 650; // Pizza
    const maintenanceCalories = 2000;
    
    // When
    const percentage = Math.round((consumedCalories / maintenanceCalories) * 100);
    
    // Then
    expect(percentage).toBe(33);
    expect(percentage).toBeGreaterThan(0);
    expect(percentage).toBeLessThan(100);
  });
})