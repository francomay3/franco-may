/**
 * Google sign-in for the moderation page, on the same Firebase project the
 * app uses.
 *
 * DYNAMICALLY IMPORTED, and that is the reason this is its own module rather
 * than a few lines in the page. The Firebase web SDK is several hundred
 * kilobytes; a static import would put it in the shared chunk and every
 * visitor to the site would download an auth library for a page only one
 * person can open.
 *
 * THE CONFIG IS NOT A SECRET. A Firebase `apiKey` is a project identifier,
 * not a credential -- it authorises nothing on its own, which is why Google
 * publishes it in the snippet you paste into a web page. What actually
 * decides who may sign in is the Authorized domains list in the Firebase
 * console, and what decides who may MODERATE is FL_ADMIN_UIDS on the server,
 * checked against a token this browser cannot forge.
 */
const CONFIG = {
  apiKey: 'AIzaSyAfUf_cbOlm5FEmoQEzqcqFXp7RJ4j1OhU',
  authDomain: 'fornlamningar.firebaseapp.com',
  projectId: 'fornlamningar',
  storageBucket: 'fornlamningar.firebasestorage.app',
  messagingSenderId: '797431420216',
  appId: '1:797431420216:web:796181feeb562866005dcd',
};

type Auth = import('firebase/auth').Auth;

let authPromise: Promise<Auth> | null = null;

/** The one Auth instance, created on first use and reused after. */
async function auth(): Promise<Auth> {
  authPromise ??= (async () => {
    const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ]);
    // getApps() first: Next's dev server re-runs modules on every hot
    // reload, and initializeApp twice with the same name throws.
    const app = getApps()[0] ?? initializeApp(CONFIG);
    return getAuth(app);
  })();
  return authPromise;
}

/**
 * Firebase's own error code, or null if this was not a Firebase error.
 *
 * The code is the only part of these errors worth showing: the messages are
 * long and end in a link, and the code is what says which console step was
 * missed.
 */
export function errorCode(e: unknown): string | null {
  if (e && typeof e === 'object' && 'code' in e) {
    return String((e as { code: unknown }).code);
  }
  return null;
}

/**
 * Popup failures that are about the POPUP and not about the account.
 *
 * Each of these means "this browser would not let the popup talk back", and
 * the answer to all of them is the same: go the long way round with a
 * redirect. Notably `popup-closed-by-user` is NOT here -- somebody who closed
 * the window meant to cancel, and bouncing them out of the page for it would
 * be the opposite of what they asked. Neither is
 * `auth/unauthorized-domain`: a redirect fails on exactly the same check,
 * after throwing the page away first.
 */
const POPUP_FAILED = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

/**
 * Sign in with Google. Returns the ID token, or null if a redirect started.
 *
 * A POPUP FIRST, because it keeps the page: for a page whose whole job is one
 * list and one button, coming back through a callback is more machinery than
 * the feature.
 *
 * A REDIRECT WHEN THE POPUP CANNOT WORK, which is not hypothetical. A
 * cross-origin-opener-policy header on the hosting page stops the popup from
 * reaching back to its opener, and the symptom is not an error anybody would
 * recognise: the window opens, Google signs you in, the window closes and
 * the page has not changed. A browser blocking popups outright looks the
 * same.
 *
 * Returning null rather than throwing, because a redirect is not a failure:
 * the caller has nothing to do except let the navigation happen, and the
 * answer arrives from `redirectToken()` on the way back.
 */
export async function signIn(): Promise<string | null> {
  const a = await auth();
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
    await import('firebase/auth');
  try {
    const cred = await signInWithPopup(a, new GoogleAuthProvider());
    return cred.user.getIdToken();
  } catch (e) {
    if (!POPUP_FAILED.has(errorCode(e) ?? '')) {
      throw e;
    }
    await signInWithRedirect(a, new GoogleAuthProvider());
    return null;
  }
}

/**
 * The token from a redirect sign-in, if this load is the way back from one.
 *
 * Null on an ordinary load, which is the common case, so this is safe to call
 * on every mount. It has to be called BEFORE trusting `currentToken`: the
 * redirect result is what completes the sign-in, and asking for the current
 * user first can answer null for somebody who is halfway through one.
 */
export async function redirectToken(): Promise<string | null> {
  const a = await auth();
  const { getRedirectResult } = await import('firebase/auth');
  const cred = await getRedirectResult(a);
  return cred ? cred.user.getIdToken() : null;
}

export async function signOut(): Promise<void> {
  const a = await auth();
  const { signOut: fbSignOut } = await import('firebase/auth');
  await fbSignOut(a);
}

/**
 * The current token if this browser is already signed in, else null.
 *
 * `onAuthStateChanged` and not `currentUser`, because the SDK restores a
 * session from storage asynchronously: read `currentUser` on the first render
 * and it is null even for somebody who signed in yesterday. Unsubscribes
 * after the first answer -- this is a question, not a subscription.
 *
 * Always `getIdToken()`, never a token kept in React state: they expire in
 * an hour and the SDK refreshes them silently, so asking each time is both
 * simpler and more correct than caching one.
 */
export async function currentToken(): Promise<string | null> {
  const a = await auth();
  const { onAuthStateChanged } = await import('firebase/auth');
  return new Promise(resolve => {
    const stop = onAuthStateChanged(a, user => {
      stop();
      resolve(user ? user.getIdToken() : null);
    });
  });
}
