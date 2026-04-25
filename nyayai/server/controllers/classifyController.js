const { classifyCase } = require('../services/classifyEngine');

exports.classify = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text is required' });
    const result = classifyCase(text);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Classification failed', error: error.message });
  }
};