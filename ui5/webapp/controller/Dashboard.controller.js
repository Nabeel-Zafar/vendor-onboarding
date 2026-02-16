sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    var VENDOR_API = "/odata/v4/vendor/Vendor";

    return Controller.extend("vendor.onboarding.controller.Dashboard", {

        onInit: function () {
            this._oVendorsModel = new JSONModel({ Vendors: [] });
            this.getView().setModel(this._oVendorsModel, "vendors");

            this._oCountsModel = new JSONModel({ all: 0, pending: 0, approved: 0, rejected: 0 });
            this.getView().setModel(this._oCountsModel, "counts");

            this._sCurrentFilter = "All";
            this._aAllVendors = [];

            this.getOwnerComponent().getRouter()
                .getRoute("dashboard")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var sRole = this.getOwnerComponent().getModel("session").getProperty("/role");
            if (sRole !== "admin") {
                this.getOwnerComponent().getRouter().navTo("login", {}, true);
                return;
            }
            this._loadVendors();
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

        _loadVendors: function () {
            var that = this;
            this.getView().setBusy(true);

            fetch(VENDOR_API)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    var aVendors = data.value || [];

                    // Enrich vendors with display status
                    aVendors.forEach(function (v) {
                        v._displayStatus = that._getDisplayStatus(v);
                    });

                    that._aAllVendors = aVendors;
                    that._applyFilter();
                    that._updateCounts(aVendors);
                    that.getView().setBusy(false);
                })
                .catch(function (error) {
                    console.error("Error loading vendors:", error);
                    MessageToast.show("Failed to load vendor data");
                    that.getView().setBusy(false);
                });
        },

        _updateCounts: function (aVendors) {
            this._oCountsModel.setData({
                all: aVendors.length,
                pending: aVendors.filter(function (v) { return v._displayStatus === "Pending"; }).length,
                approved: aVendors.filter(function (v) { return v._displayStatus === "Approved"; }).length,
                rejected: aVendors.filter(function (v) { return v._displayStatus === "Rejected"; }).length
            });
        },

        _applyFilter: function () {
            var aFiltered = this._aAllVendors;
            if (this._sCurrentFilter !== "All") {
                aFiltered = this._aAllVendors.filter(function (v) {
                    return v._displayStatus === this._sCurrentFilter;
                }.bind(this));
            }
            this._oVendorsModel.setData({ Vendors: aFiltered });
        },

        onTabSelect: function (oEvent) {
            this._sCurrentFilter = oEvent.getParameter("key");
            this._applyFilter();
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue").toLowerCase();
            var aFiltered = this._aAllVendors;

            if (this._sCurrentFilter !== "All") {
                aFiltered = aFiltered.filter(function (v) {
                    return v._displayStatus === this._sCurrentFilter;
                }.bind(this));
            }

            if (sQuery) {
                aFiltered = aFiltered.filter(function (v) {
                    return (v.company_name || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (v.contact_person_name || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (v.contact_person_email || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (v.industry || "").toLowerCase().indexOf(sQuery) > -1 ||
                        (v.company_type || "").toLowerCase().indexOf(sQuery) > -1;
                });
            }

            this._oVendorsModel.setData({ Vendors: aFiltered });
        },

        onVendorPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("vendors");
            var sVendorId = oContext.getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("vendorDetail", {
                vendorId: sVendorId
            });
        },

        onAddVendor: function () {
            this.getOwnerComponent().getRouter().navTo("onboarding");
        },

        onNavToUsers: function () {
            this.getOwnerComponent().getRouter().navTo("users");
        },

        onLogout: function () {
            this.getOwnerComponent().getModel("session").setProperty("/role", "");
            this.getOwnerComponent().getRouter().navTo("login");
        }
    });
});
