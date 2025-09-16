// deno-lint-ignore-file
const { spawn } = require("child_process");
const path = require("path");

exports.handler = async (event, context) => {
  const generatorPath = path.join(__dirname, "generator");

  return new Promise((resolve, reject) => {
    const child = spawn(generatorPath, [], {
      stdio: ["pipe", "pipe", "inherit"],
      env: process.env,
    });

    let stdout = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Generator process exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.stdin.write(JSON.stringify(event));
    child.stdin.end();
  });
};
