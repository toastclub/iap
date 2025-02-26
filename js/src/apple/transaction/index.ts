import type { X509Certificate } from "@peculiar/x509";
import type { JWTPayload } from "jose";
import { verifyJWT } from "./crypto";
import type { JWSTransactionDecodedPayload } from "./types/JWSTransactionDecodedPayload";
import type { AppTransaction } from "./types/AppTransaction";

function extractSignedDate(decodedJWT: any): Date {
  return decodedJWT.signedDate === undefined
    ? new Date()
    : new Date(decodedJWT.signedDate);
}

export interface IAPTransactionOptions {
  /**
   * @internal
   */
  signedDateExtractor?: (payload: JWTPayload) => Date;
  /**
   * If provided, the signature will be verified using the provided certificates.
   * If undefined, the library will attempt to provide the root certificate.
   * If set to `false`, the signature will not be verified.
   *
   * To provide, generate compatible certificates based on the code in `pem.ts`
   * This generation can only be done in an environment with OpenSSL and `exec`,
   * so it should be done only once and the certificates should be stored.
   */
  rootCertificates?: X509Certificate[] | false;
}

type Modes = {
  /**
   * Verifies and decodes a signedTransaction obtained from the App Store Server API, an App Store Server Notification, or from a device
   * See {@link https://developer.apple.com/documentation/appstoreserverapi/jwstransaction JWSTransaction}
   */
  JWSTransaction: JWSTransactionDecodedPayload;
  /**
   * Verifies and decodes a signed AppTransaction
   * See {@link https://developer.apple.com/documentation/storekit/apptransaction AppTransaction}
   */
  AppTransaction: AppTransaction;
};

const dateParserMap: Record<keyof Modes, (payload: JWTPayload) => Date> = {
  JWSTransaction: extractSignedDate,
  AppTransaction: (t) =>
    t.receiptCreationDate === undefined
      ? new Date()
      : new Date(t.receiptCreationDate as string),
};
/**
 * Parse the transaction response from Apple.
 *
 * @param jwt The JWT response from Apple
 * @param mode The type of the response
 * @param options Options for the parsing
 * @returns The parsed transaction response
 */
export async function parseTransactionResponse<T extends keyof Modes | string>(
  jwt: string,
  mode: T,
  options: IAPTransactionOptions
): Promise<T extends keyof Modes ? Modes[T] : JWTPayload> {
  if (!options.signedDateExtractor && mode in dateParserMap) {
    options.signedDateExtractor = dateParserMap[mode as keyof Modes];
  }
  return verifyJWT(jwt, options);
}

export * from "./types/JWSTransactionDecodedPayload";
export * from "./types/AppTransaction";
export * from "./types/Shared";
export { verifyJWT } from "./crypto";
