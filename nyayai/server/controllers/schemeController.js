const Scheme = require('../models/Scheme');
const { filterSchemes } = require('../services/schemeEngine');

exports.match = async (req, res) => {
  try {
    const all = await Scheme.find();
    const eligibleSchemes = filterSchemes(all, req.body || {});
    return res.json(eligibleSchemes);
  } catch (error) {
    return res.status(500).json({ message: 'Scheme matching failed', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }
    return res.json(scheme);
  } catch (error) {
    return res.status(500).json({ message: 'Scheme fetch failed', error: error.message });
  }
};
