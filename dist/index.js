"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTrace = exports.Trace = void 0;
// Export the main Trace class and utility function for easy importing
var trace_1 = require("./trace");
Object.defineProperty(exports, "Trace", { enumerable: true, get: function () { return trace_1.Trace; } });
Object.defineProperty(exports, "runTrace", { enumerable: true, get: function () { return trace_1.runTrace; } });
// Demo usage when run directly
if (require.main === module) {
    const { runTrace } = require('./trace');
    console.log(`1 + 10 = ${runTrace('1 + 10')}`);
}
//# sourceMappingURL=index.js.map