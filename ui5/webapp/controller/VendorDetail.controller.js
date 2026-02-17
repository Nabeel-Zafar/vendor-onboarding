sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    var VENDOR_API = "/odata/v4/vendor/Vendor";
    var ACTION_API = "/odata/v4/vendor/ApproveOrRejectAction";

    return Controller.extend("vendor.onboarding.controller.VendorDetail", {

        onInit: function () {
            this._oDetailModel = new JSONModel({});
            this.getView().setModel(this._oDetailModel, "detail");

            this.getOwnerComponent().getRouter()
                .getRoute("vendorDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRole = this.getOwnerComponent().getModel("session").getProperty("/role");
            if (sRole !== "admin") {
                this.getOwnerComponent().getRouter().navTo("login", {}, true);
                return;
            }
            var sVendorId = oEvent.getParameter("arguments").vendorId;
            this._sVendorId = sVendorId;
            this._loadVendorDetail(sVendorId);
        },

        _getDisplayStatus: function (oVendor) {
            if (oVendor.status) {
                return oVendor.status;
            }
            switch (oVendor.criticality) {
                case 3: return "Approved";
                case 1: return "Rejected";
                case 2: return "Pending";
                default: return "Pending";
            }
        },

        _loadVendorDetail: function (sVendorId) {
            var that = this;
            this.getView().setBusy(true);

            fetch(VENDOR_API + "(" + sVendorId + ")")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Vendor not found");
                    }
                    return response.json();
                })
                .then(function (oVendor) {
                    oVendor._displayStatus = that._getDisplayStatus(oVendor);
                    that._oDetailModel.setData(oVendor);

                    that.getView().setBusy(false);
                })
                .catch(function (error) {
                    console.error("Error loading vendor:", error);
                    MessageToast.show("Failed to load vendor details");
                    that.getView().setBusy(false);
                });
        },

        onApprove: function () {
            var that = this;
            MessageBox.confirm("Are you sure you want to approve this vendor?", {
                title: "Confirm Approval",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._updateVendorStatus("Approved");
                    }
                }
            });
        },

        onReject: function () {
            var that = this;
            MessageBox.confirm("Are you sure you want to reject this vendor?", {
                title: "Confirm Rejection",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._updateVendorStatus("Rejected");
                    }
                }
            });
        },

        _updateVendorStatus: function (sStatus, sComments) {
            var that = this;
            this.getView().setBusy(true);

            var sUser = this.getOwnerComponent().getModel("session").getProperty("/username") || "Admin";
            var oPayload = {
                input: {
                    vendorId: this._sVendorId,
                    status: sStatus,
                    approvedBy: sUser,
                    comments: sComments || ""
                }
            };

            fetch(ACTION_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().then(function (err) {
                        throw new Error(err.error ? err.error.message : "Action failed");
                    });
                }
                return response.json();
            })
            .then(function () {
                that.getView().setBusy(false);
                var sMessage = sStatus === "Approved"
                    ? "Vendor approved successfully!"
                    : "Vendor rejected successfully!";
                MessageToast.show(sMessage);
                that._loadVendorDetail(that._sVendorId);
            })
            .catch(function (error) {
                that.getView().setBusy(false);
                MessageBox.error("Failed to update vendor status: " + error.message);
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        }
    });
});
