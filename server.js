const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, "..", "frontend");

let requests = [
  { id: 1, title: "Can someone explain React hooks?", category: "Programming", description: "I understand components but useEffect still confuses me.", author: "Aarav M." }
];
let users = [{ id: 1, name: "Ananya Mehta", email: "demo@peerlift.local", password: "demo123", course: "Computer Science", skills: "Python, Figma", goals: "React, Statistics" }, { id: 2, name: "Rohan Das", email: "rohan@peerlift.local", password: "rohan123", course: "Computer Science", skills: "React, JavaScript", goals: "UI design" }, { id: 3, name: "Nisha Shah", email: "nisha@peerlift.local", password: "nisha123", course: "Visual Design", skills: "Figma, UI/UX", goals: "JavaScript" }, { id: 4, name: "Kabir Rao", email: "kabir@peerlift.local", password: "kabir123", course: "Mathematics", skills: "Statistics, Excel", goals: "Python" }];

let offers = [];

let messages = [
  { id: 1, from: "Rohan Das", to: "Ananya Mehta", text: "Hi! I can help with React hooks." }
];

const databaseFile = path.join(__dirname, "data.json");
function saveDatabase() { fs.writeFileSync(databaseFile, JSON.stringify({ users, requests, offers, messages }, null, 2), "utf8"); }
if (fs.existsSync(databaseFile)) { try { const db = JSON.parse(fs.readFileSync(databaseFile, "utf8")); users = db.users || users; requests = db.requests || requests; offers = db.offers || offers; messages = db.messages || messages; } catch { saveDatabase(); } } else { saveDatabase(); }

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function serveFrontend(req, res) {
  const requested = req.url === "/" ? "index.html" : req.url.slice(1);
  const safePath = path.normalize(requested).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(frontendDir, safePath);
  if (!filePath.startsWith(frontendDir)) return json(res, 403, { error: "Forbidden" });

  fs.readFile(filePath, (error, data) => {
    if (error) return json(res, 404, { error: "Frontend file not found" });
    const ext = path.extname(filePath);
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  if (req.url === "/api/health") return json(res, 200, { ok: true, service: "PeerLift API" });
  if (req.url === "/api/register" && req.method === "POST") {
    let body = ""; req.on("data", chunk => body += chunk); req.on("end", () => {
      try { const input = JSON.parse(body); if (!input.name || !input.email || !input.password) return json(res, 400, { error: "Name, email, and password are required" }); if (users.some(u => u.email === input.email)) return json(res, 409, { error: "An account with this email already exists" }); const user = { id: Date.now(), name: input.name, email: input.email, password: input.password, course: input.course || "", skills: "", goals: "" }; users.push(user); saveDatabase(); const { password, ...safe } = user; json(res, 201, { user: safe }); } catch { json(res, 400, { error: "Invalid JSON" }); }
    }); return;
  }
  if (req.url === "/api/login" && req.method === "POST") {
    let body = ""; req.on("data", chunk => body += chunk); req.on("end", () => {
      try { const input = JSON.parse(body); const user = users.find(u => u.email === input.email && u.password === input.password); if (!user) return json(res, 401, { error: "Invalid email or password" }); const { password, ...safe } = user; json(res, 200, { user: safe }); } catch { json(res, 400, { error: "Invalid JSON" }); }
    }); return;
  }
  if (req.url === "/api/requests" && req.method === "GET") return json(res, 200, requests);
  if (req.url === "/api/requests" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const item = { id: Date.now(), ...JSON.parse(body) };
        requests.unshift(item);
        json(res, 201, item);
      } catch {
        json(res, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }
  if (req.url === "/api/offers" && req.method === "GET") return json(res, 200, offers);
  if (req.url === "/api/offers" && req.method === "POST") {
    let body = ""; req.on("data", chunk => body += chunk); req.on("end", () => { try { const offer = { id: Date.now(), ...JSON.parse(body), createdAt: new Date().toISOString() }; offers.unshift(offer); saveDatabase(); json(res, 201, offer); } catch { json(res, 400, { error: "Invalid JSON" }); } }); return;
  }
  if (req.url === "/api/messages" && req.method === "GET") return json(res, 200, messages);
  if (req.url === "/api/messages" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const item = { id: Date.now(), ...JSON.parse(body) };
        messages.push(item);
        json(res, 201, item);
      } catch {
        json(res, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  if (req.method === "GET") return serveFrontend(req, res);
  json(res, 404, { error: "Not found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log("PeerLift is running at http://localhost:" + port);
  console.log("API health check: http://localhost:" + port + "/api/health");
});