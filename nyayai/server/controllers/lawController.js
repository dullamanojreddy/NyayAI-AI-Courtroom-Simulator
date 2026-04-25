const Law = require('../models/Law');

exports.list = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = 1000;
    const skip = (page - 1) * limit;

    const [total, laws] = await Promise.all([
      Law.countDocuments(),
      Law.find().sort({ sectionId: 1 }).skip(skip).limit(limit)
    ]);

    return res.json({ page, limit, total, pages: Math.ceil(total / limit), laws });
  } catch (error) {
    return res.status(500).json({ message: 'Law list failed', error: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const category = req.query.category ? String(req.query.category) : '';

    const query = {};
    if (q) {
      query.$or = [
        { sectionId: { $regex: q, $options: 'i' } },
        { sectionNumber: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { fullText: { $regex: q, $options: 'i' } },
        { actName: { $regex: q, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }

    const laws = await Law.find(query).limit(100);
    return res.json(laws);
  } catch (error) {
    return res.status(500).json({ message: 'Law search failed', error: error.message });
  }
};

exports.getBySectionId = async (req, res) => {
  try {
    const sectionId = decodeURIComponent(req.params.sectionId);
    const law = await Law.findOne({ sectionId });
    if (!law) {
      return res.status(404).json({ message: 'Law not found' });
    }
    return res.json(law);
  } catch (error) {
    return res.status(500).json({ message: 'Law fetch failed', error: error.message });
  }
};
