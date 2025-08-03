// __tests__/api/food-entries.test.js
import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/food-entries/index'
import { User, FoodEntry } from '../../models'
import connectDB from '../../lib/mongodb'

// Mock the database connection
jest.mock('../../lib/mongodb')

describe('/api/food-entries API', () => {
  let testUser

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      username: 'test_user',
      email: 'test@example.com',
      age: 25,
      gender: 'female',
      weight: 60,
      height: 165,
      activityLevel: 1.55,
      maintenanceCalories: 1800,
      isActive: true
    })
  })

  describe('POST /api/food-entries', () => {
    test('should create a new food entry', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          foodText: 'Pizza Margherita',
          meal: 'dinner'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      
      expect(data).toHaveProperty('id')
      expect(data.foodText).toBe('Pizza Margherita')
      expect(data.meal).toBe('dinner')
      expect(data.aiAnalysis).toHaveProperty('calories')
      expect(data.aiAnalysis.calories).toBeGreaterThan(0)
    })

    test('should return 400 for empty foodText', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          foodText: '',
          meal: 'snack'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Food text is required')
    })

    test('should return 400 for too long foodText', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          foodText: 'a'.repeat(501), // Over 500 chars
          meal: 'snack'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Food text too long')
    })

    test('should handle AI analysis correctly for known foods', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          foodText: 'Pasta mit Tomatensauce',
          meal: 'lunch'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      
      expect(data.aiAnalysis.calories).toBe(520) // Known pasta calories
      expect(data.aiAnalysis.ingredients).toContain('pasta')
      expect(data.aiAnalysis.confidence).toBe(0.85)
    })
  })

  describe('GET /api/food-entries', () => {
    beforeEach(async () => {
      // Create test food entries
      await FoodEntry.create({
        userId: testUser._id,
        foodText: 'Test Food 1',
        aiAnalysis: {
          calories: 100,
          protein: 5,
          carbs: 15,
          fat: 3,
          sugar: 5,
          confidence: 0.8,
          ingredients: ['test']
        },
        meal: 'breakfast'
      })

      await FoodEntry.create({
        userId: testUser._id,
        foodText: 'Test Food 2',
        aiAnalysis: {
          calories: 200,
          protein: 10,
          carbs: 30,
          fat: 6,
          sugar: 10,
          confidence: 0.9,
          ingredients: ['test2']
        },
        meal: 'lunch'
      })
    })

    test('should return all food entries with totals', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          userId: testUser._id.toString()
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      
      expect(data.entries).toHaveLength(2)
      expect(data.totalCalories).toBe(300) // 100 + 200
      expect(data.entryCount).toBe(2)
    })

    test('should filter by meal type', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          userId: testUser._id.toString(),
          meal: 'breakfast'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      
      expect(data.entries).toHaveLength(1)
      expect(data.entries[0].meal).toBe('breakfast')
      expect(data.totalCalories).toBe(100)
    })

    test('should handle pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          userId: testUser._id.toString(),
          limit: '1',
          offset: '0'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      
      expect(data.entries).toHaveLength(1)
    })
  })

  describe('Method not allowed', () => {
    test('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Method not allowed')
      expect(data.allowed).toContain('GET')
      expect(data.allowed).toContain('POST')
    })
  })
})