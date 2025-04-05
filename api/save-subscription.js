export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); // Allow specific HTTP methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Handle preflight requests
  }

  if (req.method === "POST") {
    try {
      const subscription = req.body.subscription; 
      if (!subscription) {
        throw new Error("No subscription data received.");
      }

      console.log("Received subscription:", subscription);

      // Debug response before sending
      const responseData = { message: "Subscription saved successfully" };
      console.log("Response being sent:", responseData); // 🔹 Add this log

      res.setHeader("Content-Type", "application/json"); // Ensure JSON response
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Error saving subscription:", error.message);
      return res.status(500).json({ error: `Failed to save subscription: ${error.message}` });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
