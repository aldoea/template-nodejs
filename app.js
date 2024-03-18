const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");

axios.defaults.validateStatus = function axvalStatus() {
  // avoid throwing errors wen status id !== 200
  return true;
};

async function fetchTokenAndLog() {
  console.log("Fetching token...");
  const url = "https://sbx.mx.bbvaapimarket.com/auth/oauth/v2/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.BBVA_APICHANNEL_CLIENT_ID_SB);
  params.append("client_secret", process.env.BBVA_APICHANNEL_CLIENT_SECRET_SB);

  try {
    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.status !== 200) {
      // Prepare the log entry
      const logEntry = `Timestamp: ${new Date().toISOString()}\nResponse Code: ${
        response.status
      }\nResponse: ${JSON.stringify(
        response.data,
        null,
        2
      )}\nHeaders: ${JSON.stringify(response.headers, null, 2)}\n\n`;

      // Append the log entry to the log file
      await handleLog(logEntry);
    } else {
      handleLog(`Token fetched successfully ${new Date().toISOString()}`);
    }
  } catch (error) {
    await handleLog(
      `Error: ${error.response ? error.response.data : error.message}\n`
    );
  }
}

async function handleLog(log) {
  console.log(log);
  const dir = __dirname + "/temp";
  const logFile = "monitor.logs.txt";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.appendFileSync(dir + "/" + logFile, log);
}

// Schedule the task to run every 5 minutes
console.log("Starting the monitoring task...");
handleLog(`Starting the monitoring task... ${new Date().toISOString()}\n`);
if (!process.env.BBVA_APICHANNEL_CLIENT_ID_SB) {
  let log = `Timestamp: ${new Date().toISOString()}\nError: The BBVA_APICHANNEL_CLIENT_ID_SB environment variable is not set\n\n`;
  console.error(log);
  handleLog(log);
  process.exit(1);
}
fetchTokenAndLog();
cron.schedule("*/5 * * * *", fetchTokenAndLog);
