const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const {
  isDbAvailable,
  createVerifiedUser,
  cleanupTestData,
  validFoodDonationPayload,
} = require('./setup');

// Real transport-level Socket.io test — every other chat/report/notification
// test in this suite calls chatService/reportService functions directly,
// which proves the AUTHORIZATION LOGIC is correct but never proves the
// socket.io wiring around it (join_room/send_message handlers, the auth
// handshake middleware, room isolation) actually enforces that logic over
// a real connection. This spins up a real HTTP+socket.io server on an
// ephemeral port and connects real socket.io-client sockets against it.
describe('FINAL AUDIT: real Socket.io transport — chat room join/send authorization', () => {
  let dbReady = false;
  let donationService;
  let httpServer;
  let port;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;

    donationService = require('../../services/donation.service');
    const app = require('../../app');
    const { initializeSocket } = require('../../sockets/index');

    httpServer = http.createServer(app);
    const io = new Server(httpServer, { cors: { origin: '*' } });
    initializeSocket(io);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    if (dbReady) await cleanupTestData();
  });

  function connectClient(accessToken) {
    return ioClient(`http://localhost:${port}`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      forceNew: true,
    });
  }

  function waitForConnect(socket) {
    return new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
  }

  function emitWithAck(socket, event, payload) {
    return new Promise((resolve) => {
      socket.emit(event, payload, resolve);
    });
  }

  test('an authorized participant can connect, join the room, and send a message; the other participant receives it in real time', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor, accessToken: donorToken } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer, accessToken: volunteerToken } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    const donorSocket = connectClient(donorToken);
    const volunteerSocket = connectClient(volunteerToken);

    try {
      await Promise.all([waitForConnect(donorSocket), waitForConnect(volunteerSocket)]);

      const donorJoinAck = await emitWithAck(donorSocket, 'join_room', { donationId: donation.id });
      assert.equal(donorJoinAck.success, true);

      const volunteerJoinAck = await emitWithAck(volunteerSocket, 'join_room', { donationId: donation.id });
      assert.equal(volunteerJoinAck.success, true);

      const messageReceived = new Promise((resolve) => {
        donorSocket.once('new_message', resolve);
      });

      const sendAck = await emitWithAck(volunteerSocket, 'send_message', { donationId: donation.id, message: 'Hello from a real socket!' });
      assert.equal(sendAck.success, true);

      const received = await messageReceived;
      assert.equal(received.message, 'Hello from a real socket!');
      assert.equal(received.sender_id, volunteer.id);
    } finally {
      donorSocket.disconnect();
      volunteerSocket.disconnect();
    }
  });

  test('SECURITY: an unrelated volunteer cannot join another donation\'s chat room over a real socket connection, and cannot send messages into it', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: volunteer } = await createVerifiedUser({ role: 'volunteer' });
    const { accessToken: outsiderToken } = await createVerifiedUser({ role: 'volunteer' });
    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonation(donation.id, volunteer.id);

    const outsiderSocket = connectClient(outsiderToken);

    try {
      await waitForConnect(outsiderSocket);

      const joinAck = await emitWithAck(outsiderSocket, 'join_room', { donationId: donation.id });
      assert.equal(joinAck.success, false);
      assert.equal(joinAck.statusCode, 403);

      // Never successfully joined -> send_message must also be rejected,
      // even though this is the same socket connection making the attempt.
      const sendAck = await emitWithAck(outsiderSocket, 'send_message', { donationId: donation.id, message: 'I should not be able to send this' });
      assert.equal(sendAck.success, false);
    } finally {
      outsiderSocket.disconnect();
    }
  });

  test('SECURITY: connecting with no token (or a garbage token) is rejected at the handshake, before any event can be emitted', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const badSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: 'not-a-real-jwt' },
      transports: ['websocket'],
      forceNew: true,
    });

    try {
      await assert.rejects(() => waitForConnect(badSocket));
    } finally {
      badSocket.disconnect();
    }
  });

  test('the actual assigned team member (not the leader) can join and send over a real socket too', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const teamService = require('../../services/team.service');
    const { setTeamLocation } = require('./setup');
    const teamInvitationModel = require('../../models/teamInvitation.model');

    const { user: donor } = await createVerifiedUser({ role: 'donor' });
    const { user: leader } = await createVerifiedUser({ role: 'volunteer' });
    const { user: member, accessToken: memberToken } = await createVerifiedUser({ role: 'volunteer' });
    const team = await teamService.createTeam(leader.id, { name: 'Socket Test Team' });
    await setTeamLocation(team.id);
    const invitation = await teamInvitationModel.create({
      teamId: team.id,
      invitedBy: leader.id,
      invitedUserId: member.id,
      invitedEmail: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await teamService.acceptInvitation(invitation, member.id);

    const donation = await donationService.createDonation(donor.id, validFoodDonationPayload());
    await donationService.acceptDonationForTeam(donation.id, team.id, leader.id);
    await donationService.assignTeamMemberToDonation(donation.id, team.id, member.id, leader.id);

    const memberSocket = connectClient(memberToken);
    try {
      await waitForConnect(memberSocket);
      const joinAck = await emitWithAck(memberSocket, 'join_room', { donationId: donation.id });
      assert.equal(joinAck.success, true);

      const sendAck = await emitWithAck(memberSocket, 'send_message', { donationId: donation.id, message: 'Assigned member, real socket' });
      assert.equal(sendAck.success, true);
    } finally {
      memberSocket.disconnect();
    }
  });
});
