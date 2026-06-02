# security_spec.md

## Data Invariants
1. **Users (`/users/{userId}`)**: Users can create and modify only their own profile where `userId == request.auth.uid`. The `email` field must match the user's authenticating email.
2. **LostItems (`/lost_items/{itemId}`)**: Documents representing lost items can be created with a status of 'lost' by any authenticated and verified user. The `userId` must match `request.auth.uid`. If an item's status becomes `resolved`, it cannot be updated again (terminal state booking).
3. **FoundItems (`/found_items/{itemId}`)**: Similar to LostItems, can be created with character bounds. If status becomes `resolved`, it is locked.
4. **Messages (`/messages/{messageId}`)**: Messages can only be read if the current user is the `senderId` or the `receiverId`. Messages are immutable (no updates or deletes allowed).

## The Dirty Dozen (Vulnerable Payloads)
1. **Identity Spoofing in profile**: User `attacker_uid` trying to write a profile at `/users/victim_uid` with `uid = victim_uid`.
2. **Blanket Read Request on Private Messages**: Unauthenticated user trying to read `/messages/message123`.
3. **Forging Message Sender**: Authenticated user `user1` trying to create message where `senderId = "user2"`.
4. **Message Modification**: Authenticated user trying to update an existing message at `/messages/msg1` to change the text.
5. **Item Location Poisoning**: Authenticated user creating a lost item with a 1MB location string (Denial of Wallet).
6. **Self-Authorization of Item Status**: Authenticated user attempting to update someone else's lost item to `resolved`.
7. **Post-Terminal Status Bypass**: Authenticated user trying to update a lost item that already has status `resolved`.
8. **Invalid Status Injection**: Authenticated user creating an item with `status = "hijacked"`.
9. **Creation Timestamp Spoofing**: Authenticated user setting `createdAt` to a client time years in the future instead of `request.time`.
10. **Spoofing Email Verification**: Authenticated user with unverified email trying to write items when verification is required.
11. **Altering Immutable Field**: Authenticated owner trying to change `userId` or `createdAt` on an existing item update.
12. **Path Injection (ID Poisoning Docs)**: Attempting to use a Document ID filled with illegal chars (e.g. `../` or `$$invalid$$`) to exploit path resolution.

## Test Cases Outline
All these payloads must yield `PERMISSION_DENIED` at the Firestore security rules level. Only validated, structured, and properly authorized calls will pass our "Fortress" rules.
