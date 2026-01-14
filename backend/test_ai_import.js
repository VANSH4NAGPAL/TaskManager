try {
    const pkg = require("@google/genai");
    console.log("Imports available:", Object.keys(pkg));
    if (pkg.GoogleGenerativeAI) console.log("GoogleGenerativeAI found");
    if (pkg.GenAI) console.log("GenAI found");
} catch (e) {
    console.error("Error requiring @google/genai:", e.message);
}
