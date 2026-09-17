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
 * Sign in with Google and return the ID token.
 *
 * A popup rather than a redirect. A redirect loses the page's state and
 * comes back through a callback that has to be handled; for a page whose
 * whole job is one list and one button, the popup is the shorter path and
 * the failure mode -- the browser blocked it -- is one the user can see and
 * fix.
 */
export async function signIn(): Promise<string> {
  const a = await auth();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const cred = await signInWithPopup(a, new GoogleAuthProvider());
  return cred.user.getIdToken();
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
