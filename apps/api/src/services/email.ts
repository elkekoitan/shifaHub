// Resend Email Service
// Fallback: RESEND_API_KEY yoksa console.log ile simule eder

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "ShifaHub <noreply@shifahub.app>";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SIMULATED] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    return res.ok;
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}

export function sendVerificationEmail(to: string, otp: string) {
  return sendEmail(to, "ShifaHub - Email Dogrulama", `
    <h2>Email Dogrulama</h2>
    <p>Dogrulama kodunuz: <strong>${otp}</strong></p>
    <p>Bu kod 24 saat gecerlidir.</p>
  `);
}

export function sendPasswordResetEmail(to: string, token: string) {
  return sendEmail(to, "ShifaHub - Sifre Sifirlama", `
    <h2>Sifre Sifirlama</h2>
    <p>Sifrenizi sifirlamak icin asagidaki kodu kullanin:</p>
    <p><strong>${token}</strong></p>
    <p>Bu kod 1 saat gecerlidir.</p>
  `);
}

export function sendAppointmentReminder(to: string, date: string, treatmentType: string) {
  return sendEmail(to, "ShifaHub - Randevu Hatirlatma", `
    <h2>Randevu Hatirlatmasi</h2>
    <p>Randevunuz yaklasıyor:</p>
    <p><strong>${date}</strong> - ${treatmentType || "Tedavi"}</p>
    <p>Lutfen zamaninda geliniz.</p>
  `);
}
