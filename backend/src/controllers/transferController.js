const Transfer = require('../models/Transfer');
const Inventory = require('../models/Inventory');

exports.getTransfers = async (req, res) => {
  try {
    const { hospital, status } = req.query;
    const filter = {};
    if (hospital) {
      filter.$or = [{ fromHospital: hospital }, { toHospital: hospital }];
    }
    if (status) filter.status = status;

    const transfers = await Transfer.find(filter)
      .populate('fromHospital', 'name code')
      .populate('toHospital', 'name code')
      .populate('medicine', 'name code')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromHospital')
      .populate('toHospital')
      .populate('medicine')
      .populate('requestedBy approvedBy');
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { fromHospital, toHospital, medicine, quantity, batchNumber, reason, transportDetails } =
      req.body;

    const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;

    const transfer = await Transfer.create({
      transferNumber,
      fromHospital,
      toHospital,
      medicine,
      quantity,
      batchNumber,
      reason,
      transportDetails,
      status: 'pending',
      requestedBy: req.user._id,
    });

    await transfer.populate('fromHospital toHospital medicine');
    res.status(201).json(transfer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.approveTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'pending' && transfer.status !== 'recommended') {
      return res.status(400).json({ message: 'Cannot approve this transfer' });
    }

    // Reserve stock at source
    const inv = await Inventory.findOne({
      hospital: transfer.fromHospital,
      medicine: transfer.medicine,
    });
    if (!inv || inv.totalQuantity < transfer.quantity) {
      return res.status(400).json({ message: 'Insufficient stock at source hospital' });
    }

    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();
    await transfer.populate('fromHospital toHospital medicine');
    res.json(transfer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'approved' && transfer.status !== 'in_transit') {
      return res.status(400).json({ message: 'Transfer must be approved first' });
    }

    // Deduct from source
    const sourceInv = await Inventory.findOne({
      hospital: transfer.fromHospital,
      medicine: transfer.medicine,
    });
    if (!sourceInv || sourceInv.totalQuantity < transfer.quantity) {
      return res.status(400).json({ message: 'Insufficient stock at source' });
    }

    let remaining = transfer.quantity;
    const batches = sourceInv.batches
      .filter((b) => b.status === 'active' && b.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    let usedBatch = null;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const deduct = Math.min(batch.quantity, remaining);
      batch.quantity -= deduct;
      remaining -= deduct;
      if (!usedBatch) usedBatch = batch;
    }
    await sourceInv.save();

    // Add to destination
    let destInv = await Inventory.findOne({
      hospital: transfer.toHospital,
      medicine: transfer.medicine,
    });
    if (!destInv) {
      destInv = new Inventory({
        hospital: transfer.toHospital,
        medicine: transfer.medicine,
        batches: [],
      });
    }
    destInv.batches.push({
      batchNumber: transfer.batchNumber || usedBatch?.batchNumber || `TRF-${transfer.transferNumber}`,
      quantity: transfer.quantity,
      expiryDate: usedBatch?.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      unitCost: usedBatch?.unitCost || 0,
      receivedDate: new Date(),
      status: 'active',
    });
    await destInv.save();

    transfer.status = 'completed';
    transfer.completedAt = new Date();
    await transfer.save();
    await transfer.populate('fromHospital toHospital medicine');
    res.json(transfer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    res.json(transfer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
