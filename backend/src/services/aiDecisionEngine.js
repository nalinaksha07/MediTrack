/**
 * MediTrack AI Decision Engine
 * Pipeline: Detect → Predict → Decide → Recommend
 * Rule-based explainable forecasting suitable for hackathon
 */

const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const Consumption = require('../models/Consumption');
const Supplier = require('../models/Supplier');
const Hospital = require('../models/Hospital');
const Transfer = require('../models/Transfer');
const AIInsight = require('../models/AIInsight');

const DAYS_TO_EXPIRY_CRITICAL = 30;
const DAYS_TO_EXPIRY_HIGH = 60;
const DAYS_TO_EXPIRY_MEDIUM = 90;
const STOCKOUT_DAYS_THRESHOLD = 14;
const OVERSTOCK_MULTIPLIER = 2.5;

/**
 * Main entry: run full analysis for a hospital or all
 */
async function runAnalysis(hospitalId = null) {
  const hospitals = hospitalId
    ? [await Hospital.findById(hospitalId)]
    : await Hospital.find({ isActive: true });

  const allInsights = [];

  for (const hospital of hospitals) {
    if (!hospital) continue;
    const insights = await analyzeHospital(hospital);
    allInsights.push(...insights);
  }

  return allInsights;
}

async function analyzeHospital(hospital) {
  const inventories = await Inventory.find({ hospital: hospital._id })
    .populate('medicine')
    .populate('batches.supplier');

  const insights = [];

  for (const inv of inventories) {
    if (!inv.medicine) continue;

    // DETECT
    const detections = detectIssues(inv, hospital);

    for (const detection of detections) {
      // PREDICT
      const prediction = await predict(inv, detection, hospital);

      // DECIDE + RECOMMEND
      const recommendation = await decideAndRecommend(inv, detection, prediction, hospital);

      // Persist insight
      const insight = await AIInsight.findOneAndUpdate(
        {
          hospital: hospital._id,
          medicine: inv.medicine._id,
          problem: detection.problem,
          status: { $in: ['Open', 'Acknowledged'] },
        },
        {
          hospital: hospital._id,
          medicine: inv.medicine._id,
          problem: detection.problem,
          currentStock: inv.totalQuantity,
          prediction: prediction.text,
          riskLevel: detection.riskLevel,
          reason: detection.reason,
          recommendedAction: recommendation.action,
          recommendedQuantity: recommendation.quantity,
          urgency: recommendation.urgency,
          status: 'Open',
          metadata: {
            ...detection.meta,
            ...prediction.meta,
            transferSuggestion: recommendation.transferSuggestion,
            supplierSuggestion: recommendation.supplierSuggestion,
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      insights.push(insight);
    }
  }

  return insights;
}

/**
 * DETECT phase
 */
function detectIssues(inv, hospital) {
  const detections = [];
  const med = inv.medicine;
  const now = new Date();

  // 1. Expiry Risk
  const activeBatches = inv.batches.filter((b) => b.status === 'active' && b.quantity > 0);
  for (const batch of activeBatches) {
    const daysToExpiry = Math.ceil((new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24));
    if (daysToExpiry <= DAYS_TO_EXPIRY_CRITICAL && daysToExpiry > 0) {
      detections.push({
        problem: 'Expiry Risk',
        riskLevel: 'Critical',
        reason: `Batch ${batch.batchNumber} expires in ${daysToExpiry} days. Quantity: ${batch.quantity}`,
        meta: { batchNumber: batch.batchNumber, daysToExpiry, quantity: batch.quantity },
      });
    } else if (daysToExpiry <= DAYS_TO_EXPIRY_HIGH && daysToExpiry > 0) {
      detections.push({
        problem: 'Expiry Risk',
        riskLevel: 'High',
        reason: `Batch ${batch.batchNumber} expires in ${daysToExpiry} days. Quantity: ${batch.quantity}`,
        meta: { batchNumber: batch.batchNumber, daysToExpiry, quantity: batch.quantity },
      });
    } else if (daysToExpiry <= DAYS_TO_EXPIRY_MEDIUM && daysToExpiry > 0) {
      detections.push({
        problem: 'Expiry Risk',
        riskLevel: 'Medium',
        reason: `Batch ${batch.batchNumber} expires in ${daysToExpiry} days. Quantity: ${batch.quantity}`,
        meta: { batchNumber: batch.batchNumber, daysToExpiry, quantity: batch.quantity },
      });
    }
  }

  // 2. Stockout Risk
  const avgDaily = med.averageDailyConsumption || 5;
  const daysOfStock = avgDaily > 0 ? inv.totalQuantity / avgDaily : 999;
  if (inv.totalQuantity <= med.reorderPoint || daysOfStock <= STOCKOUT_DAYS_THRESHOLD) {
    const risk =
      daysOfStock <= 7 ? 'Critical' : daysOfStock <= 14 ? 'High' : 'Medium';
    detections.push({
      problem: 'Stockout Risk',
      riskLevel: risk,
      reason: `Current stock ${inv.totalQuantity} covers only ~${daysOfStock.toFixed(1)} days at avg daily use of ${avgDaily}. Reorder point: ${med.reorderPoint}`,
      meta: { daysOfStock, avgDaily, reorderPoint: med.reorderPoint },
    });
  }

  // 3. Overstock
  if (inv.totalQuantity > med.maxStockLevel * OVERSTOCK_MULTIPLIER) {
    detections.push({
      problem: 'Overstock',
      riskLevel: inv.totalQuantity > med.maxStockLevel * 4 ? 'High' : 'Medium',
      reason: `Stock ${inv.totalQuantity} exceeds max level ${med.maxStockLevel} by factor of ${(inv.totalQuantity / med.maxStockLevel).toFixed(1)}`,
      meta: { maxStockLevel: med.maxStockLevel },
    });
  }

  // 4. High Demand (based on recent consumption spike)
  // Simplified: if averageDailyConsumption is high relative to stock
  if (avgDaily > 20 && daysOfStock < 30) {
    detections.push({
      problem: 'High Demand',
      riskLevel: 'Medium',
      reason: `High average daily consumption of ${avgDaily} units. Stock may deplete faster than expected.`,
      meta: { avgDaily },
    });
  }

  return detections;
}

/**
 * PREDICT phase
 */
async function predict(inv, detection, hospital) {
  const med = inv.medicine;
  const avgDaily = med.averageDailyConsumption || 5;
  const daysOfStock = avgDaily > 0 ? inv.totalQuantity / avgDaily : 999;

  let text = '';
  const meta = {};

  if (detection.problem === 'Expiry Risk') {
    const days = detection.meta.daysToExpiry;
    text = `If not used within ${days} days, ${detection.meta.quantity} units risk wastage. Estimated waste cost impact if expired.`;
    meta.projectedWaste = detection.meta.quantity;
  } else if (detection.problem === 'Stockout Risk') {
    const daysUntilStockout = Math.max(0, Math.floor(daysOfStock));
    text = `Projected stockout in approximately ${daysUntilStockout} days at current consumption rate.`;
    meta.daysUntilStockout = daysUntilStockout;
  } else if (detection.problem === 'Overstock') {
    text = `Excess stock of ~${inv.totalQuantity - med.maxStockLevel} units. Holding cost and expiry risk increase.`;
    meta.excessQuantity = inv.totalQuantity - med.maxStockLevel;
  } else if (detection.problem === 'High Demand') {
    text = `Demand may remain elevated. Recommend monitoring consumption over next 7-14 days.`;
  }

  return { text, meta };
}

/**
 * DECIDE + RECOMMEND phase
 * Checks hospital network for transfers, suggests procurement, FEFO, etc.
 */
async function decideAndRecommend(inv, detection, prediction, hospital) {
  const med = inv.medicine;
  let action = 'Monitor';
  let quantity = 0;
  let urgency = 'Medium';
  let transferSuggestion = null;
  let supplierSuggestion = null;

  if (detection.problem === 'Expiry Risk') {
    action = 'Use First (FEFO)';
    quantity = detection.meta.quantity;
    urgency = detection.riskLevel === 'Critical' ? 'Immediate' : detection.riskLevel === 'High' ? 'High' : 'Medium';

    // Check if other hospitals need this medicine
    const otherInvs = await Inventory.find({
      medicine: med._id,
      hospital: { $ne: hospital._id },
      totalQuantity: { $lt: 100 }, // low stock elsewhere
    }).populate('hospital');

    if (otherInvs.length > 0 && detection.meta.quantity > 20) {
      const target = otherInvs[0];
      transferSuggestion = {
        toHospitalId: target.hospital._id,
        toHospitalName: target.hospital.name,
        quantity: Math.min(detection.meta.quantity, 50),
        reason: 'Expiry risk at source + low stock at destination',
      };
      action = 'Transfer Out';
      quantity = transferSuggestion.quantity;
    }
  } else if (detection.problem === 'Stockout Risk' || detection.problem === 'High Demand') {
    urgency = detection.riskLevel === 'Critical' ? 'Immediate' : 'High';

    // Look for surplus in network
    const surplusInvs = await Inventory.find({
      medicine: med._id,
      hospital: { $ne: hospital._id },
      totalQuantity: { $gt: med.maxStockLevel || 300 },
    }).populate('hospital');

    if (surplusInvs.length > 0) {
      const source = surplusInvs[0];
      const needed = Math.max(med.reorderPoint * 2 - inv.totalQuantity, 50);
      transferSuggestion = {
        fromHospitalId: source.hospital._id,
        fromHospitalName: source.hospital.name,
        quantity: Math.min(needed, source.totalQuantity - (med.maxStockLevel || 200)),
        reason: 'Stockout risk at destination + surplus at source',
      };
      action = 'Transfer In';
      quantity = transferSuggestion.quantity;
    } else {
      // Recommend procurement
      action = 'Procure';
      quantity = Math.max(med.reorderPoint * 2 - inv.totalQuantity, med.minStockLevel * 2);
      // Find best supplier
      const suppliers = await Supplier.find({
        isActive: true,
        medicinesSupplied: med._id,
      }).sort({ reliabilityScore: -1, deliveryTimeDays: 1 });

      if (suppliers.length > 0) {
        supplierSuggestion = {
          supplierId: suppliers[0]._id,
          supplierName: suppliers[0].name,
          deliveryDays: suppliers[0].deliveryTimeDays,
          reliability: suppliers[0].reliabilityScore,
        };
      }
    }
  } else if (detection.problem === 'Overstock') {
    action = 'Reduce Purchase';
    quantity = 0;
    urgency = 'Low';

    // Suggest transfer out if others need it
    const needyInvs = await Inventory.find({
      medicine: med._id,
      hospital: { $ne: hospital._id },
      totalQuantity: { $lt: med.reorderPoint || 100 },
    }).populate('hospital');

    if (needyInvs.length > 0) {
      const target = needyInvs[0];
      const excess = inv.totalQuantity - med.maxStockLevel;
      transferSuggestion = {
        toHospitalId: target.hospital._id,
        toHospitalName: target.hospital.name,
        quantity: Math.min(excess, 100),
        reason: 'Overstock at source + low stock at destination',
      };
      action = 'Transfer Out';
      quantity = transferSuggestion.quantity;
      urgency = 'Medium';
    } else if (prediction.meta?.excessQuantity > 100) {
      action = 'Return/Dispose';
      quantity = Math.floor(prediction.meta.excessQuantity * 0.3);
    }
  }

  return {
    action,
    quantity: Math.max(0, Math.round(quantity)),
    urgency,
    transferSuggestion,
    supplierSuggestion,
  };
}

/**
 * Create a transfer recommendation from insight
 */
async function createTransferFromInsight(insightId, userId) {
  const insight = await AIInsight.findById(insightId)
    .populate('hospital')
    .populate('medicine');

  if (!insight || !insight.metadata?.transferSuggestion) {
    throw new Error('No transfer suggestion available for this insight');
  }

  const ts = insight.metadata.transferSuggestion;
  const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;

  let fromHospital, toHospital;
  if (insight.recommendedAction === 'Transfer Out') {
    fromHospital = insight.hospital._id;
    toHospital = ts.toHospitalId;
  } else {
    fromHospital = ts.fromHospitalId;
    toHospital = insight.hospital._id;
  }

  const transfer = await Transfer.create({
    transferNumber,
    fromHospital,
    toHospital,
    medicine: insight.medicine._id,
    quantity: insight.recommendedQuantity || ts.quantity,
    status: 'recommended',
    reason: ts.reason || insight.reason,
    recommendedByAI: true,
    transportDetails: {
      vehicle: 'Hospital Transport Van',
      estimatedTimeHours: 4,
      distanceKm: 25,
      cost: 1500,
    },
    requestedBy: userId,
  });

  insight.relatedTransfer = transfer._id;
  insight.status = 'Acknowledged';
  await insight.save();

  return transfer;
}

module.exports = {
  runAnalysis,
  analyzeHospital,
  createTransferFromInsight,
  detectIssues,
  predict,
  decideAndRecommend,
};
