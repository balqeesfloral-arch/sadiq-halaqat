import { createECDH } from "node:crypto";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();

const publicKey = ecdh.getPublicKey().toString("base64url");
const privateKey = ecdh.getPrivateKey().toString("base64url");

console.log("");
console.log("Sadiq Web Push VAPID keys");
console.log("=========================");
console.log("");
console.log("Public key (VITE_VAPID_PUBLIC_KEY / VAPID_PUBLIC_KEY):");
console.log(publicKey);
console.log("");
console.log("Private key (VAPID_PRIVATE_KEY) — KEEP SECRET:");
console.log(privateKey);
console.log("");
console.log("Recommended VAPID_SUBJECT:");
console.log("https://sadiqh.vercel.app");
console.log("");
console.log("Do not commit the private key to Git.");
