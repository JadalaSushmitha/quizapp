const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Hashed password:', hash);
}

hashPassword('Sushmitha@123');  // <-- Replace with your admin password here
