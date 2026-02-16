using sap.ui.riskmanagement as rm from '../db/onboardingSchema';

service VendorOnboardingFormService {
    entity VendorOnboardingForm as projection on rm.VendorOnboardingForm;
}
