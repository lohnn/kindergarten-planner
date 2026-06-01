// events.js — Server-Sent Events (SSE) hub for realtime sync.
//
// EVENT CONTRACT (consumed by the frontend):
// -------------------------------------------------------------------------
// Transport: SSE over `GET /api/events`. Plain HTTP, no library.
//
// Frames are sent as named SSE events. Each frame looks like:
//
//   event: <name>
//   data: <json payload>
//
// Event names + payload shapes (payloads mirror PATCH partial semantics —
// merge field-by-field, do NOT replace whole records):
//
//   event: assignment
//   data: { type: 'assignment', date: 'YYYY-MM-DD',
//           dropoff_user_id, dropoff_time,
//           pickup_user_id, pickup_time, note, id }
//     -> the full assignment row for that date (same object the PUT returns).
//        `date` locates the affected weekly cell.
//
//   event: day
//   data: { type: 'day', date: 'YYYY-MM-DD',
//           id, user_id, work_location }
//     -> the day/location row (same object the PUT returns).
//        `date` + `user_id` locate the affected cell.
//
//   event: settings
//   data: { type: 'settings', ...allSettingKeyValues }
//     -> the full settings map (same object the PUT returns). No `date`.
//
// Plus a comment keep-alive every ~25s: `: keep-alive\n\n` (ignored by clients,
// keeps idle connections alive through proxies).
//
// Clients should: open the stream, merge incoming events into in-memory state
// field-by-field, and on tab-visible do a full refetch then reconnect.
// -------------------------------------------------------------------------

const clients = new Set();

const KEEPALIVE_MS = 25000;

// Attach a newly-connected SSE response stream.
function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

// Broadcast a change event to every connected client.
// `type` is the discriminator ('assignment' | 'day' | 'settings').
// `payload` is the changed record (the object the route already returns).
function broadcast(type, payload) {
  const data = JSON.stringify({ type, ...payload });
  const frame = `event: ${type}\ndata: ${data}\n\n`;
  for (const res of clients) {
    try {
      res.write(frame);
    } catch (err) {
      // Drop broken connections; the 'close' handler also cleans these up.
      clients.delete(res);
    }
  }
}

module.exports = { addClient, removeClient, broadcast, clients, KEEPALIVE_MS };
