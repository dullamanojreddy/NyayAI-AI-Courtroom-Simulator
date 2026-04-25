const { Schema, model, models } = require("mongoose");

const eligibilityCriteriaSchema = new Schema(
  {
    maxIncome: Number,
    categories: {
      type: [String],
      default: []
    },
    caseTypes: {
      type: [String],
      default: []
    },
    conditions: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const schemeSchema = new Schema(
  {
    schemeName: {
      type: String,
      required: true,
      trim: true
    },
    governmentBody: {
      type: String,
      trim: true
    },
    level: {
      type: String,
      trim: true
    },
    eligibilityCriteria: {
      type: eligibilityCriteriaSchema,
      default: {}
    },
    benefit: String,
    applicationProcess: String,
    deadline: String,
    officialLink: String,
    caseTypes: {
      type: [String],
      default: []
    },
    states: {
      type: [String],
      default: []
    },
    incomeMax: Number,
    categories: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

schemeSchema.index({ schemeName: 1 });
schemeSchema.index({ caseTypes: 1, states: 1 });

module.exports = models.Scheme || model("Scheme", schemeSchema);
