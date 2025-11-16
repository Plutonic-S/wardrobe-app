// src/lib/db/models/OutfitAssignment.ts

import { Schema, Document, model, models, Types, Model } from 'mongoose';

export interface IOutfitAssignmentDocument extends Document {
  userId: Types.ObjectId;
  outfitId: Types.ObjectId;
  assignedDate: Date;        // Store as start of day UTC
  occasion?: string;         // Optional: Work, Casual, etc.
  isWorn: boolean;
  wornDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOutfitAssignmentModel extends Model<IOutfitAssignmentDocument> {
  getByDateRange(
    userId: Types.ObjectId | string,
    startDate: Date,
    endDate: Date
  ): Promise<IOutfitAssignmentDocument[]>;

  getTodayAndTomorrow(
    userId: Types.ObjectId | string
  ): Promise<{
    today: IOutfitAssignmentDocument | null;
    tomorrow: IOutfitAssignmentDocument | null;
  }>;
}

const outfitAssignmentSchema = new Schema<IOutfitAssignmentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    outfitId: {
      type: Schema.Types.ObjectId,
      ref: 'Outfit',
      required: true,
    },
    assignedDate: {
      type: Date,
      required: true,
      index: true,
      // Store as start of day in local timezone
      set: (date: Date | string) => {
        const d = new Date(date);
        // Set to start of day in local timezone
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
    occasion: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    isWorn: {
      type: Boolean,
      default: false,
    },
    wornDate: Date,
  },
  { timestamps: true }
);

// Compound index for unique constraint
outfitAssignmentSchema.index(
  { userId: 1, assignedDate: 1 },
  { unique: true }
);

// Get assignments for date range (for calendar view)
outfitAssignmentSchema.statics.getByDateRange = async function (
  userId: Types.ObjectId | string,
  startDate: Date,
  endDate: Date
): Promise<IOutfitAssignmentDocument[]> {
  return this.find({
    userId,
    assignedDate: { $gte: startDate, $lte: endDate },
  })
    .populate({
      path: 'outfitId',
      select: 'metadata mode combination',
    })
    .sort({ assignedDate: 1 })
    .lean()
    .exec();
};

// Get today and tomorrow (for mobile/quick view)
outfitAssignmentSchema.statics.getTodayAndTomorrow = async function (
  userId: Types.ObjectId | string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const assignments = await this.find({
    userId,
    assignedDate: { $gte: today, $lt: dayAfter },
  })
    .populate({
      path: 'outfitId',
      select: 'metadata mode combination',
    })
    .sort({ assignedDate: 1 })
    .lean()
    .exec();

  return {
    today: assignments.find((a: IOutfitAssignmentDocument) =>
      a.assignedDate.getTime() === today.getTime()
    ) || null,
    tomorrow: assignments.find((a: IOutfitAssignmentDocument) =>
      a.assignedDate.getTime() === tomorrow.getTime()
    ) || null,
  };
};

const OutfitAssignment =
  (models.OutfitAssignment as IOutfitAssignmentModel) ||
  model<IOutfitAssignmentDocument, IOutfitAssignmentModel>(
    'OutfitAssignment',
    outfitAssignmentSchema
  );

export default OutfitAssignment;
