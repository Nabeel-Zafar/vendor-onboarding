const cds = require("@sap/cds");
const express = require("express");

cds.on("bootstrap", (app) => {
  app.post("/api/vendor-approval-callback", express.json(), async (req, res) => {
    try {
      const { vendorId, decision, comments, approvedBy, approvedAt } = req.body;

      if (!vendorId || !decision) {
        return res.status(400).json({ error: "vendorId and decision are required" });
      }

      if (decision !== "APPROVED" && decision !== "REJECTED") {
        return res.status(400).json({ error: "decision must be APPROVED or REJECTED" });
      }

      const status = decision === "APPROVED" ? "Approved" : "Rejected";

      const db = await cds.connect.to("db");
      const { Vendor } = db.entities("my.app");

      await db.run(
        UPDATE(Vendor)
          .set({
            status: status,
            bpaProcessed: true,
            approvedBy: approvedBy || null,
            approvedAt: new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }),
            comments: comments || null,
          })
          .where({ ID: vendorId })
      );

      return res.status(200).json({ message: `Vendor ${vendorId} status updated to ${status}` });
    } catch (error) {
      console.error("BPA callback error:", error.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

module.exports = cds.server;
