# 📡 WhisperNet

**The unstoppable, decentralized peer-to-peer mesh network built entirely for the modern web.**

WhisperNet is a Progressive Web App (PWA) that allows devices to communicate, sync databases, and route messages across a mesh network—**even when the internet is completely shut down.** 

By utilizing WebRTC for peer-to-peer data channels, IndexedDB for persistent local storage, and a custom Flooding Algorithm for multi-hop packet routing, WhisperNet guarantees your messages will survive network blackouts, cellular congestion, and government censorship.

---

## ⚡ The Magic: How It Works

WhisperNet operates in two intelligent modes that seamlessly bridge together:

### 1. Global Cloud Mesh (Online Mode)
When connected to the internet, WhisperNet uses PeerJS to connect to a global signaling server. You are assigned a unique ID and can instantly open high-speed data channels with anyone in the world. As new messages are created, they are flooded across the global mesh instantly.

### 2. The Offline Tunnel (Offline Mode)
When the internet drops, browsers enter a heavily locked-down security sandbox. To bypass these limits without requiring a central server, WhisperNet uses a highly advanced **Optical WebRTC Handshake**:
1. The app detects the outage and enters Offline Mode.
2. The user connects to a local, internet-free Wi-Fi network (like a portable travel router or a phone's Mobile Hotspot).
3. The app generates WebRTC Session Descriptions (SDP), heavily compresses them, and renders them as high-density QR codes.
4. Two users physically scan each other's screens to bridge the WebRTC connection. 
5. An invisible, high-speed, persistent data tunnel is established over the local Wi-Fi.

**The Flooding Routing Engine:** You only need to scan *one* person. Once a connection is made, WhisperNet uses a smart flooding algorithm to route packets. If a mesh of 50 people is formed, a message from Person 1 will instantly bounce through everyone's phones to reach Person 50 at lightning speed.

---

## 🌍 Real-World Scenarios & Procedures

WhisperNet shines in the dark. Here is exactly how to use the app when everything goes wrong.

### Scenario A: Natural Disasters (No Cell Service, No Power)
*A hurricane has destroyed local cell towers. You need to coordinate a neighborhood rescue.*

1. **The Setup:** Because you visited `whispernet.com` yesterday, the Progressive Web App (PWA) is permanently cached on your phone. You open it, and the app loads perfectly despite having zero internet.
2. **The Network:** You plug a standard Wi-Fi router into a portable battery pack. It broadcasts a network (e.g., "Rescue_Net").
3. **The Connection:** Neighbors connect their Wi-Fi to "Rescue_Net" and open the app. They click the red **START QR MESH HANDSHAKE**.
4. **The Mesh:** They scan each other's screens. A local mesh forms.
5. **The Result:** Anyone in the neighborhood can send an Alert. The message hops from phone to phone, instantly alerting everyone connected to the local router.

### Scenario B: Oppressive Regimes (Internet Shut Down)
*A government blocks the internet to silence protests. You need to securely distribute escape routes.*

1. **The Setup:** The internet goes dark. Protesters open WhisperNet from their local cache.
2. **The Network:** One protester turns on their phone's **Mobile Hotspot**. Other protesters turn off their cellular data and connect to the hotspot.
3. **The Connection:** The group uses the **QR Mesh Handshake** to form a high-speed local tunnel and share routes instantly.
4. **The "Sneakernet" Expansion:** A protester walks three blocks away to a completely different group. They use the app's **Export Payload** tool to generate a QR code containing their entire encrypted message database. The new group scans it, instantly receiving all the escape routes without ever connecting to a network.

### Scenario C: Remote Wilderness (Hiking, Zero Signal)
*A group of 20 hikers is spread across a mountain. Someone gets injured.*

1. **The Setup:** In the base camp, there is a portable travel router. Hikers in camp are connected via the QR Mesh Handshake.
2. **The Event:** A hiker miles away gets injured. They open WhisperNet and create a "CRITICAL ALERT" with their coordinates. The app acts as a **Store-and-Forward** vault—it saves the message securely to the local database and waits.
3. **The Transfer:** A second hiker walks past. The injured hiker flashes their `Export Payload` QR code. The second hiker scans it, absorbing the SOS message into their phone.
4. **The Result:** The second hiker hikes back to camp. The moment their phone connects to the camp's Wi-Fi router, WhisperNet detects the mesh and automatically blasts the SOS to every single phone in the camp.

### Scenario D: Overloaded Music Festivals
*50,000 people are congesting the cellular tower. Your texts say "Failed to Send".*

1. **The Event:** You have 4 bars of 5G, but nothing loads. You open WhisperNet. It realizes the cloud is congested and falls back to **OFFLINE MODE**.
2. **The Setup:** You turn on your Mobile Hotspot. Your friends connect to it.
3. **The Connection:** You use the **QR Mesh Handshake**.
4. **The Result:** Because WebRTC Wi-Fi Direct completely bypasses the cellular tower, you and your friends can text in real-time to coordinate a meetup spot while everyone else is disconnected.

---

## 🛠️ Developer Setup

Ready to contribute or deploy your own node?

### Prerequisites
- Node.js (v18+)
- Bun (recommended) or npm

### Installation
\`\`\`bash
git clone https://github.com/your-username/WhisperNet.git
cd WhisperNet
bun install
\`\`\`

### Running Locally
To test the offline features, you must run the server on your local network so other devices can access it.
\`\`\`bash
bun dev --host
\`\`\`
*Your terminal will display a \`Network:\` IP address (e.g., \`https://192.168.1.5:5173\`). Open this on your phone while connected to the same Wi-Fi router to test the PWA installation and QR Handshake.*

### Building for Production
\`\`\`bash
bun run build
\`\`\`
Deploy the \`dist/\` folder to Vercel, Netlify, or GitHub Pages. The PWA Service Worker will automatically be generated to enable offline caching.

---

**Built to survive.**
