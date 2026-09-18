require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Medicine = require('../src/models/Medicine');
const Supplier = require('../src/models/Supplier');
const Inventory = require('../src/models/Inventory');
const Purchase = require('../src/models/Purchase');
const Consumption = require('../src/models/Consumption');
const Transfer = require('../src/models/Transfer');
const AIInsight = require('../src/models/AIInsight');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding');
};

const seed = async () => {
  try {
    await connectDB();

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Medicine.deleteMany({}),
      Supplier.deleteMany({}),
      Inventory.deleteMany({}),
      Purchase.deleteMany({}),
      Consumption.deleteMany({}),
      Transfer.deleteMany({}),
      AIInsight.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Hospitals
    const hospitals = await Hospital.insertMany([
      {
        name: 'City General Hospital',
        code: 'CGH',
        address: { street: '12 MG Road', city: 'Mumbai', state: 'Maharashtra', zip: '400001', country: 'India' },
        contact: { phone: '+91-22-2345-6789', email: 'admin@citygeneral.in' },
        location: { type: 'Point', coordinates: [72.8777, 19.076] },
        capacity: 800,
      },
      {
        name: 'Metro Care Medical Center',
        code: 'MCMC',
        address: { street: '45 Ring Road', city: 'Delhi', state: 'Delhi', zip: '110001', country: 'India' },
        contact: { phone: '+91-11-4567-8901', email: 'info@metrocare.in' },
        location: { type: 'Point', coordinates: [77.209, 28.6139] },
        capacity: 600,
      },
      {
        name: 'Sunrise Specialty Hospital',
        code: 'SSH',
        address: { street: '88 Lakeside Ave', city: 'Bangalore', state: 'Karnataka', zip: '560001', country: 'India' },
        contact: { phone: '+91-80-9876-5432', email: 'contact@sunrisehosp.in' },
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        capacity: 450,
      },
      {
        name: 'Green Valley Community Hospital',
        code: 'GVCH',
        address: { street: '3 Park Street', city: 'Pune', state: 'Maharashtra', zip: '411001', country: 'India' },
        contact: { phone: '+91-20-1234-5678', email: 'hello@greenvalley.in' },
        location: { type: 'Point', coordinates: [73.8567, 18.5204] },
        capacity: 300,
      },
    ]);
    console.log(`Created ${hospitals.length} hospitals`);

    // Medicines
    const medicines = await Medicine.insertMany([
      { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', code: 'PARA500', category: 'Antipyretic', unit: 'tablets', minStockLevel: 200, maxStockLevel: 2000, reorderPoint: 400, averageDailyConsumption: 45 },
      { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', code: 'AMOX250', category: 'Antibiotic', unit: 'capsules', minStockLevel: 150, maxStockLevel: 1500, reorderPoint: 300, averageDailyConsumption: 30 },
      { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', code: 'IBU400', category: 'Analgesic', unit: 'tablets', minStockLevel: 100, maxStockLevel: 1000, reorderPoint: 200, averageDailyConsumption: 25 },
      { name: 'Insulin Glargine', genericName: 'Insulin Glargine', code: 'INSUGLA', category: 'Diabetes', unit: 'vials', minStockLevel: 20, maxStockLevel: 100, reorderPoint: 40, averageDailyConsumption: 8 },
      { name: 'Amlodipine 5mg', genericName: 'Amlodipine', code: 'AMLO5', category: 'Cardiac', unit: 'tablets', minStockLevel: 100, maxStockLevel: 800, reorderPoint: 200, averageDailyConsumption: 20 },
      { name: 'Salbutamol Inhaler', genericName: 'Salbutamol', code: 'SALB100', category: 'Respiratory', unit: 'inhalers', minStockLevel: 30, maxStockLevel: 200, reorderPoint: 50, averageDailyConsumption: 6 },
      { name: 'Oseltamivir 75mg', genericName: 'Oseltamivir', code: 'OSEL75', category: 'Antiviral', unit: 'capsules', minStockLevel: 50, maxStockLevel: 400, reorderPoint: 100, averageDailyConsumption: 10 },
      { name: 'COVID-19 Vaccine', genericName: 'mRNA Vaccine', code: 'COVVAX', category: 'Vaccine', unit: 'doses', minStockLevel: 100, maxStockLevel: 1000, reorderPoint: 200, averageDailyConsumption: 15 },
      { name: 'Metformin 500mg', genericName: 'Metformin', code: 'MET500', category: 'Diabetes', unit: 'tablets', minStockLevel: 200, maxStockLevel: 2000, reorderPoint: 400, averageDailyConsumption: 50 },
      { name: 'Azithromycin 500mg', genericName: 'Azithromycin', code: 'AZITH500', category: 'Antibiotic', unit: 'tablets', minStockLevel: 80, maxStockLevel: 600, reorderPoint: 150, averageDailyConsumption: 12 },
    ]);
    console.log(`Created ${medicines.length} medicines`);

    // Suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'MedSupply India Pvt Ltd',
        code: 'MSI',
        contact: { person: 'Rajesh Kumar', phone: '+91-98765-43210', email: 'orders@medsupply.in' },
        address: { city: 'Mumbai', state: 'Maharashtra' },
        deliveryTimeDays: 5,
        reliabilityScore: 92,
        medicinesSupplied: medicines.slice(0, 6).map((m) => m._id),
      },
      {
        name: 'PharmaLink Distributors',
        code: 'PLD',
        contact: { person: 'Priya Sharma', phone: '+91-87654-32109', email: 'sales@pharmalink.in' },
        address: { city: 'Delhi', state: 'Delhi' },
        deliveryTimeDays: 7,
        reliabilityScore: 85,
        medicinesSupplied: medicines.slice(3, 9).map((m) => m._id),
      },
      {
        name: 'HealthFirst Logistics',
        code: 'HFL',
        contact: { person: 'Amit Patel', phone: '+91-76543-21098', email: 'support@healthfirst.in' },
        address: { city: 'Bangalore', state: 'Karnataka' },
        deliveryTimeDays: 4,
        reliabilityScore: 95,
        medicinesSupplied: medicines.map((m) => m._id),
      },
      {
        name: 'Apollo Pharma Wholesale',
        code: 'APW',
        contact: { person: 'Sneha Reddy', phone: '+91-65432-10987', email: 'wholesale@apollopharma.in' },
        address: { city: 'Hyderabad', state: 'Telangana' },
        deliveryTimeDays: 6,
        reliabilityScore: 88,
        medicinesSupplied: medicines.slice(0, 5).map((m) => m._id),
      },
    ]);
    console.log(`Created ${suppliers.length} suppliers`);

    // Users
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@meditrack.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        hospital: hospitals[0]._id,
      },
      {
        name: 'Dr. Anita Desai',
        email: 'manager@meditrack.com',
        password: await bcrypt.hash('manager123', 10),
        role: 'manager',
        hospital: hospitals[0]._id,
      },
      {
        name: 'Rahul Mehta',
        email: 'pharmacist@meditrack.com',
        password: await bcrypt.hash('pharma123', 10),
        role: 'pharmacist',
        hospital: hospitals[0]._id,
      },
      {
        name: 'Suresh Nair',
        email: 'manager2@meditrack.com',
        password: await bcrypt.hash('manager123', 10),
        role: 'manager',
        hospital: hospitals[1]._id,
      },
    ]);
    console.log(`Created ${users.length} users`);

    // Inventory with batches (some near expiry, some low stock, some overstock)
    const now = new Date();
    const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    const inventoryData = [
      // CGH - City General
      {
        hospital: hospitals[0]._id,
        medicine: medicines[0]._id, // Paracetamol - good stock
        batches: [
          { batchNumber: 'PARA-CGH-001', quantity: 800, expiryDate: addDays(180), unitCost: 2, supplier: suppliers[0]._id, status: 'active' },
          { batchNumber: 'PARA-CGH-002', quantity: 400, expiryDate: addDays(25), unitCost: 2.1, supplier: suppliers[0]._id, status: 'active' }, // near expiry
        ],
      },
      {
        hospital: hospitals[0]._id,
        medicine: medicines[1]._id, // Amoxicillin - low stock
        batches: [
          { batchNumber: 'AMOX-CGH-001', quantity: 80, expiryDate: addDays(120), unitCost: 8, supplier: suppliers[0]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[0]._id,
        medicine: medicines[3]._id, // Insulin - critical low
        batches: [
          { batchNumber: 'INSU-CGH-001', quantity: 12, expiryDate: addDays(90), unitCost: 450, supplier: suppliers[2]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[0]._id,
        medicine: medicines[8]._id, // Metformin - overstock
        batches: [
          { batchNumber: 'MET-CGH-001', quantity: 3500, expiryDate: addDays(300), unitCost: 1.5, supplier: suppliers[0]._id, status: 'active' },
        ],
      },
      // MCMC - Metro Care
      {
        hospital: hospitals[1]._id,
        medicine: medicines[0]._id, // Paracetamol - low
        batches: [
          { batchNumber: 'PARA-MCMC-001', quantity: 150, expiryDate: addDays(100), unitCost: 2, supplier: suppliers[1]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[1]._id,
        medicine: medicines[1]._id, // Amoxicillin - surplus
        batches: [
          { batchNumber: 'AMOX-MCMC-001', quantity: 1200, expiryDate: addDays(200), unitCost: 7.5, supplier: suppliers[1]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[1]._id,
        medicine: medicines[3]._id, // Insulin - good
        batches: [
          { batchNumber: 'INSU-MCMC-001', quantity: 60, expiryDate: addDays(150), unitCost: 440, supplier: suppliers[2]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[1]._id,
        medicine: medicines[4]._id, // Amlodipine
        batches: [
          { batchNumber: 'AMLO-MCMC-001', quantity: 350, expiryDate: addDays(40), unitCost: 3, supplier: suppliers[1]._id, status: 'active' }, // near expiry
        ],
      },
      // SSH - Sunrise
      {
        hospital: hospitals[2]._id,
        medicine: medicines[0]._id,
        batches: [
          { batchNumber: 'PARA-SSH-001', quantity: 600, expiryDate: addDays(200), unitCost: 2, supplier: suppliers[2]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[2]._id,
        medicine: medicines[5]._id, // Salbutamol - low
        batches: [
          { batchNumber: 'SALB-SSH-001', quantity: 18, expiryDate: addDays(80), unitCost: 120, supplier: suppliers[2]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[2]._id,
        medicine: medicines[6]._id, // Oseltamivir - near expiry
        batches: [
          { batchNumber: 'OSEL-SSH-001', quantity: 90, expiryDate: addDays(20), unitCost: 35, supplier: suppliers[2]._id, status: 'active' },
        ],
      },
      // GVCH
      {
        hospital: hospitals[3]._id,
        medicine: medicines[2]._id, // Ibuprofen
        batches: [
          { batchNumber: 'IBU-GVCH-001', quantity: 500, expiryDate: addDays(150), unitCost: 4, supplier: suppliers[0]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[3]._id,
        medicine: medicines[7]._id, // Vaccine
        batches: [
          { batchNumber: 'COV-GVCH-001', quantity: 250, expiryDate: addDays(45), unitCost: 250, supplier: suppliers[2]._id, status: 'active' },
        ],
      },
      {
        hospital: hospitals[3]._id,
        medicine: medicines[9]._id, // Azithromycin - low
        batches: [
          { batchNumber: 'AZI-GVCH-001', quantity: 45, expiryDate: addDays(100), unitCost: 15, supplier: suppliers[3]._id, status: 'active' },
        ],
      },
    ];

    for (const data of inventoryData) {
      const inv = new Inventory(data);
      await inv.save();
    }
    console.log(`Created ${inventoryData.length} inventory records`);

    // Sample consumptions
    const consumptions = [];
    for (let i = 0; i < 30; i++) {
      const h = hospitals[i % 4];
      const m = medicines[i % 10];
      consumptions.push({
        hospital: h._id,
        medicine: m._id,
        quantity: Math.floor(Math.random() * 20) + 5,
        consumptionDate: addDays(-Math.floor(Math.random() * 30)),
        department: ['General', 'ICU', 'Emergency', 'OPD'][i % 4],
        reason: 'patient_use',
        recordedBy: users[0]._id,
      });
    }
    await Consumption.insertMany(consumptions);
    console.log(`Created ${consumptions.length} consumption records`);

    // Sample purchases
    await Purchase.create({
      purchaseOrderNumber: 'PO-SEED001',
      hospital: hospitals[0]._id,
      supplier: suppliers[0]._id,
      items: [
        { medicine: medicines[1]._id, quantity: 500, unitCost: 8, batchNumber: 'AMOX-NEW-001', expiryDate: addDays(365) },
      ],
      orderDate: addDays(-5),
      expectedDeliveryDate: addDays(2),
      status: 'ordered',
      totalAmount: 4000,
      createdBy: users[1]._id,
    });

    console.log('Seed completed successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Admin:      admin@meditrack.com / admin123');
    console.log('Manager:    manager@meditrack.com / manager123');
    console.log('Pharmacist: pharmacist@meditrack.com / pharma123');
    console.log('Manager 2:  manager2@meditrack.com / manager123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
