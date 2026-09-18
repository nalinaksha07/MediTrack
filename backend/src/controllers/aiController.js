const AIInsight = require('../models/AIInsight');
const { runAnalysis, createTransferFromInsight } = require('../services/aiDecisionEngine');

exports.getInsights = async (req, res) => {
  try {
    const { hospital, status, riskLevel, problem } = req.query;
    const filter = {};
    if (hospital) filter.hospital = hospital;
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (problem) filter.problem = problem;

    const insights = await AIInsight.find(filter)
      .populate('hospital', 'name code')
      .populate('medicine', 'name code category')
      .populate('relatedTransfer')
      .sort({ urgency: -1, riskLevel: -1, createdAt: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.runAIAnalysis = async (req, res) => {
  try {
    const { hospitalId } = req.body;
    const insights = await runAnalysis(hospitalId || null);
    res.json({
      message: `Analysis complete. Generated/updated ${insights.length} insights.`,
      count: insights.length,
      insights,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInsightStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const insight = await AIInsight.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('hospital', 'name')
      .populate('medicine', 'name');
    if (!insight) return res.status(404).json({ message: 'Insight not found' });
    res.json(insight);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createTransferFromAI = async (req, res) => {
  try {
    const transfer = await createTransferFromInsight(req.params.id, req.user._id);
    await transfer.populate('fromHospital toHospital medicine');
    res.status(201).json(transfer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const Inventory = require('../models/Inventory');
    const Hospital = require('../models/Hospital');
    const Medicine = require('../models/Medicine');
    const Transfer = require('../models/Transfer');
    const Purchase = require('../models/Purchase');

    const hospitalCount = await Hospital.countDocuments({ isActive: true });
    const medicineCount = await Medicine.countDocuments({ isActive: true });
    const openInsights = await AIInsight.countDocuments({ status: 'Open' });
    const criticalInsights = await AIInsight.countDocuments({
      status: 'Open',
      riskLevel: { $in: ['Critical', 'High'] },
    });
    const pendingTransfers = await Transfer.countDocuments({
      status: { $in: ['recommended', 'pending', 'approved'] },
    });
    const pendingPurchases = await Purchase.countDocuments({
      status: { $in: ['pending', 'ordered'] },
    });

    // Low stock count
    const inventories = await Inventory.find().populate('medicine');
    const lowStock = inventories.filter(
      (i) => i.totalQuantity <= (i.medicine?.minStockLevel || 50)
    ).length;

    // Expiring soon
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 60);
    let expiringSoon = 0;
    inventories.forEach((inv) => {
      inv.batches.forEach((b) => {
        if (b.status === 'active' && b.quantity > 0 && new Date(b.expiryDate) <= threshold) {
          expiringSoon++;
        }
      });
    });

    res.json({
      hospitalCount,
      medicineCount,
      openInsights,
      criticalInsights,
      pendingTransfers,
      pendingPurchases,
      lowStock,
      expiringSoon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
