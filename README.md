# CryptWill
A Web3-powered digital inheritance platform built on Stellar that securely transfers crypto assets and digital estates using a Dead Man's Switch, guardian consensus, Soroban smart contracts, and encrypted vaults—ensuring digital wealth is never permanently lost.

## Setup

From the repo root, run `./setup.ps1` to install both app dependencies. Use `./setup.ps1 -BackendOnly` if you only want to refresh the backend install, which includes sql.js.

### Email provider

CryptWill can send mail through Brevo SMTP or Resend. To use Brevo, set these backend env vars:

- `BREVO_SMTP_HOST=smtp-relay.brevo.com`
- `BREVO_SMTP_PORT=587`
- `BREVO_SMTP_USER=your_brevo_login`
- `BREVO_SMTP_PASS=your_brevo_password`
- `BREVO_FROM=CryptWill <noreply@your-domain.com>`

If email delivery is unavailable, the Guardians page now includes a copyable invite link so guardians can still sign up manually.
