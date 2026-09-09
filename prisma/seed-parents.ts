import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// Additive parent-login + notices seed. Never deletes.
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = url.startsWith("postgres")
  ? new PrismaPg({ connectionString: url })
  : new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

async function main() {
  const arsh = await db.student.findFirst({ where: { name: "Arshdeep Singh" } });
  const navjot = await db.student.findFirst({ where: { name: "Navjot Kaur" } });
  if (!arsh) throw new Error("Base seed missing — run db:seed first.");

  const pass1 = await bcrypt.hash("Parent@12345", 10);
  const p1 = await db.user.upsert({
    where: { email: "parent.arshdeep@example.com" },
    create: { name: "Arshdeep's Father", email: "parent.arshdeep@example.com", passwordHash: pass1, role: "parent" },
    update: { role: "parent" },
  });
  await db.student.update({ where: { id: arsh.id }, data: { parentId: p1.id } });

  let p2id = p1.id;
  if (navjot) {
    const pass2 = await bcrypt.hash("Parent@12345", 10);
    const p2 = await db.user.upsert({
      where: { email: "parent.navjot@example.com" },
      create: { name: "Navjot's Mother", email: "parent.navjot@example.com", passwordHash: pass2, role: "parent" },
      update: { role: "parent" },
    });
    await db.student.update({ where: { id: navjot.id }, data: { parentId: p2.id } });
    p2id = p2.id;
  }

  const nCount = await db.notice.count();
  if (nCount === 0) {
    await db.notice.createMany({
      data: [
        { schoolId: arsh.schoolId, title: "Parent-Teacher Meeting on Saturday", body: "Class 10-A PTM at 10 AM in the school hall. Please attend with your ward.", audience: "Parents" },
        { schoolId: arsh.schoolId, title: "Winter uniform from Monday", body: "All students must wear full winter uniform starting Monday.", audience: "All" },
      ],
    });
  }
  console.log("Parent seed complete: 2 parent logins, linked children, notices. p2=" + p2id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
