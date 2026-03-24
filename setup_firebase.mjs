#!/usr/bin/env node

/**
 * Firebase Setup Helper
 * Generates .env variables from Firebase service account JSON
 * 
 * Usage: node setup_firebase.mjs
 */

import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log("\n🔥 Firebase Setup Helper for Image Upload\n");
  console.log("This script will help you configure Firebase for image storage.\n");

  // Step 1: Ask for service account JSON file
  const jsonPath = await question(
    "📄 Enter path to Firebase service account JSON file\n   (Get from Firebase Console → Project Settings → Service Accounts → Generate New Private Key):\n   > "
  );

  // Check if file exists
  if (!fs.existsSync(jsonPath)) {
    console.error("\n❌ File not found:", jsonPath);
    rl.close();
    process.exit(1);
  }

  // Parse JSON
  let serviceAccount;
  try {
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    serviceAccount = JSON.parse(fileContent);
  } catch (err) {
    console.error("\n❌ Invalid JSON file:", err.message);
    rl.close();
    process.exit(1);
  }

  console.log("\n✅ Service account loaded successfully\n");
  console.log("📊 Project Information:");
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  console.log(`   Storage Bucket: ${serviceAccount.project_id}.appspot.com\n`);

  // Step 2: Get storage bucket
  const storageBucket = await question(
    "🪣 Enter your Firebase Storage Bucket\n   (Usually: {project-id}.appspot.com):\n   > "
  );

  // Step 3: Generate .env snippet
  const envSnippet = `
# ====== FIREBASE CONFIGURATION ======
FIREBASE_PROJECT_ID=${serviceAccount.project_id}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
FIREBASE_STORAGE_BUCKET=${storageBucket}
`;

  console.log("\n✨ Generated .env configuration:\n");
  console.log("─".repeat(60));
  console.log(envSnippet);
  console.log("─".repeat(60));

  // Step 4: Ask if they want to save to .env
  const saveToEnv = await question(
    "\nSave to .env file? (yes/no)\n> "
  );

  if (saveToEnv.toLowerCase() === "yes" || saveToEnv.toLowerCase() === "y") {
    const envPath = path.join(process.cwd(), ".env");

    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
      // Remove existing Firebase vars
      envContent = envContent
        .split("\n")
        .filter(
          (line) =>
            !line.startsWith("FIREBASE_PROJECT_ID") &&
            !line.startsWith("FIREBASE_PRIVATE_KEY") &&
            !line.startsWith("FIREBASE_CLIENT_EMAIL") &&
            !line.startsWith("FIREBASE_STORAGE_BUCKET")
        )
        .join("\n");
    }

    // Append new Firebase config
    envContent += envSnippet;

    fs.writeFileSync(envPath, envContent.trim() + "\n");
    console.log(`\n✅ Successfully saved to ${envPath}\n`);
  } else {
    console.log("\n📝 Copy the configuration above to your .env file manually.\n");
  }

  console.log("🎉 Firebase setup complete!\n");
  console.log("📚 Next steps:");
  console.log("   1. Verify .env file has all Firebase variables");
  console.log("   2. Restart your server: npm start");
  console.log("   3. Upload images to test Firebase integration\n");

  rl.close();
}

main().catch(console.error);
