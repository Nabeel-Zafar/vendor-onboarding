sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    var USER_API = "/odata/v4/user/User";

    return Controller.extend("vendor.onboarding.controller.UsersPage", {

        onInit: function () {
            this._oUsersModel = new JSONModel({ Users: [] });
            this.getView().setModel(this._oUsersModel, "users");

            this._aAllUsers = [];

            this.getOwnerComponent().getRouter()
                .getRoute("users")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadUsers();
        },

        _loadUsers: function () {
            var that = this;
            this.getView().setBusy(true);

            fetch(USER_API)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    var aUsers = data.value || [];
                    that._aAllUsers = aUsers;
                    that._oUsersModel.setData({ Users: aUsers });
                    that.getView().setBusy(false);
                })
                .catch(function (error) {
                    console.error("Error loading users:", error);
                    MessageToast.show("Failed to load user data");
                    that.getView().setBusy(false);
                });
        },

        onSearchUser: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue").toLowerCase();
            var aFiltered = this._aAllUsers;

            if (sQuery) {
                aFiltered = aFiltered.filter(function (u) {
                    return (u.first_name || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (u.last_name || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (u.user_email || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (u.role || "").toLowerCase().indexOf(sQuery) > -1;
                });
            }

            this._oUsersModel.setData({ Users: aFiltered });
        },

        onAddUser: function () {
            this.getOwnerComponent().getRouter().navTo("userForm");
        },

        onLogout: function () {
            this.getOwnerComponent().getModel("session").setProperty("/role", "");
            this.getOwnerComponent().getRouter().navTo("login");
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        }
    });
});
