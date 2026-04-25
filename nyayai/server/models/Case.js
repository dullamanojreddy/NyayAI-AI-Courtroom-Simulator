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

const caseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    sessionId: {
      type: String,
      trim: true
    },
    caseTitle: {
      type: String,
      trim: true
    },
    caseType: {
      type: String,
      trim: true
    },
    caseDescription: {
      type: String
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
    totalScore: {
      type: Number,
      default: 0
    },
    verdict: {
      type: Schema.Types.Mixed
    },
    result: {
      type: String
    },
    status: {
      type: String,
      default: "completed"
    },
    completedAt: Date,
    aiSummary: String,
    laws: {
      type: [String],
      default: []
    },
    schemes: {
      type: [String],
      default: []
    },
    arguments: {
      userSide: {
        type: [String],
        default: []
      },
      opponentSide: {
        type: [String],
        default: []
      }
    }
  },
  { timestamps: true }
);

caseSchema.index({ userId: 1, createdAt: -1 });
caseSchema.index({ sessionId: 1 });

module.exports = models.Case || model("Case", caseSchema);
