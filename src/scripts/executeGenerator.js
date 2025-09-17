// deno-lint-ignore-file
const { spawn } = require("child_process");
const path = require("path");

exports.handler = async (event, context) => {
  const generatorPath = path.join(__dirname, "generator");

  return new Promise((resolve, reject) => {
    const child = spawn(generatorPath, [], {
      env: process.env,
    });

    child.stdout.on("data", (data) => {
      console.log(String(data));
    });

    child.stderr.on("data", (data) => {
      console.error(String(data));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Generator process exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.stdin.write(JSON.stringify(event));
    child.stdin.end();
  });
};
