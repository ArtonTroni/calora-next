import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { FoodEntry } from '@/models';
import { Types } from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  const { id } = req.query;

  // ID Validation
  if (!id || !Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({
      error: 'Invalid food entry ID'
    });
  }

  // DELETE - Food Entry löschen
  if (req.method === 'DELETE') {
    try {
      const deletedEntry = await FoodEntry.findByIdAndDelete(id);

      if (!deletedEntry) {
        return res.status(404).json({
          error: 'Food entry not found'
        });
      }

      return res.status(200).json({
        message: 'Food entry deleted successfully',
        deletedId: id
      });

    } catch (error) {
      console.error('Error deleting food entry:', error);
      return res.status(500).json({
        error: 'Failed to delete food entry'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['DELETE']
  });
}