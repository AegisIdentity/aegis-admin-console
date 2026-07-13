import type { PublicKeyCredentialCreationOptionsJSON } from '../api/endpoints';

/**
 * Browser side of the WebAuthn registration ceremony. The server sends creation options with its
 * binary fields (challenge, user id, excluded credential ids) base64url-encoded; we decode them to
 * ArrayBuffers for `navigator.credentials.create`, run the ceremony, then re-encode the authenticator's
 * response (attestationObject + clientDataJSON) as base64url to send back for verification.
 *
 * No secret ever lives here — the private key never leaves the authenticator.
 */

function base64urlToBuffer(value: string): ArrayBuffer {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(base64);
  // Back the view with a concrete ArrayBuffer so it satisfies WebAuthn's BufferSource typing.
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

function bytesToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

export interface PasskeyAttestation {
  attestationObject: string;
  clientDataJSON: string;
}

/** Runs the create() ceremony and returns the base64url attestation to POST to the server. */
export async function createPasskey(
  options: PublicKeyCredentialCreationOptionsJSON,
): Promise<PasskeyAttestation> {
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: base64urlToBuffer(options.challenge),
    rp: options.rp,
    user: {
      id: base64urlToBuffer(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams.map((p) => ({
      type: p.type as 'public-key',
      alg: p.alg,
    })),
    timeout: options.timeout,
    attestation: (options.attestation as AttestationConveyancePreference) ?? 'none',
    authenticatorSelection: options.authenticatorSelection as AuthenticatorSelectionCriteria | undefined,
    excludeCredentials: (options.excludeCredentials ?? []).map((c) => ({
      type: c.type as 'public-key',
      id: base64urlToBuffer(c.id),
    })),
  };

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) {
    throw new Error('Passkey registration was cancelled.');
  }
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    attestationObject: bytesToBase64url(response.attestationObject),
    clientDataJSON: bytesToBase64url(response.clientDataJSON),
  };
}
