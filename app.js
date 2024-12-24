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
  const path = "sertifikat";
  const pathSuccess = "done_upload";

  const getDataPdf = await fs.readdirSync(path);
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
  let password = await inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "Input password ? ",
      },
    ])
    .then((answers) => {
      return answers.name;
    });

  const Login = await makeRequest(
    "https://gateway.telkomuniversity.ac.id/issueauth",
    new URLSearchParams({
      username: user,
      password: password,
    }),
    {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      Connection: "keep-alive",
      Origin: "https://situ-kem.telkomuniversity.ac.id",
      Referer: "https://situ-kem.telkomuniversity.ac.id/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
    null
  );
  if (Login.token) {
    log("login sucessfully", "success");
    const dataprofile = await makeRequest(
      "https://gateway.telkomuniversity.ac.id/issueprofile",
      null,
      {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        Authorization: "Bearer " + Login.token,
        Connection: "keep-alive",
        Origin: "https://situ-kem.telkomuniversity.ac.id",
        Referer: "https://situ-kem.telkomuniversity.ac.id/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "sec-ch-ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
      null
    );
    log(dataprofile["user"], "custom");
    log(dataprofile["fullname"], "custom");
    log(dataprofile["numberid"], "custom");
    for (let index = 0; index < getDataPdf.length; index++) {
      const GetdataJudul = getDataPdf[index].split("-")[0].replaceAll("_", " ");
      log(`processing ${getDataPdf[index]}`, "warning");
      log(
        `Data scraping Description yang di Upload ${GetdataJudul}`,
        "success"
      );
      let start = await inquirer
        .prompt([
          {
            type: "input",
            name: "name",
            message: "Input start date? ",
          },
        ])
        .then((answers) => {
          return answers.name;
        });
      let end = await inquirer
        .prompt([
          {
            type: "input",
            name: "name",
            message: "Input end date ? ",
          },
        ])
        .then((answers) => {
          return answers.name;
        });
      const form = new FormData();
      form.append(
        "tak_document_file",
        fs.createReadStream(`./sertifikat/${getDataPdf[index]}`),
        {
          filename: getDataPdf[index],
          contentType: "application/pdf",
        }
      );
      form.append("school_year", "2425");
      form.append("start_date", `${start}/12/2024`);
      form.append("end_date", `${start}/12/2024`);
      form.append(
        "description",
        `Mengikuti E-Learning Course MySkill dengan Judul ${GetdataJudul}`
      );
      form.append("organizer", "MySkill");
      form.append("nim", dataprofile["numberid"]);
      form.append("nama", dataprofile["fullname"]);
      form.append("faculty_id", "7");
      form.append(
        "participation_name",
        `${GetdataJudul}-MySkill-E-Learning Course`
      );
      form.append(
        "participation_english_name",
        `${GetdataJudul}-MySkill-E-Learning Course`
      );
      form.append("created_by", dataprofile["user"]);
      form.append("category_id", "34");
      form.append("approved_status", "B");
      form.append("category_type_id", "42");
      form.append("category_level_id", "48");
      form.append("activity_id", "141");
      form.append("organizer", "MySkill");
      const Boundary = form.getBoundary();
      const Upload = await makeRequest(
        "https://gateway.telkomuniversity.ac.id/d19c17b5712654f377531ff3fdaf65a8",
        form,
        {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
          Authorization: "Bearer " + Login.token,
          Connection: "keep-alive",
          "Content-Type": `multipart/form-data; boundary=${Boundary}`,
          Origin: "https://situ-kem.telkomuniversity.ac.id",
          Referer: "https://situ-kem.telkomuniversity.ac.id/",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "sec-ch-ua":
            '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
        }
      );
      if (Upload.message === "TAK BERHASIL DITAMBAHKAN") {
        log(`Data berhasil di Input`, "success");
        await fs.renameSync(
          `./${path}/${getDataPdf[index]}`,
          `./${pathSuccess}/${getDataPdf[index]}`
        );
      } else {
        log(`Data ada kesalahan`, "error");
      }
    }
  } else {
    log("login failed !!", "error");
  }
})();
