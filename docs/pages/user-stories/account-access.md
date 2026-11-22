---
title: Account access
---

# Account access

These stories are the behavior of registration, login, and logout. The screens are not in the app yet. The API that supports them is described in [Authentication](../developer-guide/authentication.md).

A person uses one email address and one password. LabOS does not offer another sign-in method here.

## Register

As a research group member, I want to create an account with my email and a password, so that LabOS knows who I am.

- I enter an email address and a password of at least 6 characters.
- A shorter password is rejected before an account is created.
- When email confirmation is required, I am told to confirm the address. I am not signed in, and I cannot use the app until I do.
- When email confirmation is not required, I am signed in as soon as the account is created.
- If the address cannot be registered, I see the error and I am not signed in.

## Log in

As a research group member, I want to sign in with my email and password, so that I can return to LabOS as myself.

- A correct email and password sign me in.
- A wrong password, an unknown address, and an address that is not confirmed yet all fail the same way. I am told the credentials are invalid, and I am not signed in.
- After I sign in, I stay signed in when I refresh the page or come back later, until the session can no longer be renewed or I log out.
- The app renews the session before it expires. I am not asked for my password again while the renewal succeeds.

## Log out

As a research group member, I want to log out, so that another person using this browser cannot continue as me.

- Logging out ends my session on this device and returns me to a signed-out screen.
- Protected pages ask me to log in again.
- A session I still have on another device stays signed in.
- This browser cannot renew the session after logout.

The app drops the saved session immediately. A request that still carries the old access token can succeed until that token expires. After logout the app must stop sending it.
