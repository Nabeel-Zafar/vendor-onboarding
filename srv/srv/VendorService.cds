using my.app as my from '../db/vendor';


service VendorService {
    entity Vendor as projection on my.Vendor;

     type MyInputType: {
        vendorId: String;
        status: String;
    };

    type MyOutputType: {
        result: String;
    };

    action ApproveOrRejectAction(input: MyInputType) returns MyOutputType;

}
