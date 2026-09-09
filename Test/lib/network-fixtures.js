'use strict';
const http = require('node:http');
const net = require('node:net');
const dgram = require('node:dgram');
const { once } = require('node:events');
const { Transform } = require('node:stream');

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  return {
    server,
    port: server.address().port,
    close: () =>
      new Promise((resolve) => {
        for (const s of sockets) s.destroy();
        server.close(resolve);
      }),
  };
}
async function freePort() {
  const listener = await listen(net.createServer());
  const port = listener.port;
  await listener.close();
  return port;
}
function dnsAnswer(query, address = '203.0.113.7') {
  let end = 12;
  while (query[end]) end += query[end] + 1;
  end += 5;
  const question = query.subarray(12, end);
  const header = Buffer.from(query.subarray(0, 12));
  header.writeUInt16BE(0x8180, 2);
  header.writeUInt16BE(1, 4);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(0, 10);
  const type = query.readUInt16BE(end - 4);
  header.writeUInt16BE(type === 1 ? 1 : 0, 6);
  if (type !== 1) return Buffer.concat([header, question]);
  const record = Buffer.from([0xc0, 0x0c, 0, 1, 0, 1, 0, 0, 0, 30, 0, 4, ...address.split('.').map(Number)]);
  return Buffer.concat([header, question, record]);
}
function dnsQuestion(query) {
  const labels = [];
  for (let i = 12; query[i]; ) {
    const size = query[i++];
    labels.push(query.subarray(i, i + size).toString());
    i += size;
  }
  return labels.join('.');
}
async function fixtures() {
  const seen = [];
  const states = new Map();
  const origin = await listen(
    http.createServer(async (req, res) => {
      const route = req.headers['x-test-route'] || 'DIRECT';
      if (req.url.startsWith('/dns-query')) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const query =
          req.method === 'GET'
            ? Buffer.from(new URL(req.url, 'http://localhost').searchParams.get('dns'), 'base64url')
            : Buffer.concat(chunks);
        seen.push({ kind: 'dns', route, name: dnsQuestion(query) });
        res.writeHead(200, { 'Content-Type': 'application/dns-message' });
        res.end(dnsAnswer(query));
        return;
      }
      if (req.url.startsWith('/health')) {
        res.writeHead(states.get(route)?.healthStatus ?? 200);
        res.end('health');
        return;
      }
      seen.push({ kind: 'http', route, host: req.headers.host, url: req.url });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.url.startsWith('/hold')) {
        res.write(JSON.stringify({ route }) + '\n');
        const timer = setInterval(() => res.write(JSON.stringify({ route }) + '\n'), 100);
        res.on('close', () => clearInterval(timer));
        return;
      }
      res.end(JSON.stringify({ route }));
    }),
  );
  const proxies = [];
  for (const name of ['US 01', 'US 02', 'JP 01', 'HK 01']) {
    const state = { online: true, healthStatus: 200 };
    states.set(name, state);
    const proxy = http.createServer((req, res) => {
      res.writeHead(400);
      res.end();
    });
    proxy.on('connect', (req, client, head) => {
      seen.push({ kind: 'connect', route: name, target: req.url });
      if (!state.online) {
        client.end('HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n');
        return;
      }
      const port = Number(req.url.slice(req.url.lastIndexOf(':') + 1));
      if (port !== origin.port) {
        client.end('HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n');
        return;
      }
      const upstream = net.connect({ host: '127.0.0.1', port });
      upstream.on('error', () => client.destroy());
      client.on('error', () => upstream.destroy());
      client.on('close', () => upstream.destroy());
      upstream.on('close', () => client.destroy());
      upstream.on('connect', () => {
        client.write('HTTP/1.1 200 Connection established\r\n\r\n');
        let buffer = Buffer.alloc(0),
          bodyRemaining = 0;
        const tagger = new Transform({
          transform(chunk, encoding, done) {
            buffer = Buffer.concat([buffer, chunk]);
            while (buffer.length) {
              if (bodyRemaining) {
                const size = Math.min(bodyRemaining, buffer.length);
                this.push(buffer.subarray(0, size));
                buffer = buffer.subarray(size);
                bodyRemaining -= size;
                if (bodyRemaining) break;
                continue;
              }
              const end = buffer.indexOf('\r\n\r\n');
              if (end < 0) break;
              const headers = buffer.subarray(0, end).toString();
              const length = /\r\nContent-Length:\s*(\d+)/i.exec(headers);
              bodyRemaining = length ? Number(length[1]) : 0;
              this.push(Buffer.from(headers + '\r\nX-Test-Route: ' + name + '\r\n\r\n'));
              buffer = buffer.subarray(end + 4);
            }
            done();
          },
        });
        client.pipe(tagger).pipe(upstream);
        if (head.length) tagger.write(head);
        upstream.pipe(client);
      });
    });
    const listener = await listen(proxy);
    proxies.push({ name, ...listener });
  }
  const udp = dgram.createSocket('udp4');
  udp.on('message', (query, remote) => {
    seen.push({ kind: 'dns', route: 'DIRECT-UDP', name: dnsQuestion(query) });
    udp.send(dnsAnswer(query, '127.0.0.1'), remote.port, remote.address);
  });
  udp.bind(0, '127.0.0.1');
  await once(udp, 'listening');
  return {
    origin,
    proxies,
    states,
    seen,
    udpPort: udp.address().port,
    subscription: () => ({
      proxies: proxies.map(({ name, port }) => ({ name, type: 'http', server: '127.0.0.1', port })),
    }),
    close: async () => {
      await Promise.all(proxies.map((p) => p.close()));
      await origin.close();
      await new Promise((resolve) => udp.close(resolve));
    },
  };
}
function request({ proxyPort, url, headers = {}, timeout = 5000 }) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: proxyPort,
        method: 'GET',
        path: url,
        headers: { Host: target.host, ...headers },
        agent: false,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}
module.exports = { fixtures, freePort, request, dnsAnswer };
