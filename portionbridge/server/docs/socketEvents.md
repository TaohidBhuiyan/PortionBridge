# Socket.IO Reference

This documents the real-time layer in `server/sockets/`. Nothing here is
aspirational — every event, room, and payload below was read directly from
the handler code. If the handlers change, this file must be updated to match.

## Connecting & authentication

Connect to the same origin/port the REST API runs on (Socket.IO is attached
to the same HTTP server — see `server.js`). Authentication happens at the
handshake, via `sockets/middleware/socketAuth.middleware.js`:

```js
const socket = io(SERVER_URL, {
  auth: { token: accessToken }, // the same JWT access token used for REST "Authorization: Bearer"
});
```

- The token is read from `socket.handshake.auth.token` first, falling back to
  an `Authorization: Bearer <token>` header on the handshake for non-standard
  clients.
- On success, the socket is authenticated as `socket.user = { id, role, email, name }`
  — the same shape as `req.user` on the REST side.
- On failure (missing/invalid/expired token, user no longer exists, or user
  is banned), the server calls `next(new Error(message))`, which the client
  receives as a `connect_error` event with `err.message` set to a
  human-readable string (never a raw stack trace).

### Token expiry while connected

Unlike the initial handshake, Socket.IO does not re-check the token on every
message. To avoid a socket staying "logged in" past its access token's
expiry (which every REST call *does* re-check), the server schedules a
forced disconnect for the exact moment the token expires:

- Server emits **`token_expired`** — payload: `{ message: string }`
- Server then calls `socket.disconnect(true)`

**Client expectation:** on `token_expired`, call `POST /api/v1/auth/refresh-token`
to get a new access token, then reconnect with it — the same refresh flow
already required for REST 401s.

## Rooms

Two room-naming conventions exist:

```
donation_<donationId>   e.g. "donation_88"
team_<teamId>           e.g. "team_5"
```

(See `sockets/rooms.js#getDonationRoomName` for donation rooms.) There is no "user room" or
global room — per-user real-time delivery (notifications) is done by
tracking each user's live socket IDs in `sockets/socketRegistry.js` and
emitting directly to those socket IDs, not via a room.

A socket is only ever in **at most one** `donation_*` room at a time — joining
a new one automatically leaves any other `donation_*` room first (the UI only
supports one active conversation). Similarly, a socket can be in at most one
`team_*` room at a time.

## Acknowledgement shape

Every client-initiated event below takes an `(payload, callback)` signature.
The ack callback is always called with one of:

```js
// success
{ success: true, message: string, data: any }

// failure
{ success: false, message: string, statusCode: number | null }
```

`statusCode` is semantic metadata only (sockets have no real HTTP response) —
lets the client distinguish e.g. 403 vs 404 vs 400 the same way it would for
a REST call. See `sockets/utils/socketResponse.js`.

## Events the client sends (with acknowledgement)

### `join_room`
The **only** way a socket is added to a donation's chat room. Also marks any
unread messages in that conversation as read (in the same call).

- **Payload:** `{ donationId: number }`
- **Authorization:** must be the donor who owns the donation or its assigned
  volunteer — enforced inside `chatService.markConversationRead`, which is
  also where the `donationId` itself is validated.
- **Ack `data`:** `{ donationId: number, roomName: string }`
- **Side effect:** if this call actually marked messages as read, the server
  also broadcasts `messages_read` (see below) to everyone in the room.
- Idempotent — joining a room you're already in returns
  `"Already in this chat room."` instead of re-processing.

### `leave_room`
- **Payload:** `{ donationId: number }`
- **Authorization:** none required to leave (worst case is a harmless no-op).
- **Ack `data`:** `{ donationId: number }`

### `send_message`
Persists a chat message and broadcasts it to the room, including back to the
sender.

- **Payload:** `{ donationId: number, message: string }`
- **Preconditions:** the socket must have already `join_room`'d this
  donation's room (checked via `socket.rooms.has(...)` before even calling
  the service) — otherwise a `403` ack is returned. The real authorization
  and validation, however, happens inside `chatService.sendMessage`
  independently of that room-membership check.
- **Ack `data`:** the saved message row (same shape as the `new_message`
  broadcast below).
- **Side effect:** broadcasts `new_message` to the room (see below).

### `get_unread_count`
On-demand total unread notification count for the authenticated user (the
"sync me up" case on reconnect — the server does not proactively push this
except via the events below).

- **Payload:** none (first argument is ignored)
- **Ack `data`:** `{ unreadCount: number }`

### `join_team_room`
Joins a team's room for real-time team updates.

- **Payload:** `{ teamId: number }`
- **Authorization:** must be a member of the team
- **Ack `data`:** `{ teamId: number, roomName: string }`
- Idempotent — joining a room you're already in returns
  `"Already in team room."` instead of re-processing.

### `leave_team_room`
- **Payload:** `{ teamId: number }`
- **Authorization:** none required to leave (worst case is a harmless no-op).
- **Ack `data`:** `{ teamId: number }`

### `send_team_announcement`
Sends an announcement to all team members (team leader only).

- **Payload:** `{ teamId: number, message: string }`
- **Authorization:** must be the team leader
- **Ack `data`:** `{ teamId: number }`
- **Side effect:** broadcasts `team_announcement` to the team room

### `get_team_state`
Fetches current team state (members, etc.).

- **Payload:** `{ teamId: number }`
- **Authorization:** must be a member of the team
- **Ack `data`:** Team object with members

## Events the server pushes (no acknowledgement — plain `socket.emit`/`io.to().emit`)

### Chat (broadcast to the `donation_<id>` room)

| Event | Payload | When |
|---|---|---|
| `new_message` | The saved chat message row: `{ id, donation_request_id, sender_id, sender_name, sender_role, message, is_read, created_at }` | After a successful `send_message` |
| `messages_read` | `{ donationId: number, readBy: number }` | After a `join_room` call that actually marked unread messages as read |

### Notifications (sent directly to the user's own socket(s), not a room —
delivered from `services/notification.service.js`, called wherever a
notification is created elsewhere in the app: donation acceptance, status
changes, ratings received, reports filed, etc.)

| Event | Payload | When |
|---|---|---|
| `notification` | The full notification row: `{ id, user_id, type, title, message, related_id, is_read, created_at }` | A new notification is created for this user |
| `notification_count_updated` | `{ unreadCount: number }` | Alongside `notification` (new one created), after `notification_read` (one marked read), and after `notifications_read` (all marked read, always `unreadCount: 0`) |
| `notification_read` | `{ notificationId: number }` | The user marks one notification as read (via `PATCH /api/v1/notifications/:notificationId/read`) |
| `notifications_read` | `{ updatedCount: number }` | The user marks all notifications as read (via `PATCH /api/v1/notifications/read-all`) |

### Team (broadcast to the `team_<id>` room)

| Event | Payload | When |
|---|---|---|
| `team_announcement` | `{ teamId: number, senderId: number, senderName: string, message: string, timestamp: string }` | After a successful `send_team_announcement` |
| `team_activity` | `{ teamId: number, eventType: string, data: object, timestamp: string }` | Team events: member_joined, member_left, leader_changed, donation_assigned, donation_completed |

### Connection lifecycle

| Event | Payload | When |
|---|---|---|
| `token_expired` | `{ message: string }` | The access token used at handshake has expired; followed immediately by a forced disconnect |

## Reconnection expectations

Socket.IO's client reconnects automatically by default; this server adds no
custom reconnection logic. On reconnect, the client goes through the same
handshake auth as any new connection — if the access token used for `auth.token`
is expired, the reconnect attempt itself will fail with the same
`connect_error` behavior described above, and the client must refresh its
access token via the REST endpoint before retrying.

There is no message-replay/catch-up mechanism built into the socket layer
itself — after reconnecting, a client should call
`GET /api/v1/chat/:donationId/messages` (and `GET /api/v1/notifications`) to
resynchronize state, then `join_room` again for any conversation it wants to
resume receiving live messages for.

## Known gap
`get_unread_count` (notifications) returns a total count but there's no
equivalent socket event to fetch the initial state of a *chat* conversation's
unread count on connect — the client is expected to use the REST endpoint
(`GET /api/v1/chat/:donationId/unread-count` or
`GET /api/v1/chat/unread-count`) for that instead. Not a bug, just worth
knowing when wiring up a client.
