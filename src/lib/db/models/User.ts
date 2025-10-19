import { Schema, Document, model, models } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  role: "user" | "moderator" | "admin" | "superadmin";
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 512,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin", "superadmin"],
      default: "user",
    },
    passwordResetToken: {
      type: String,
      select: false, // Don't return by default
    },
    passwordResetExpires: {
      type: Date,
      select: false, // Don't return by default
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance (unique constraint)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

// Use models to prevent "OverwriteModelError" in development
export const User = models.User || model<IUser>("User", userSchema);
export default User;
