import fs from "fs";
import chalk from "chalk";
import fetch from "node-fetch";
import pkg from "form-data";
const FormData = pkg;
import inquirer from "inquirer";

function log(msg, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  switch (type) {
    case "success":
      console.log(`[${timestamp}] ➤  ${chalk.green(msg)}`);
      break;
    case "custom":
      console.log(`[${timestamp}] ➤  ${chalk.magenta(msg)}`);
      break;
    case "error":
      console.log(`[${timestamp}] ➤  ${chalk.red(msg)}`);
      break;
    case "warning":
      console.log(`[${timestamp}] ➤  ${chalk.yellow(msg)}`);
      break;
    default:
      console.log(`[${timestamp}] ➤  ${msg}`);
  }
}
const randstr = (length) =>
  new Promise((resolve, reject) => {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    resolve(text);
  });
async function makeRequest(
  url,
  body = null,
  headers = {},
  proxy = null,
  retries = 5
) {
  let attempt = 0;

  // Fungsi untuk melakukan request
  const makeRequestWithRetry = async () => {
    attempt++;
    const options = {
      method: body ? "POST" : "GET",
      headers: {
        ...headers,
      },
    };

    // Jika proxy disediakan, atur agent
    if (proxy) {
      options.agent = new HttpsProxyAgent(proxy);
    }

    if (body) {
      options.body = body;
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return data;
    } catch (error) {
      // Menangani kesalahan
      if (attempt < retries) {
        log(
          `Attempt ${attempt} failed ${error.toString()}. Retrying...`,
          "error"
        );
        return makeRequestWithRetry(); // Retry request
      } else {
        // Jika semua percobaan gagal, lemparkan error
        if (error.code === "ECONNREFUSED") {
          throw new Error("Proxy connection refused after retries.");
        } else if (error.code === "ETIMEDOUT") {
          throw new Error("Proxy connection timed out after retries.");
        } else if (error.message.includes("fetch")) {
          throw new Error("Network error or invalid URL after retries.");
        } else {
          throw error; // Lemparkan error lainnya setelah retry
        }
      }
    }
  };

  return makeRequestWithRetry();
}

(async () => {
  const getDataPdf = await fs.readdirSync("sertifikat");

  for (let index = 0; index < getDataPdf.length; index++) {
    const GetdataJudul = getDataPdf[index].split("-")[0].replaceAll("_", " ");
    log(`processing ${getDataPdf[index]}`, "warning");
    log(`Data scraping Description yang di Upload ${GetdataJudul}`, "success");
    await fs.renameSync(
      `./sertifikat/${getDataPdf[index]}`,
      `./done_upload/${getDataPdf[index]}`
    );
    let user = await inquirer
      .prompt([
        {
          type: "input",
          name: "name",
          message: "Input username ? ",
        },
      ])
      .then((answers) => {
        return answers.name;
      });
  }
})();
