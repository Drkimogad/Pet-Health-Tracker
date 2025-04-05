module.exports = async (req, res) => {
  if (req.method === 'POST') {
    // Handle subscription saving
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ success: true });
  }
};
