const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4004";

// Proxy OData and API requests to the CAP backend
// Using pathFilter instead of Express mount to preserve the full path
app.use(createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathFilter: ["/odata", "/api"],
}));

// Serve static files from webapp directory
app.use(express.static(path.join(__dirname, "webapp")));

// Fallback to index.html for client-side routing
app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "webapp", "index.html"));
});

app.listen(PORT, function () {
    console.log("Vendor Onboarding Frontend running at http://localhost:" + PORT);
    console.log("Backend proxy: " + BACKEND_URL);
});
