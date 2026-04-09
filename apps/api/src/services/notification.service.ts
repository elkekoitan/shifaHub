// Merkezi bildirim servisi — tum bildirim mantigi burada

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { bildirim } from "../db/schema/bildirim.js";
import { users } from "../db/schema/users.js";
import { sendEmail } from "../services/email.js";

type BildirimType =
  | "randevu_hatirlatma"
  | "randevu_onay"
  | "randevu_iptal"
  | "tedavi_ozeti"
  | "tahlil_sonucu"
  | "mesaj"
  | "egitmen_onay"
  | "sistem"
  | "kvkk";

export async function createNotification(
  userId: string,
  type: BildirimType,
  title: string,
  body: string,
  actionUrl?: string,
) {
  await db.insert(bildirim).values({ userId, type, title, body, actionUrl });
}

export async function notifyUser(
  userId: string,
  type: BildirimType,
  title: string,
  body: string,
  actionUrl?: string,
  sendEmailNotification = false,
) {
  await createNotification(userId, type, title, body, actionUrl);

  if (sendEmailNotification) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (user?.email) {
      await sendEmail(user.email, title, `<p>${body}</p>`);
    }
  }
}

export async function notifyAdmins(title: string, body: string) {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  for (const admin of admins) {
    await createNotification(admin.id, "sistem", title, body, "/admin/sistem");
  }
}

export async function notifyBulk(
  userIds: string[],
  type: BildirimType,
  title: string,
  body: string,
  actionUrl?: string,
) {
  for (const userId of userIds) {
    await createNotification(userId, type, title, body, actionUrl);
  }
}

// Randevu durum bildirimleri
const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: { title: "Randevunuz Onaylandi", body: "Randevunuz egitmen tarafindan onaylandi." },
  cancelled: { title: "Randevu Iptal Edildi", body: "Randevunuz iptal edildi." },
  reminded: { title: "Randevu Hatirlatmasi", body: "Yaklasan randevunuz var." },
  arrived: { title: "Randevu: Geldiniz", body: "Randevunuz icin kaydiniz alindi." },
  treated: { title: "Tedavi Tamamlandi", body: "Tedaviniz basariyla tamamlandi." },
  completed: { title: "Randevu Tamamlandi", body: "Randevunuz tamamlandi." },
  no_show: { title: "Randevu: Katilim Yok", body: "Randevunuza katilmadiniz." },
  ertelendi: { title: "Randevunuz Ertelendi", body: "Randevunuz ertelendi." },
};

export async function notifyAppointmentStatus(
  danisanId: string,
  egitmenId: string,
  status: string,
) {
  const msg = STATUS_MESSAGES[status];
  if (!msg) return;

  const type: BildirimType =
    status === "cancelled"
      ? "randevu_iptal"
      : status === "reminded"
        ? "randevu_hatirlatma"
        : status === "treated"
          ? "tedavi_ozeti"
          : "randevu_onay";

  await createNotification(danisanId, type, msg.title, msg.body, "/danisan/randevu");

  if (["cancelled", "ertelendi", "no_show"].includes(status)) {
    await createNotification(egitmenId, type, msg.title, msg.body, "/egitmen/randevu");
  }
}
