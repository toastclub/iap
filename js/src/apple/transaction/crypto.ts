// https://github.com/apple/app-store-server-library-node/blob/1662832f6119e386da4bf1191230fe88baa27189/jws_verification.ts

import { importX509, decodeJwt, jwtVerify } from "jose";
import { getAppleRootPem } from "../pem" with { type: "macro" };
import {
  KeyUsageFlags,
  KeyUsagesExtension,
  PublicKey,
  X509Certificate,
} from "@peculiar/x509";
import type { IAPTransactionOptions } from ".";

const MAX_SKEW = 60000;

async function getRootCertificates(): Promise<X509Certificate[]> {
  const appleRootG3 = new X509Certificate(
    await getAppleRootPem("certificateauthority/AppleRootCA-G3")
  );
  return [appleRootG3];
}

function checkDates(cert: X509Certificate, effectiveDate: Date) {
  if (
    new Date(cert.notBefore).getTime() > effectiveDate.getTime() + MAX_SKEW ||
    new Date(cert.notAfter).getTime() < effectiveDate.getTime() - MAX_SKEW
  ) {
    throw new Error(
      "Certificate chain verification failed: not valid at effective date"
    );
  }
}

export async function verifyJWT(
  jwt: string,
  options: IAPTransactionOptions
): Promise<any> {
  const decodedJwt = decodeJwt(jwt);
  if (options.rootCertificates === false) {
    return decodedJwt;
  }
  const header = JSON.parse(
    Buffer.from(jwt.split(".")[0], "base64url").toString("utf-8")
  );
  const chain: string[] = header["x5c"];
  if (!chain || chain.length != 3) {
    throw new Error("Invalid certificate chain length");
  }
  const leaf = new X509Certificate(chain[0]);
  const intermediate = new X509Certificate(chain[1]);
  const root = options.rootCertificates || (await getRootCertificates());
  const effectiveDate = options.signedDateExtractor
    ? options.signedDateExtractor(decodedJwt)
    : undefined;
  const publicKey = await verifyCertificateChain(
    leaf,
    intermediate,
    root,
    effectiveDate
  );
  // This is an attempt to replicate node's publicKey.export({ type: "spki", format: "pem" })
  const spkiBuffer = await crypto.subtle.exportKey(
    "spki",
    await publicKey.export()
  );
  // If jwtVerify accepts a CryptoKey you can likely simplify the process by directly
  // using the CryptoKey obtained from exporting the SPKI without converting it to PEM and back
  const base64Spki = Buffer.from(spkiBuffer).toString("base64");
  const pem = `-----BEGIN PUBLIC KEY-----\n${base64Spki
    .match(/.{1,64}/g)!
    .join("\n")}\n-----END PUBLIC KEY-----`;
  let verify = await jwtVerify(jwt, await importX509(pem, "ES384"));
  return verify.payload;
}

async function verifyCertificateChain(
  leaf: X509Certificate,
  intermediate: X509Certificate,
  roots: X509Certificate[],
  effectiveDate?: Date
): Promise<PublicKey> {
  let rootCert: X509Certificate | undefined;
  for (const root of roots) {
    if (
      (await intermediate.verify({
        publicKey: root.publicKey,
      })) &&
      intermediate.issuer === root.subject
    ) {
      rootCert = root;
      break;
    }
  }
  if (!rootCert) {
    throw new Error("Certificate chain verification failed: no root found");
  }
  if (
    !(await leaf.verify({ publicKey: intermediate.publicKey })) ||
    leaf.issuer !== intermediate.subject
  ) {
    throw new Error(
      "Certificate chain verification failed: leaf not signed by intermediate"
    );
  }
  // Check if intermediate is a CA
  {
    // cRLSign = 64,
    const keyUsage = await intermediate.getExtension(KeyUsagesExtension);
    if (!keyUsage || (keyUsage.usages & KeyUsageFlags.cRLSign) !== 0)
      throw new Error(
        "Certificate chain verification failed: intermediate is not a CA"
      );
  }
  // ensure both have 1.2.840.113635.100.6.11.1 extension
  [leaf, intermediate].forEach((cert) => {
    const extension = cert.getExtension("1.2.840.113635.100.6.11.1");
    if (!extension) {
      throw new Error(
        "Certificate chain verification failed: missing receipt extension"
      );
    }
  });
  // Check dates
  if (effectiveDate) {
    [leaf, intermediate, rootCert].forEach((cert) =>
      checkDates(cert, effectiveDate)
    );
  }
  return leaf.publicKey;
}
