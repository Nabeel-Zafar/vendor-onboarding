sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    var VENDOR_API = "/odata/v4/vendor/Vendor";

    return Controller.extend("vendor.onboarding.controller.OnboardingForm", {

        onInit: function () {},

        _getFieldValue: function (sId) {
            var oControl = this.byId(sId);
            if (!oControl) {
                return "";
            }
            return oControl.getValue ? oControl.getValue().trim() : "";
        },

        _validateForm: function () {
            var aRequired = [
                "company_name", "contact_person_name",
                "contact_person_email", "contact_person_number"
            ];

            var bValid = true;
            var that = this;

            aRequired.forEach(function (sId) {
                var oControl = that.byId(sId);
                var sValue = that._getFieldValue(sId);
                if (!sValue) {
                    if (oControl.setValueState) {
                        oControl.setValueState("Error");
                        oControl.setValueStateText("This field is required");
                    }
                    bValid = false;
                } else {
                    if (oControl.setValueState) {
                        oControl.setValueState("None");
                    }
                }
            });

            // Validate email format
            var sEmail = this._getFieldValue("contact_person_email");
            if (sEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
                this.byId("contact_person_email").setValueState("Error");
                this.byId("contact_person_email").setValueStateText("Please enter a valid email");
                bValid = false;
            }

            return bValid;
        },

        onSubmit: function () {
            if (!this._validateForm()) {
                MessageToast.show("Please fill in all required fields correctly");
                return;
            }

            var oPayload = {
                company_name: this._getFieldValue("company_name"),
                company_address: this._getFieldValue("company_address"),
                contact_person_name: this._getFieldValue("contact_person_name"),
                contact_person_email: this._getFieldValue("contact_person_email"),
                contact_person_number: this._getFieldValue("contact_person_number")
            };

            var that = this;
            this.getView().setBusy(true);

            fetch(VENDOR_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().then(function (err) {
                        throw new Error(err.error ? err.error.message : "Submission failed");
                    });
                }
                return response.json();
            })
            .then(function () {
                that.getView().setBusy(false);
                var sRole = that.getOwnerComponent().getModel("session").getProperty("/role");
                MessageBox.success("Vendor submitted successfully!", {
                    title: "Success",
                    onClose: function () {
                        that._clearForm();
                        if (sRole === "admin") {
                            that.getOwnerComponent().getRouter().navTo("dashboard");
                        }
                    }
                });
            })
            .catch(function (error) {
                that.getView().setBusy(false);
                MessageBox.error("Failed to submit vendor: " + error.message);
            });
        },

        _clearForm: function () {
            var aFields = [
                "company_name", "company_address", "contact_person_name",
                "contact_person_email", "contact_person_number"
            ];

            var that = this;
            aFields.forEach(function (sId) {
                var oControl = that.byId(sId);
                if (oControl) {
                    if (oControl.setValue) {
                        oControl.setValue("");
                    }
                    if (oControl.setValueState) {
                        oControl.setValueState("None");
                    }
                }
            });
        },

        onLogout: function () {
            this.getOwnerComponent().getModel("session").setProperty("/role", "");
            this.getOwnerComponent().getRouter().navTo("login");
        },

        onNavBack: function () {
            var sRole = this.getOwnerComponent().getModel("session").getProperty("/role");
            if (sRole === "admin") {
                this.getOwnerComponent().getRouter().navTo("dashboard");
            } else {
                this.getOwnerComponent().getRouter().navTo("login");
            }
        }
    });
});