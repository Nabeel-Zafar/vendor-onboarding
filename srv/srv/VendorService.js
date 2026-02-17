const axios = require("axios");
const qs = require("querystring");
const crypto = require("crypto");

// OAuth and BPA workflow configuration from environment variables
const BPA_AUTH_URL = process.env.BPA_AUTH_URL;
const BPA_CLIENT_ID = process.env.BPA_CLIENT_ID;
const BPA_CLIENT_SECRET = process.env.BPA_CLIENT_SECRET;
const BPA_WORKFLOW_URL = process.env.BPA_WORKFLOW_URL;
const BPA_WORKFLOW_DEFINITION_ID = process.env.BPA_WORKFLOW_DEFINITION_ID;

module.exports = (srv) => {
  const { Vendor } = srv.entities;

  srv.before("CREATE", Vendor, async (req) => {
    const data = req.data;
    const errors = [];

    // Mandatory field validations
    if (!data.company_name || typeof data.company_name !== "string" || !data.company_name.trim()) {
      errors.push("Company Name is mandatory");
    }
    if (!data.contact_person_name || typeof data.contact_person_name !== "string" || !data.contact_person_name.trim()) {
      errors.push("Contact Person Name is mandatory");
    }
    if (!data.contact_person_email || typeof data.contact_person_email !== "string" || !isValidEmail(data.contact_person_email)) {
      errors.push("Contact Person Email must be a valid email");
    }
    if (!data.contact_person_number || isNaN(data.contact_person_number)) {
      errors.push("Contact Person Number must be a number");
    }

    // Duplicate checks (only if format validations passed for those fields)
    if (errors.length === 0) {
      const [existingEmail, existingPhone] = await Promise.all([
        SELECT.from(Vendor).where({ contact_person_email: data.contact_person_email }),
        SELECT.from(Vendor).where({ contact_person_number: data.contact_person_number })
      ]);

      if (existingEmail && existingEmail.length > 0) {
        errors.push("A vendor with this email already exists");
      }
      if (existingPhone && existingPhone.length > 0) {
        errors.push("A vendor with this phone number already exists");
      }
    }

    if (errors.length > 0) {
      req.reject(409, errors.join(". "));
    }
  });

  // Helper function to validate email format
  function isValidEmail(email) {
    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  srv.on("CREATE", "Vendor", async (req) => {
    const { data } = req;

    // Generate UUID if not provided
    if (!data.ID) {
      data.ID = crypto.randomUUID();
    }

    // Create the vendor entity
    await INSERT.into(Vendor).entries(data);

    // Trigger SAP BPA workflow (non-blocking - vendor creation succeeds even if workflow fails)
    try {
      const tokenResponse = await axios.post(
        BPA_AUTH_URL,
        qs.stringify({
          grant_type: "client_credentials",
          client_id: BPA_CLIENT_ID,
          client_secret: BPA_CLIENT_SECRET,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      const payload = {
        definitionId: BPA_WORKFLOW_DEFINITION_ID,
        context: {
          id: data.ID || "",
          company_name: data.company_name || "",
          company_address: data.company_address || "",
          contact_person_name: data.contact_person_name || "",
          contact_person_email: data.contact_person_email || "",
          contact_person_number: data.contact_person_number || "",
        },
      };

      const wfResponse = await axios.post(
        BPA_WORKFLOW_URL,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Store the workflow instance ID on the vendor record
      await UPDATE(Vendor).set({ workflowInstanceId: wfResponse.data.id }).where({ ID: data.ID });
    } catch (error) {
      console.warn("SAP BPA workflow trigger failed (non-blocking):", error.message);
    }

    return data;
  });

  function determineStatusCriticality(status) {
    switch (status) {
        case 'Approved':
            return 3;
        case 'Rejected':
            return 1;
        case 'Pending':
            return 2;
        default:
            return 0;
    }
}

  srv.after("READ", "Vendor", (vendors) => {
    vendors.forEach(vendor => {
       vendor.criticality = determineStatusCriticality(vendor.status);
    });
   });

  srv.on("ApproveOrRejectAction", async (req) => {
    const { vendorId, status, approvedBy, comments } = req.data.input;
    await cds.transaction(async (tx) => {
        await tx.run(
            UPDATE(Vendor)
                .set({
                    status: status,
                    approvedBy: approvedBy || "",
                    approvedAt: new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }),
                    comments: comments || "",
                    bpaProcessed: true
                })
                .where({ ID: vendorId })
        );
    });
    return { result: `Vendor with ID ${vendorId} status updated to ${status}` };
});

};
