const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const authController = require('../controllers/authController');
const hospitalController = require('../controllers/hospitalController');
const medicineController = require('../controllers/medicineController');
const inventoryController = require('../controllers/inventoryController');
const supplierController = require('../controllers/supplierController');
const purchaseController = require('../controllers/purchaseController');
const consumptionController = require('../controllers/consumptionController');
const transferController = require('../controllers/transferController');
const aiController = require('../controllers/aiController');

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/me', protect, authController.getMe);

// Hospitals
router.get('/hospitals', protect, hospitalController.getHospitals);
router.get('/hospitals/:id', protect, hospitalController.getHospital);
router.post('/hospitals', protect, authorize('admin', 'manager'), hospitalController.createHospital);
router.put('/hospitals/:id', protect, authorize('admin', 'manager'), hospitalController.updateHospital);
router.delete('/hospitals/:id', protect, authorize('admin'), hospitalController.deleteHospital);

// Medicines
router.get('/medicines', protect, medicineController.getMedicines);
router.get('/medicines/:id', protect, medicineController.getMedicine);
router.post('/medicines', protect, authorize('admin', 'manager'), medicineController.createMedicine);
router.put('/medicines/:id', protect, authorize('admin', 'manager'), medicineController.updateMedicine);
router.delete('/medicines/:id', protect, authorize('admin'), medicineController.deleteMedicine);

// Inventory
router.get('/inventory', protect, inventoryController.getInventory);
router.get('/inventory/:id', protect, inventoryController.getInventoryById);
router.post('/inventory/stock-in', protect, authorize('admin', 'manager', 'pharmacist'), inventoryController.stockIn);
router.post('/inventory/stock-out', protect, authorize('admin', 'manager', 'pharmacist'), inventoryController.stockOut);
router.put('/inventory/:inventoryId/batches/:batchId', protect, inventoryController.updateBatch);

// Suppliers
router.get('/suppliers', protect, supplierController.getSuppliers);
router.get('/suppliers/:id', protect, supplierController.getSupplier);
router.post('/suppliers', protect, authorize('admin', 'manager'), supplierController.createSupplier);
router.put('/suppliers/:id', protect, authorize('admin', 'manager'), supplierController.updateSupplier);
router.delete('/suppliers/:id', protect, authorize('admin'), supplierController.deleteSupplier);

// Purchases
router.get('/purchases', protect, purchaseController.getPurchases);
router.get('/purchases/:id', protect, purchaseController.getPurchase);
router.post('/purchases', protect, authorize('admin', 'manager'), purchaseController.createPurchase);
router.post('/purchases/:id/receive', protect, authorize('admin', 'manager', 'pharmacist'), purchaseController.receivePurchase);
router.put('/purchases/:id', protect, authorize('admin', 'manager'), purchaseController.updatePurchase);

// Consumption
router.get('/consumptions', protect, consumptionController.getConsumptions);
router.post('/consumptions', protect, authorize('admin', 'manager', 'pharmacist'), consumptionController.createConsumption);

// Transfers
router.get('/transfers', protect, transferController.getTransfers);
router.get('/transfers/:id', protect, transferController.getTransfer);
router.post('/transfers', protect, authorize('admin', 'manager'), transferController.createTransfer);
router.post('/transfers/:id/approve', protect, authorize('admin', 'manager'), transferController.approveTransfer);
router.post('/transfers/:id/complete', protect, authorize('admin', 'manager'), transferController.completeTransfer);
router.put('/transfers/:id', protect, authorize('admin', 'manager'), transferController.updateTransfer);

// AI
router.get('/ai/insights', protect, aiController.getInsights);
router.post('/ai/analyze', protect, authorize('admin', 'manager'), aiController.runAIAnalysis);
router.put('/ai/insights/:id/status', protect, aiController.updateInsightStatus);
router.post('/ai/insights/:id/create-transfer', protect, authorize('admin', 'manager'), aiController.createTransferFromAI);
router.get('/ai/dashboard-stats', protect, aiController.getDashboardStats);

module.exports = router;
