const { Schema, model, models } = require("mongoose");

const lawSchema = new Schema(
  {
    sectionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    actName: {
      type: String,
      trim: true
    },
    sectionNumber: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    fullText: String,
    plainLanguage: String,
    exampleScenario: String,
    relatedSections: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      trim: true
    },
    penalty: String
  },
  { timestamps: true }
);

lawSchema.index({ sectionNumber: 1, category: 1 });
lawSchema.index({ title: "text", fullText: "text", actName: "text", sectionId: "text" });

module.exports = models.Law || model("Law", lawSchema);
