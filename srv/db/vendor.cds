namespace my.app;

entity Vendor {
    key ID                    : UUID;
        company_name          : String;
        company_address       : String;
        registration_number   : String;
        company_type          : String;
        tax_number            : String;
        contact_person_name   : String;
        contact_person_email  : String;
        industry              : String;
        contact_person_number : String;
        bank_name             : String;
        bank_account_number   : String;
        license_number        : String;
        service_offering      : String;
        service_description   : String;
        additional_comments   : String;
        reference             : String;

        status                : String default 'Pending';
        criticality           : Integer;

        bpaProcessed          : Boolean default false;
        workflowInstanceId    : String;
        approvedBy            : String;
        approvedAt            : String;
        comments              : String;

}
