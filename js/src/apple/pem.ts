import { exec } from "child_process";

export async function fetchCa(path: string) {
  const response = await fetch(`https://www.apple.com/${path}.cer`);
  return Buffer.from(await response.arrayBuffer());
}

export async function getAppleRootPem(path: string, cer?: Buffer) {
  if (!cer) {
    cer = await fetchCa(path);
  }
  let cert = await new Promise((resolve, reject) => {
    const openssl = exec(
      "openssl x509 -inform der",
      (error, stdout, stderr) => {
        if (error) {
          reject(`OpenSSL conversion failed: ${stderr || error.message}`);
        } else {
          resolve(stdout);
        }
      }
    );

    // Pipe DER data to OpenSSL's stdin
    openssl.stdin!.write(cer);
    openssl.stdin!.end();
  });

  return cert as string;
}

if (process.argv[1] === import.meta.filename) {
  getAppleRootPem().catch(console.error);
}
