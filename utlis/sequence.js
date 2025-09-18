const Counter = require("../model/counterModel");
const Order = require("../model/orderModel");


async function getNextSequence(name, { initializeIfMissing = false } = {}) {
  if (initializeIfMissing) {
    const exists = await Counter.exists({ _id: name });
    if (!exists) {
      const orders = await Order.find({}, { orderno: 1 }).lean();
      let max = 0;
      for (const o of orders) {
        if (!o.orderno) continue;
        const num = parseInt(String(o.orderno).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      }
      await Counter.create({ _id: name, seq: max });
    }
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
}

module.exports = { getNextSequence };
