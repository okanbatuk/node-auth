const { createClient } = require("redis");

// Create a client and connect to Redis with the client
const redisClient = createClient();
(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
