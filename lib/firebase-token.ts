import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verifying a Firebase ID token without firebase-admin and without a secret.
 *
 * A Firebase ID token is an ordinary RS256 JWT signed by Google. Everything
 * needed to check it is public: Google's rotating public keys, and the project
 * id, which appears in the client config that ships inside the APK. So this
 * needs NO service account key -- nothing private in Vercel, nothing to
 * rotate, nothing that can leak. firebase-admin would have wanted one, plus
 * several megabytes of dependency on a serverless function that pays for it
 * on every cold start.
 *
 * What a valid token proves: Google says this person holds this account.
 * Nothing more. It does not say they own any particular device id -- that is
 * what pairing it with X-Author-Id is for, since the device id is a secret
 * only that device holds.
 */
const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

export type VerifiedUser = {
  /** The Firebase uid. Stable for the life of the account. */
  uid: string;
  /** 'google.com', 'password', ... Recorded, never trusted for anything. */
  provider: string;
  email: string | null;
};

/**
 * Check a bearer token and return who it belongs to, or null.
 *
 * Both the issuer and the audience are pinned to the project. Checking only
 * the signature would accept a token minted by ANY Firebase project, since
 * every project on earth is signed by the same Google keys -- so anyone with
 * a free Firebase project could mint themselves an account here. That is the
 * one check that must not be skipped.
 */
export async function verifyFirebaseToken(
  authorization: string | null
): Promise<VerifiedUser | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return null;
  }
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : null;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      // jose enforces exp and nbf itself. A little clock tolerance because
      // the phone's clock is the user's, and a device an hour fast would
      // otherwise be unable to sign in at all.
      clockTolerance: '60s',
    });
    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    if (!uid) {
      return null;
    }
    // `auth_time` exists on Firebase tokens and is when the user actually
    // authenticated, as opposed to when this token was refreshed. Not used
    // yet; noted because it is what a "re-authenticate before deleting your
    // account" check would need.
    const firebase = payload.firebase as
      | { sign_in_provider?: string }
      | undefined;
    return {
      uid,
      provider: firebase?.sign_in_provider ?? 'unknown',
      email: typeof payload.email === 'string' ? payload.email : null,
    };
  } catch {
    // Expired, wrong project, tampered with, or Google unreachable. The
    // caller turns all of these into one 401: telling an unauthenticated
    // client which of them it was is free reconnaissance.
    return null;
  }
}
