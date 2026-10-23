# LanSphere Repository Audit

**Audit date:** 2026-10-23  
**Scope:** Existing repository inspection, frontend production build, backend test/package/startup checks, and one safe TCP chat integration fix. This report evaluates code paths; it does not claim live multi-node network behavior was tested.

## Executive summary

LanSphere has a substantial Spring Boot and React implementation. The browser UI is connected to REST endpoints for authentication, users, chat, groups, files, dashboard, notifications, and network status. The React production build passes. Java source includes UDP discovery, peer expiry, a framed TCP packet protocol, encrypted packets, chunked transfer, screen capture, and network counters.

The networking modules are not yet end-to-end complete. In particular, the raw TCP file-transfer service has no HTTP/UI bridge; screen sharing automatically accepts remote start requests without user consent; TCP peer identity is not authenticated; and monitor values mix measured, estimated, and simulated values. The WebSocket broker is configured but no application message mappings were found; current chat uses REST polling and server-side broadcasts. Maven 3.9.11 was installed in the user profile; backend tests, packaging, and startup checks now pass, though no automated backend tests exist.

One clear defect was fixed during this audit: the TCP chat relay had treated the sender username as the numeric conversation ID. It now passes sender and receiver separately and checks that both users are participants in the referenced conversation.

## Repository structure

- `lansphere-client/`: React 18, TypeScript, Vite, Zustand, Axios; pages, layout, API services, and stores under `src/`.
- `lansphere-server/`: Spring Boot 3.2.5, Java 21, REST controllers, JPA entities/repositories, services, JWT security, SQLite configuration, WebSocket broker, and `network/` TCP/UDP modules.
- `docs/PROJECT_AUDIT.md`: this report.
- No backend test sources or frontend test/lint scripts were present in the inspected tree.

## Build and test results

| Check | Command | Result |
|---|---|---|
| Frontend production build | `npm run build` in `lansphere-client` | **Passed**: TypeScript compilation and Vite production build completed. |
| Backend tests | `mvn test` in `lansphere-server` (Maven 3.9.11, Java 21) | **Passed**: build succeeds, but Maven reports **No tests to run**; no backend tests exist. |
| Backend package | `mvn package` in `lansphere-server` | **Passed**: compiled 100 Java source files and produced the repackaged Spring Boot JAR. |
| Backend startup | `mvn spring-boot:run` in `lansphere-server` | **Passed**: SQLite initialized, REST on port 8080, TCP on 39394, UDP on 39393; demo seed completed. Verification process was stopped after startup. |
| Frontend lint/tests | Not configured | `package.json` defines only `dev`, `build`, and `preview`. |
| Live application / LAN checks | Not run | No database, multi-node, firewall, or interactive browser validation was performed. |

## Frontend findings

| Feature | Status | Evidence and next action | Priority |
|---|---|---|---|
| Login and session | **Partial** | `src/pages/AuthPage.tsx`, `src/stores/useAuthStore.ts`, and `src/services/authService.ts` use backend auth; JWT/user are stored in localStorage. Verify runtime against a started backend and consider safer token storage for the deployment threat model. | High |
| Dashboard and stats | **Partial** | `src/pages/DashboardPage.tsx` calls dashboard/network services, but labels transfer speed as MB/s while API reports Mbps. Correct units and distinguish estimates from measurements. | Medium |
| Users/profile | **Partial** | `src/pages/UsersPage.tsx`, `src/pages/SettingsPage.tsx`, and `src/services/userService.ts` use REST services. Live LAN discovery is separate from persisted user records; verify semantics at runtime. | Medium |
| Chat | **Partial** | `src/pages/ChatPage.tsx` loads/sends persisted messages and polls every 3.5 seconds. Typing feedback is explicitly simulated; WebSocket/STOMP is not used by the browser. Remove simulation or implement real typing events. | High |
| Groups | **Partial** | `src/pages/GroupsPage.tsx` uses group APIs; endpoint authorization/business rules should be exercised with multiple accounts. | Medium |
| File sharing and previews | **Partial** | `src/pages/FileSharingPage.tsx` uploads to `/files/upload`, displays previews/downloads, and receives upload progress. This is server-local multipart storage, not the raw chunked peer-transfer service. Backend assigns a fixed simulated transfer speed. | High |
| Download manager/history | **Partial** | `src/pages/DownloadsPage.tsx` and file services retrieve backend records/download blobs. Browser download location is controlled by the browser; no configurable local destination is implemented. | Medium |
| Notifications | **Partial** | Notification APIs and drawer are connected, but `AppLayout.tsx` polls. STOMP config exists without a browser subscription in the inspected client. | Medium |
| Network monitoring | **Partial** | `src/pages/NetworkMonitorPage.tsx` polls real backend counters, but latency can be localhost fallback, bandwidth is cumulative bytes represented as a rate, gateway/subnet/link capacity are approximations, and no historical sampling backend exists. Label/correct these values. | High |
| Theme/settings | **Partial** | Theme persists in localStorage. Profile fields are API-backed; verify all settings against backend behavior. | Low |
| Loading/error/responsive states | **Partial** | Components include loading/empty and error handling in several places, but some errors only reach `console.error`; systematically surface recoverable failures to the user. Layouts use responsive Tailwind classes. | Medium |

## Backend findings

| Area | Status | Evidence and next action | Priority |
|---|---|---|---|
| REST application and persistence | **Partial** | Controllers/services/repositories and JPA entities exist under `lansphere-server/src/main/java/com/lansphere/`. SQLite and `ddl-auto=update` are configured in `src/main/resources/application.properties`. Startup and SQLite initialization were verified; endpoint behavior and persistence across restart were not tested. | High |
| Authentication/password storage | **Partial** | `SecurityConfig` uses BCrypt, stateless JWT, and protects most REST routes. JWT secret is hardcoded in `application.properties`; replace with required environment configuration and rotate any exposed value. Demo accounts use known `password123` credentials. | Critical |
| Authorization and file access | **Broken / Critical gap** | `SecurityConfig` permits `/uploads/**`, and `FileTransferController.downloadFile` permits a null requester. `FileTransferService.loadFileAsResource` does not enforce ownership/recipient/conversation membership. Require authentication and authorize each download. | Critical |
| Validation and exceptions | **Partial** | Request DTO validation and `GlobalExceptionHandler` exist. No automated checks could be run; audit endpoint-specific validation/authorization. | Medium |
| Pagination/search | **Partial** | Chat has a paged endpoint and search; other list endpoints commonly return full collections. Apply bounded pagination where data grows. | Medium |
| WebSocket | **Partial** | `WebSocketConfig` enables STOMP broker endpoints. No `@MessageMapping` or client subscription was found; chat/notifications currently use REST polling plus server broadcasts. Implement one clear ownership path if realtime delivery is required. | Medium |
| Seed data | **Partial** | `config/DataInitializer.java` seeds four demo users, conversations, messages, group and logs using known default passwords and example network identities. Restrict to a demo profile or require explicit seed configuration outside development. | High |
| File upload | **Partial** | `FileTransferService` persists metadata and SHA-256 for uploaded content under generated storage names. It stores the original name and serves MIME metadata. Add per-resource authorization, file validation, and safer response header construction before deployment. `transferSpeed` is hardcoded to 100 MB/s. | Critical |
| Logging/configuration | **Partial** | Network warnings/errors are logged, but secrets are literals and transfer directories are relative defaults. Move secrets and deployment-specific values to environment configuration. | High |

## Networking core

| Module | Status | Evidence and next action | Priority |
|---|---|---|---|
| UDP discovery | **Partial** | `network/discovery/UdpPeerDiscoveryService.java` binds a configured UDP port, sends loopback and limited-broadcast discovery, responds to peers, and uses node IDs. It does not select interfaces/subnet broadcasts; firewall and multi-interface behavior are unverified. | High |
| Heartbeat/presence | **Partial** | `network/heartbeat/HeartbeatService.java` sends heartbeats and expires peers using configured intervals; `PeerRegistry` emits online/offline callbacks. Heartbeat packet identity is unauthenticated and transition integration with persisted users/UI is incomplete. | High |
| TCP chat | **Partial** | `network/chat/TcpSocketEngine.java` accepts concurrent connections and ACKs/deduplicates packets; `NetworkChatRelay` calls persistence. This audit fixed its sender/receiver/conversation mismatch and added conversation-membership checks. Cross-node user/conversation identity mapping still needs an explicit shared identity model and integration testing. | High |
| Application protocol | **Partial** | `network/LanSpherePacket.java` and `network/protocol/PacketCodec.java` define magic/version/opcode, packet ID, length bound and SHA-256 payload digest. SHA-256 is an integrity check, not authentication; metadata is not authenticated and there are no protocol compatibility tests. | High |
| Raw TCP file transfer | **Partial / Not integrated** | `network/transfer/ReliableFileTransferService.java` implements chunks, ACKs, checksum, cancellation/resume methods. No controller/UI calls its `transfer`, `resume`, or `cancel` methods. Receiver stores by basename, uses append offsets and in-memory sessions, so collisions, restart recovery, and robust partial-file handling need work. | High |
| Screen sharing | **Partial / Unsafe default** | `network/streaming/ScreenStreamingService.java` captures/scales JPEG frames and sends encrypted TCP packets; REST exposes start/stop/frame. Incoming start request automatically begins capture; no user-consent gate or peer authorization exists. Headless environments cannot capture. Add consent/auth before enabling. | Critical |
| Encryption/key management | **Partial / Insecure defaults** | `AesGcmCryptoSuite` uses AES-GCM with random 12-byte IV and 128-bit tag for CHAT/FILE/SCREEN payloads. `NetworkKeyProvider` hashes a configured shared secret; default secret is public and peers sharing it are mutually trusted. Discovery/ACK/identity are not authenticated. Add secret provisioning and peer authentication/key rotation design. | Critical |
| Network metrics | **Partial / Misleading labels** | `NetworkMetrics` counts packet/byte totals and TCP RTT. `NetworkMonitorService` derives a cumulative byte total as Mbps, uses localhost reachability fallback, hardcodes 1 Gbps and estimates gateway/subnet; packet-loss denominator mixes received/sent/failed counters. Use interval deltas and peer RTT sampling, expose units/source/validity. | High |

## Hardcoded data, placeholders, and TODOs

- `config/DataInitializer.java`: demo identities, private LAN addresses/MACs, canned messages and known `password123` passwords.
- `src/main/resources/application.properties`: literal JWT secret and `change-this-lansphere-network-secret` default.
- `service/FileTransferService.java`: fixed `transferSpeed(104857600L)` simulated 100 MB/s value.
- `service/NetworkMonitorService.java`: estimated gateway/subnet/link capacity and localhost latency fallback.
- `client/src/pages/ChatPage.tsx`: simulated typing indicator.
- No TODO/FIXME markers were found in the inspected frontend/backend source search.

## Architecture and integration

Browser React cannot open arbitrary Java TCP/UDP sockets. The existing direction—REST for controls, Java UDP/TCP services for LAN operations, and WebSocket for browser events—is appropriate. Keep one persistence/chat ownership path: raw TCP packets should validate peer/user/conversation mapping and call existing services; browser chat should use REST or a real authenticated WebSocket subscription rather than a parallel store. Raw file transfer currently sits alongside, but is not integrated with, the REST upload service. Define which transfer path is supported before exposing it as a product feature.

## Safe change made

- Updated `network/chat/NetworkChatRelay.java` and `service/ChatService.java` so network chat passes sender and receiver usernames separately instead of trying to parse the sender as a conversation ID. The receiver now validates that both users participate in the named conversation. Backend package and startup checks passed after the change; the frontend build does not cover Java code.

## Recommended implementation order

1. **Critical:** Protect file downloads with authentication and per-file authorization; remove/replace hardcoded JWT and network secrets; gate screen capture behind explicit consent and authenticated peers.
2. Install/use Maven or add a project Maven wrapper, then run backend tests/package and fix verified defects. Add focused tests for the chat relay/protocol.
3. Run two real nodes on a controlled LAN; verify UDP interface/broadcast, heartbeat expiry, TCP reconnect and identity mapping.
4. Integrate either raw chunked file transfer or the REST upload path with the UI; add collision-safe partial files, restart-safe resume, cancellation/progress, and access controls.
5. Correct telemetry units and derive interval throughput/peer RTT from measured samples; label approximations.
6. Choose and implement authenticated WebSocket delivery or retain polling intentionally; remove simulated typing/replies.
7. Test screen-sharing consent, headless behavior, load, and frame lifecycle; then conduct multi-client and failure-recovery checks.

## Known limitations

- Maven 3.9.11 was installed for the current user under `%LOCALAPPDATA%\Programs\Apache-Maven\apache-maven-3.9.11`; it was added to the user's PATH. Open a new terminal for the PATH change to take effect, or invoke `mvn.cmd` from that install directory.
- No backend tests were found, so the successful `mvn test` run did not execute assertions.
- No live database/application launch, multi-client test, firewall/interface test, security test, or performance measurement was run.
- React build proves type-checking and bundling only; it does not prove API availability or feature behavior.
- TCP/UDP communication requires LAN reachability and firewall rules; UDP broadcast may be filtered or unavailable across VLANs/Wi-Fi isolation.
- Screen capture requires a graphical desktop; shared-secret distribution is external/manual with current code.
