"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const env_1 = require("./config/env");
app_1.app.listen(env_1.env.port, () => {
    console.log(`API running on port ${env_1.env.port}`);
});
//# sourceMappingURL=server.js.map