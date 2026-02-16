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

    // Validation for company_name: Mandatory
    if (!data.company_name || typeof data.company_name !== "string" || !data.company_name.trim()) {
      req.error(400, "Company Name is mandatory");
    }

    // Validation for contact_person_name: Mandatory
    if (!data.contact_person_name || typeof data.contact_person_name !== "string" || !data.contact_person_name.trim()) {
      req.error(400, "Contact Person Name is mandatory");
    }

    // Validation for contact_person_email: Mandatory email
    if (!data.contact_person_email || typeof data.contact_person_email !== "string" || !isValidEmail(data.contact_person_email)) {
      req.error(400, "Contact Person Email must be a valid email");
    }

    // Validation for contact_person_number: Mandatory and must be a number
    if (!data.contact_person_number || isNaN(data.contact_person_number)) {
      req.error(400, "Contact Person Number must be a number");
    }

    // Duplicate email check
    const existingEmail = await SELECT.from(Vendor).where({ contact_person_email: data.contact_person_email });
    if (existingEmail && existingEmail.length > 0) {
      req.error(409, "A vendor with this email already exists");
    }

    // Duplicate phone number check
    const existingPhone = await SELECT.from(Vendor).where({ contact_person_number: data.contact_person_number });
    if (existingPhone && existingPhone.length > 0) {
      req.error(409, "A vendor with this phone number already exists");
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
    const { vendorId, status } = req.data.input;
    // Use cds.transaction to perform the update operation
    await cds.transaction(async (tx) => {
        const affectedRows = await tx.run(
            UPDATE(Vendor)
                .set({ status: status })
                .where({ ID: vendorId })
        );
    });
    // Return the result of the operation
    return { result: `Vendor with ID ${vendorId} status updated to ${status}` };
});

};
