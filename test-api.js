async function test() {
  const SPREADSHEET_ID = '1t6mOklY72grVr_5nZb6yHNKqXyCYwXozecMypSLe7NA';
  const API_KEY = 'AIzaSyBlyp0zVY9lRlrqYtW7OzUNee3WguBbex8';
  const name = 'Refrigeração (Denylson)';
  
  // Test 1: User's format
  const r1 = encodeURIComponent(name);
  const u1 = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?key=${API_KEY}&ranges=${r1}`;
  console.log("Test 1:");
  const res1 = await fetch(u1);
  console.log(res1.status, await res1.text());

  // Test 2: With quotes
  const r2 = encodeURIComponent(`'${name}'`);
  const u2 = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?key=${API_KEY}&ranges=${r2}`;
  console.log("Test 2:");
  const res2 = await fetch(u2);
  console.log(res2.status, await res2.text());
  
  // Test 3: With quotes and range
  const r3 = encodeURIComponent(`'${name}'!A2:T10000`);
  const u3 = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?key=${API_KEY}&ranges=${r3}`;
  console.log("Test 3:");
  const res3 = await fetch(u3);
  console.log(res3.status, await res3.text());
}
test();
