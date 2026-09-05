/**
 * The signed-in merchant.
 *
 * Hard-coded placeholder identity — authentication is not part of this build.
 * When auth lands, replace this constant with the value read from the session
 * so the header and audit trail pick it up without further changes.
 */
export interface MerchantProfile {
  name: string;
  email: string;
  storeName: string;
}

export const MERCHANT_PROFILE: MerchantProfile = {
  name: "Merchant Admin",
  email: "admin@nextgenstore.in",
  storeName: "The Next Gen Store",
};
