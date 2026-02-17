sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    var USER_API = "/odata/v4/user/User";

    return Controller.extend("vendor.onboarding.controller.UserForm", {

        onInit: function () {
            // Role options
            var oRolesModel = new JSONModel({
                roles: [
                    { key: "Admin", text: "Admin" },
                    { key: "SCO", text: "SCO" }
                ]
            });
            this.getView().setModel(oRolesModel, "roles");
        },

        _getFieldValue: function (sId) {
            var oControl = this.byId(sId);
            if (!oControl) {
                return "";
            }
            return oControl.getValue ? oControl.getValue().trim() : "";
        },

        _validateForm: function () {
            var aRequired = ["first_name", "last_name", "user_email", "role", "phone_number", "password"];
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

            // Validate email
            var sEmail = this._getFieldValue("user_email");
            if (sEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
                this.byId("user_email").setValueState("Error");
                this.byId("user_email").setValueStateText("Please enter a valid email");
                bValid = false;
            }

            return bValid;
        },

        onSubmitUser: function () {
            if (!this._validateForm()) {
                MessageToast.show("Please fill in all required fields correctly");
                return;
            }

            var oPayload = {
                first_name: this._getFieldValue("first_name"),
                last_name: this._getFieldValue("last_name"),
                user_email: this._getFieldValue("user_email"),
                role: this._getFieldValue("role"),
                phone_number: this._getFieldValue("phone_number"),
                password: this._getFieldValue("password")
            };

            var that = this;
            this.getView().setBusy(true);

            fetch(USER_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().then(function (err) {
                        throw new Error(err.error ? err.error.message : "Registration failed");
                    });
                }
                return response.json();
            })
            .then(function () {
                that.getView().setBusy(false);
                MessageBox.success("User created successfully!", {
                    title: "Success",
                    onClose: function () {
                        that._clearForm();
                        that.getOwnerComponent().getRouter().navTo("users");
                    }
                });
            })
            .catch(function (error) {
                that.getView().setBusy(false);
                MessageBox.error("Failed to create user: " + error.message);
            });
        },

        _clearForm: function () {
            var aFields = ["first_name", "last_name", "user_email", "role", "phone_number", "password"];
            var that = this;

            aFields.forEach(function (sId) {
                var oControl = that.byId(sId);
                if (oControl) {
                    if (oControl.setValue) {
                        oControl.setValue("");
                    }
                    if (oControl.setSelectedKey) {
                        oControl.setSelectedKey("");
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
            this.getOwnerComponent().getRouter().navTo("users");
        }
    });
});
