const { Schema, model, models } = require("mongoose");

const roundSchema = new Schema(
  {
    roundNumber: Number,
    userArgument: String,
    opposingArgument: String,
    judgeRemark: String,
    score: Number,
    breakdown: Schema.Types.Mixed
  },
  { _id: false }
);

const transcriptSchema = new Schema(
  {
    role: String,
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    role: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const qaPairSchema = new Schema(
  {
    question: String,
    answer: String
  },
  { _id: false }
);

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Case"
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    caseTitle: {
      type: String,
      default: "Untitled Case",
      trim: true
    },
    caseType: {
      type: String,
      default: "GENERAL_DISPUTE",
      trim: true
    },
    applicableLaws: {
      type: [String],
      default: []
    },
    caseDetails: {
      type: Schema.Types.Mixed,
      default: {}
    },
    courtConfig: {
      type: Schema.Types.Mixed,
      default: {}
    },
    rounds: {
      type: [roundSchema],
      default: []
    },
    transcript: {
      type: [transcriptSchema],
      default: []
    },
    caseSummary: {
      type: [String],
      default: []
    },
    qaPairs: {
      type: [qaPairSchema],
      default: []
    },
    messages: {
      type: [messageSchema],
      default: []
    },
    totalScore: {
      type: Number,
      default: 0
    },
    verdict: {
      type: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ["active", "completed", "closed"],
      default: "active"
    },
    completedAt: Date
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = models.Session || model("Session", sessionSchema);
