// Stub for removed `@lovable.dev/cloud-auth-js` package.
// Keeps the build green when Lovable is not installed.
// Local-first or optional-cloud flows should never reach this at runtime.

export function createLovableAuth(): never {
  throw new Error(
    'Lovable auth is not installed. Use local-first mode or reinstall `@lovable.dev/cloud-auth-js` if you want cloud auth.'
  );
}

export default { createLovableAuth };
