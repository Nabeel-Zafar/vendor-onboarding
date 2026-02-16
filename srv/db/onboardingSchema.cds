namespace sap.ui.riskmanagement;
using { managed, cuid } from '@sap/cds/common';
entity VendorOnboardingForm : managed, cuid{
    company_name            : String;
    company_address         : String;
    registration_number     : String;
    company_type            : String;
    tax_number              : String;
    contact_person_name     : String;
    contact_person_email    : String;
    industry                : String;
    contact_person_number   : String;
    bank_name               : String;
    bank_account_number     : String;
    license_number          : String;
    service_offering        : String;
    service_description     : String;
    additional_comments     : String;
    reference               : String;
}
