const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    contact: {
      person: String,
      phone: String,
      email: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    deliveryTimeDays: { type: Number, default: 7 }, // average delivery time
    reliabilityScore: { type: Number, default: 80, min: 0, max: 100 },
    medicinesSupplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
