sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (Controller, JSONModel, ActionSheet, Button) {
    "use strict";

    return Controller.extend("vendor.onboarding.controller.App", {
        onInit: function () {
            this.getView().addStyleClass(
                sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact"
            );

            var oAppState = new JSONModel({
                shellBarVisible: false,
                showNavButton: false
            });
            this.getView().setModel(oAppState, "appState");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oAppState = this.getView().getModel("appState");

            // Hide ShellBar on login page
            oAppState.setProperty("/shellBarVisible", sRouteName !== "login");

            // Show nav button on detail/sub pages
            var aDetailRoutes = ["vendorDetail", "onboarding", "users", "userForm"];
            oAppState.setProperty("/showNavButton", aDetailRoutes.indexOf(sRouteName) > -1);

            // Update avatar initials based on session
            var sRole = this.getOwnerComponent().getModel("session").getProperty("/role");
            var oShellBar = this.byId("shellBar");
            if (oShellBar && sRole) {
                var sInitials = sRole === "admin" ? "A" : "R";
                var oAvatar = oShellBar.getProfile();
                if (oAvatar) {
                    oAvatar.setInitials(sInitials);
                }
            }

            this._sCurrentRoute = sRouteName;
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            switch (this._sCurrentRoute) {
                case "vendorDetail":
                case "onboarding":
                case "users":
                    oRouter.navTo("dashboard");
                    break;
                case "userForm":
                    oRouter.navTo("users");
                    break;
                default:
                    oRouter.navTo("dashboard");
            }
        },

        onHomePress: function () {
            var sRole = this.getOwnerComponent().getModel("session").getProperty("/role");
            if (sRole === "admin") {
                this.getOwnerComponent().getRouter().navTo("dashboard");
            }
        },

        onAvatarPress: function (oEvent) {
            var that = this;
            if (!this._oActionSheet) {
                this._oActionSheet = new ActionSheet({
                    buttons: [
                        new Button({
                            text: "Logout",
                            icon: "sap-icon://log",
                            press: function () {
                                that.getOwnerComponent().getModel("session").setProperty("/role", "");
                                that.getOwnerComponent().getRouter().navTo("login");
                            }
                        })
                    ]
                });
                this.getView().addDependent(this._oActionSheet);
            }
            this._oActionSheet.openBy(oEvent.getSource());
        }
    });
});
