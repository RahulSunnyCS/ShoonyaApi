// jobs/fetchAndProcessData.js
const axios = require("axios");
const fs = require("fs");
const AdmZip = require("adm-zip");
const csv = require("csv-parser");

async function fetchAndProcessData() {
  try {
    // Download the ZIP file
    const url = "https://api.shoonya.com/NFO_symbols.txt.zip";
    console.log(`Fetching ZIP file from: ${url}`);
    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer", // Ensure we get the response as an array buffer
    });

    // Log response status and headers for debugging
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    // Check if response data is valid
    if (!response.data) {
      throw new Error("Response data is undefined");
    }

    // Save the ZIP file
    const zipFilePath = "./NFO_symbols.txt.zip";
    fs.writeFileSync(zipFilePath, Buffer.from(response.data, "binary"));
    console.log(`ZIP file saved to: ${zipFilePath}`);

    // Extract the TXT file from the ZIP
    const zip = new AdmZip(zipFilePath);
    const extractedFilePath = "./NFO_symbols.txt";
    zip.extractAllTo(/*target path*/ "./", /*overwrite*/ true);
    console.log(`Extracted file saved to: ${extractedFilePath}`);

    // Process the extracted TXT file
    const results = [];
    fs.createReadStream(extractedFilePath)
      .pipe(csv())
      .on("data", (data) => {
        // Filter the data based on your criteria
        if (data.Symbol === "ZYDUSLIFE" && data.OptionType === "CE") {
          results.push(data);
        }
      })
      .on("end", () => {
        // Store the filtered data
        const outputFilePath = "./filtered_data.json";
        fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
        console.log("Filtered data saved to:", outputFilePath);
      });
  } catch (error) {
    console.error("Error fetching or processing data:", error);
  }
}

module.exports = fetchAndProcessData;
