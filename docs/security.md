# Security & Notes 🔒

## Client-side storage
- The SDK stores an encrypted user key share in `IndexedDB` and session token in `localStorage`.
- The encryption key (`ENCRYPTION_KEY`) must be managed on the server and never embedded in client bundles.

## Best practices
- Use HTTPS/TLS everywhere in production.
- Use environment variable management for server secrets.
- Limit OTP attempts and implement rate limiting on backend.
- Rotate encryption keys and provide migration guidance if necessary.

## Threat model highlights
- Even if IndexedDB contents are exfiltrated, an attacker needs the server-held encryption key to derive the private key.
- The MPC server and backend must have robust access controls and audit logging.

If you'd like, I can add a short document on key rotation and a sample key migration script.
