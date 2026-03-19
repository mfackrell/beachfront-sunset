const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  try {
    const { fullName, email, property, revenueRange } = req.body || {};

    if (!fullName || !email || !property) {
      return res.status(400).json({
        ok: false,
        error: "Please complete all required fields.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email address.",
      });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BeachFront Sunset STR <booking@beachfrontsunset.com>",
        to: ["booking@beachfrontsunset.com"],
        reply_to: email,
        subject: "New Property Performance Review Request",
        text: [
          "A new property performance review request was submitted.",
          "",
          `Name: ${fullName}`,
          `Email: ${email}`,
          `Property: ${property}`,
          `Revenue Range: ${revenueRange || "Not provided"}`,
          `Submitted At: ${new Date().toISOString()}`,
        ].join("\n"),
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend send error", resendError);
      return res.status(502).json({
        ok: false,
        error: "We could not send your request right now. Please try again.",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Audit request handler error", error);
    return res.status(500).json({
      ok: false,
      error: "Unexpected server error.",
    });
  }
};
