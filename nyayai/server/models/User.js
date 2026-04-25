const { Schema, model, models } = require("mongoose");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      min: 0
    },
    gender: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    income: {
      type: Schema.Types.Mixed
    },
    occupation: {
      type: String,
      trim: true
    },
    lastLogin: Date
  },
  { timestamps: true }
);

module.exports = models.User || model("User", userSchema);
