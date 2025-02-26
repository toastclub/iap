# iap.js

A JavaScript library to validate in-app purchases made on Apple and ~~Android~~.

- Apple verification endpoints do _not_ make external network requests.
- It is WinterTC compatible, meaning it can be used in all JavaScript runtimes, not just node.
- Very lightweight

## Usage

### Apple

There are two methods to verify Apple receipts: [`receipt`](https://developer.apple.com/documentation/appstorereceipts/validating_receipts_on_the_device) and [`transaction`](https://medium.com/@ronaldmannak/how-to-validate-ios-and-macos-in-app-purchases-using-storekit-2-and-server-side-swift-98626641d3ea). They are roughly equivalent, but `transaction` is newer.

In both cases, the basic flow is as follows:

1. Get the receipt from the user's device.
2. Send the receipt to the server for requests that should be authenticated.
3. Call the appropriate verification function. The function handles the following:
   - Parsing the receipt
   - Verifying the signature. At best, we can prove that the receipt was signed by Apple. The library cannot attest that the receipt is not being covertly shared between users.
4. It is your responsibility to check the receipt's contents.
   - Check that the receipt is for the correct product.
   - Check that the receipt is not expired for subscriptions.

#### Receipt

Safeguarding against replay attacks is very difficult. Receipts are only generated at very infrequent intervals (e.g. when a subscription renews).

```javascript
import { verifyReceipt as verifyApple } from "iap.js/apple";
let result = await verifyApple(reciept, options).catch((err) => {
  // throws an error if the receipt is invalid
});
console.log(result.bundleIdentifier);
```

Options is defined as follows:

```typescript
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
}
```

Known errors:

- `Signature verification failed`: The signature did not pass verification. This could be due to a malformed receipt or a malicious actor.
- `Failed to parse certificate ASN.1 structure`: This should never happen. If it does, please open an issue.
- `Failed to parse receipt ASN.1 structure`: The receipt is malformed. This could potentially be due to a bug.
