module.exports = (srv) => {
    srv.on('CREATE', 'VendorOnboardingForm', async (req) => {
        const {
            company_name            ,
            company_address         ,
            registration_number     ,
            company_type            ,
            tax_number              ,
            contact_person_name     ,
            contact_person_email    ,
            industry                ,
            contact_person_number   ,
            bank_name               ,
            bank_account_number     ,
            license_number          ,
            service_offering        ,
            service_description     ,
            additional_comments     ,
            reference
         } = req.data;
        // Validate and process the incoming data as needed
        // Persist the data in the database
        console.log("req.data",req.data) ;
        const result = await srv.insert(req.data).into('sap.ui.riskmanagement.VendorOnboardingForm');

        return result;
    });
};
