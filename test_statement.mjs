import fetch from "node-fetch";

const API = "http://localhost:3000";

async function testStatement() {
  try {
    // Test with customer 3
    const customerId = 3;

    console.log(`\n🔍 Testing Statement API for Customer ${customerId}\n`);

    const response = await fetch(`${API}/api/customers/${customerId}/statement`);
    const data = await response.json();

    console.log("📬 Full Response:");
    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      console.log(`\n❌ Error: ${data.error}`);
      return;
    }

    console.log("\n✅ Response received:");
    console.log(`   Name: ${data.name}`);
    console.log(`   Phone: ${data.phone}`);
    console.log(`   Current Debt: ${data.current_debt}`);
    console.log(`   Credit Limit: ${data.credit_limit}`);
    console.log(`   Starting Balance: ${data.starting_balance}`);

    if (data.transactions) {
      console.log(`\n📊 Transactions (${data.transactions.length} total):\n`);

      data.transactions.forEach((tx, idx) => {
        console.log(`[${idx}] ${(tx.type || 'unknown').padEnd(10)} | ${tx.description || 'بدون وصف'} | Amount: ${tx.amount} | Balance: ${tx.balance} | is_payment: ${tx.is_payment}`);
      });
    }

    console.log(`\n✅ Test completed successfully!`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    console.error(error);
  }
}

testStatement();
