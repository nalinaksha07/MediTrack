const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');

exports.getInventory = async (req, res) => {
  try {
    const { hospital, medicine, lowStock, expiringSoon } = req.query;
    const filter = {};
    if (hospital) filter.hospital = hospital;
    if (medicine) filter.medicine = medicine;

    let inventories = await Inventory.find(filter)
      .populate('hospital', 'name code')
      .populate('medicine')
      .populate('batches.supplier', 'name code')
      .sort({ updatedAt: -1 });

    if (lowStock === 'true') {
      inventories = inventories.filter((inv) => {
        const min = inv.medicine?.minStockLevel || 50;
        return inv.totalQuantity <= min;
      });
    }

    if (expiringSoon === 'true') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 90);
      inventories = inventories.filter((inv) =>
        inv.batches.some(
          (b) => b.status === 'active' && new Date(b.expiryDate) <= threshold && b.quantity > 0
        )
      );
    }

    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id)
      .populate('hospital')
      .populate('medicine')
      .populate('batches.supplier');
    if (!inv) return res.status(404).json({ message: 'Inventory not found' });
    res.json(inv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stockIn = async (req, res) => {
  try {
    const { hospital, medicine, batchNumber, quantity, expiryDate, manufactureDate, unitCost, supplier } =
      req.body;

    if (!hospital || !medicine || !batchNumber || !quantity || !expiryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let inv = await Inventory.findOne({ hospital, medicine });
    if (!inv) {
      inv = new Inventory({ hospital, medicine, batches: [] });
    }

    inv.batches.push({
      batchNumber,
      quantity: Number(quantity),
      expiryDate,
      manufactureDate,
      unitCost: unitCost || 0,
      supplier,
      receivedDate: new Date(),
      status: 'active',
    });

    await inv.save();
    await inv.populate('hospital medicine batches.supplier');
    res.status(201).json(inv);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.stockOut = async (req, res) => {
  try {
    const { hospital, medicine, quantity, batchNumber, reason } = req.body;
    if (!hospital || !medicine || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const inv = await Inventory.findOne({ hospital, medicine });
    if (!inv) return res.status(404).json({ message: 'Inventory not found' });

    let remaining = Number(quantity);
    // FEFO: sort by expiry ascending
    const activeBatches = inv.batches
      .filter((b) => b.status === 'active' && b.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (batchNumber) {
      const batch = activeBatches.find((b) => b.batchNumber === batchNumber);
      if (!batch || batch.quantity < remaining) {
        return res.status(400).json({ message: 'Insufficient quantity in specified batch' });
      }
      batch.quantity -= remaining;
      if (batch.quantity === 0) batch.status = 'expired'; // or keep active with 0
      remaining = 0;
    } else {
      for (const batch of activeBatches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        batch.quantity -= deduct;
        remaining -= deduct;
        if (batch.quantity === 0) batch.status = 'expired';
      }
    }

    if (remaining > 0) {
      return res.status(400).json({ message: 'Insufficient total stock' });
    }

    await inv.save();
    await inv.populate('hospital medicine');
    res.json(inv);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { inventoryId, batchId } = req.params;
    const inv = await Inventory.findById(inventoryId);
    if (!inv) return res.status(404).json({ message: 'Inventory not found' });

    const batch = inv.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    Object.assign(batch, req.body);
    await inv.save();
    res.json(inv);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
