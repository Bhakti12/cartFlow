# Security Policy (SECURITY.md)

We take the security of CartFlow seriously. This document outlines our policy for reporting security vulnerabilities, supported versions, and best practices implemented within the project.

---

## Supported Versions

Only the latest release of CartFlow is actively supported with security patches. If a vulnerability is found, please upgrade to the latest version to ensure you have all active fixes.

| Version | Supported | Notes |
| :--- | :--- | :--- |
| `1.0.x` | Yes | Active main development branch. |
| `< 1.0.0` | No | Beta/development releases. Please upgrade. |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub issues.** 

If you find a security vulnerability, report it privately by sending an email to **bhaktisanghani2002@gmail.com** or by using GitHub's **Private Vulnerability Reporting** feature if enabled.

### What to Include in the Report:
* A detailed description of the vulnerability.
* Steps to reproduce the issue (exploit script, screenshots, request logs, or video).
* Impact analysis (what data can be accessed, modified, or bypassed).

We will acknowledge receipt of your email within **48 hours** and provide a timeline for triage and patch release.

---

## Disclosure Policy

When a vulnerability is reported, we follow a coordinated disclosure process:

1. **Investigation:** We will confirm the vulnerability and assess its severity.
2. **Patching:** We will develop a fix/patch privately.
3. **Coordinated Release:** Once the patch is verified, we will release a new version and publish a Security Advisory describing the vulnerability and its remediation.

We request that you do not disclose the vulnerability publicly until we have released a patch, to protect users currently running the software.

---

## Security Safeguards Implemented

CartFlow is built with security in mind and incorporates the following core protections:

* **Authentication Guard:** API access is restricted using secure JSON Web Tokens (JWT) signed with a private secret key.
* **CSRF Mitigation:** State-changing requests verify custom headers (`X-CSRF-Token`) to prevent Cross-Site Request Forgery.
* **Password Hashing:** User passwords are encrypted using `bcrypt` (a slow, salt-based hashing algorithm) before database storage.
* **Rate Throttling:** SlowAPI protects authentication paths (login, register) from brute-force attempts.
* **Container Isolation:** The FastAPI backend container runs under a custom, non-root user (`appuser` with UID `10001`) to limit potential system-level compromises.
