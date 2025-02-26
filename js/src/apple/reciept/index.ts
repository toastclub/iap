import * as pkijs from "pkijs";
import { fromBER } from "asn1js";
import { getAppleRootPem } from "../pem" with { type: "macro" };
import { parseAppReceipt, type AppReceipt } from "./asn1";

export interface IAPReceiptOptions {
  /**
   * Remaining attributes that are undocumented by Apple.
   */
  returnRemaining?: boolean;
  /**
   * If provided, the signature will be verified using the provided certificates.
   * If set to `false`, the signature will not be verified.
   * If not provided, the signature will be verified using Apple's root certificate.
   *
   * To provide, generate compatible certificates based on the code in `pem.ts`
   * This generation can only be done in an environment with OpenSSL and `exec`,
   * so it should be done only once and the certificates should be stored.
   *
   * iap.js includes the root certificate in the bundle as that should be sufficient
   * for most use cases.
   */
  trustedCerts?: pkijs.Certificate[] | false;
  /**
   * Verify that the trusted certificate is valid at the time of verification.
   * If set to `false`, the certificate will not be checked for validity.
   *
   * @default true
   */
  verifyCertTime?: boolean;
}

// Function to parse and verify PKCS7 receipt
async function parsePKCS7(
  receiptBuffer: Buffer<ArrayBuffer>,
  options: IAPReceiptOptions
) {
  // Decode base64

  // Parse the ASN.1 structure
  const asn1 = fromBER(receiptBuffer.buffer);
  if (asn1.offset === -1) {
    throw new Error("Failed to parse ASN.1 structure");
  }

  const cmsContent = new pkijs.ContentInfo({ schema: asn1.result });
  const signedData = new pkijs.SignedData({ schema: cmsContent.content });

  // we get the payload first in case we need to compare the receipt creation date
  let payload = decodePayload(signedData, options);

  if (options.trustedCerts !== false) {
    if (options.verifyCertTime !== false && payload.receiptCreationDate === undefined) {
      throw new Error("Receipt creation date is missing");
    }

    let verifyResult = await signedData.verify({
      signer: 0,
      trustedCerts: options.trustedCerts,
      checkDate: options.verifyCertTime
        ? payload.receiptCreationDate
        : undefined,
    });

    if (verifyResult === false) {
      throw new Error("Signature verification failed");
    }
  }

  return payload;
}

function decodePayload(
  signedData: pkijs.SignedData,
  options: IAPReceiptOptions
) {
  const content = signedData.encapContentInfo.eContent!.valueBlock.valueHexView;

  const payloadAsn1 = fromBER(content);
  if (payloadAsn1.offset === -1) {
    throw new Error("Failed to parse ASN.1 payload");
  }

  const receiptAttributes = payloadAsn1.result.valueBlock.value;

  return parseAppReceipt(receiptAttributes, options);
}

/**
 *
 * @param receipt - The receipt to decode. Can be a base64 string or a Buffer.
 * @param options - Options for decoding the receipt.
 */
export async function verifyReceipt(
  receipt: string | Buffer<ArrayBuffer>,
  options: IAPReceiptOptions = {}
): Promise<AppReceipt> {
  if (typeof receipt === "string") {
    receipt = Buffer.from(receipt, "base64");
  }
  if (options.trustedCerts == undefined) {
    // @ts-expect-error getAppleRootPem is a macro
    let rootCert: String = getAppleRootPem();
    const certBinary = Buffer.from(rootCert, "base64");

    const asn1 = fromBER(certBinary.buffer);
    if (asn1.offset === -1) {
      throw new Error("Failed to parse certificate ASN.1 structure");
    }
    options.trustedCerts = [new pkijs.Certificate({ schema: asn1.result })];
  }

  return parsePKCS7(receipt, options);
}

export { parseAppReceipt, parseInAppPurchaseReceipt } from "./asn1";
