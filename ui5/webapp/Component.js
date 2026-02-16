sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("vendor.onboarding.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // Session model to store logged-in user role
            var oSessionModel = new JSONModel({ role: "" });
            this.setModel(oSessionModel, "session");

            this.getRouter().initialize();
        }
    });
});
