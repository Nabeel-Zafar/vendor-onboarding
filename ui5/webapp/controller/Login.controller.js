sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    // Hardcoded users
    var USERS = {
        "admin": { password: "admin123", role: "admin" },
        "requester": { password: "req123", role: "requester" }
    };

    return Controller.extend("vendor.onboarding.controller.Login", {

        onLogin: function () {
            var sUsername = this.byId("usernameInput").getValue().trim();
            var sPassword = this.byId("passwordInput").getValue().trim();

            if (!sUsername || !sPassword) {
                MessageToast.show("Please enter username and password");
                return;
            }

            var oUser = USERS[sUsername];

            if (!oUser || oUser.password !== sPassword) {
                MessageToast.show("Invalid username or password");
                return;
            }

            // Store the role and username in the session model
            var oSession = this.getOwnerComponent().getModel("session");
            oSession.setProperty("/role", oUser.role);
            oSession.setProperty("/username", sUsername);

            // Navigate based on role
            if (oUser.role === "admin") {
                this.getOwnerComponent().getRouter().navTo("dashboard");
            } else {
                this.getOwnerComponent().getRouter().navTo("onboarding");
            }
        }
    });
});