const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');

exports.getPurchases = async (req, res) => {
  try {
    const { hospital, status } = req.query;
    const filter = {};
    if (hospital) filter.hospital = hospital;
    if (status) filter.status = status;

    const purchases = await Purchase.find(filter)
      .populate('hospital', 'name code')
      .populate('supplier', 'name code')
      .populate('items.medicine', 'name code')
      .populate('createdBy', 'name')
      .sort({ orderDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('hospital')
      .populate('supplier')
      .populate('items.medicine')
      .populate('createdBy', 'name');
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const { hospital, supplier, items, expectedDeliveryDate, notes } = req.body;
    const purchaseOrderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    const purchase = await Purchase.create({
      purchaseOrderNumber,
      hospital,
      supplier,
      items,
      expectedDeliveryDate,
      notes,
      totalAmount,
      status: 'ordered',
      createdBy: req.user._id,
    });

    await purchase.populate('hospital supplier items.medicine');
    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.receivePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    if (purchase.status === 'received') {
      return res.status(400).json({ message: 'Already fully received' });
    }

    const { receivedItems } = req.body; // [{ medicine, quantity, batchNumber, expiryDate }]

    for (const item of receivedItems || purchase.items) {
      const qty = item.receivedQuantity || item.quantity;
      let inv = await Inventory.findOne({
        hospital: purchase.hospital,
        medicine: item.medicine,
      });
      if (!inv) {
        inv = new Inventory({
          hospital: purchase.hospital,
          medicine: item.medicine,
          batches: [],
        });
      }
      inv.batches.push({
        batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
        quantity: qty,
        expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        unitCost: item.unitCost || 0,
        supplier: purchase.supplier,
        receivedDate: new Date(),
        status: 'active',
      });
      await inv.save();

      // Update purchase item
      const pItem = purchase.items.find((i) => i.medicine.toString() === item.medicine.toString());
      if (pItem) pItem.receivedQuantity = (pItem.receivedQuantity || 0) + qty;
    }

    purchase.status = 'received';
    purchase.actualDeliveryDate = new Date();
    await purchase.save();
    await purchase.populate('hospital supplier items.medicine');
    res.json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
