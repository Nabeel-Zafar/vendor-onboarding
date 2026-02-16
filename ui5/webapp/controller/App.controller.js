sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("vendor.onboarding.controller.App", {
        onInit: function () {
            // Apply compact density for desktop, cozy for touch devices
            this.getView().addStyleClass(
                sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact"
            );
        }
    });
});
