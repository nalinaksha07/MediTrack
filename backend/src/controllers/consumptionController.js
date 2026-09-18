const Consumption = require('../models/Consumption');
const Inventory = require('../models/Inventory');

exports.getConsumptions = async (req, res) => {
  try {
    const { hospital, medicine, from, to } = req.query;
    const filter = {};
    if (hospital) filter.hospital = hospital;
    if (medicine) filter.medicine = medicine;
    if (from || to) {
      filter.consumptionDate = {};
      if (from) filter.consumptionDate.$gte = new Date(from);
      if (to) filter.consumptionDate.$lte = new Date(to);
    }

    const consumptions = await Consumption.find(filter)
      .populate('hospital', 'name code')
      .populate('medicine', 'name code')
      .populate('recordedBy', 'name')
      .sort({ consumptionDate: -1 })
      .limit(200);
    res.json(consumptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createConsumption = async (req, res) => {
  try {
    const { hospital, medicine, quantity, batchNumber, department, reason, notes } = req.body;

    // Deduct from inventory (FEFO)
    const inv = await Inventory.findOne({ hospital, medicine });
    if (!inv) return res.status(404).json({ message: 'Inventory not found' });

    let remaining = Number(quantity);
    const activeBatches = inv.batches
      .filter((b) => b.status === 'active' && b.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (batchNumber) {
      const batch = activeBatches.find((b) => b.batchNumber === batchNumber);
      if (!batch || batch.quantity < remaining) {
        return res.status(400).json({ message: 'Insufficient quantity in batch' });
      }
      batch.quantity -= remaining;
      remaining = 0;
    } else {
      for (const batch of activeBatches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        batch.quantity -= deduct;
        remaining -= deduct;
      }
    }

    if (remaining > 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await inv.save();

    const consumption = await Consumption.create({
      hospital,
      medicine,
      quantity,
      batchNumber: batchNumber || activeBatches[0]?.batchNumber,
      department,
      reason,
      notes,
      recordedBy: req.user._id,
    });

    // Update medicine average daily consumption (simple moving)
    // In production this would be more sophisticated

    await consumption.populate('hospital medicine recordedBy');
    res.status(201).json(consumption);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
