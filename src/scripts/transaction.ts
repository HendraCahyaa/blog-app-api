import cron from "node-cron";
import { prisma } from "../lib/prisma.js";

export const expiredTransactionCron = () => {
  cron.schedule("* * * * *", async () => {
    //1. cari dulu transaksi yang expiredAt nya sudah melebihi now & statusnya masih WAITING_FOR_PAYMENT
    const expiredTransations = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_PAYMENT",
        expiredAt: { lte: new Date() },
      },
    });
    //2. looping seluruh transaksi tersebut dan update status transaksi menjadi EXPIRED + balikin kursinya/stoknya
    for (const transaction of expiredTransations) {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "EXPIRED" },
        });
        await tx.product.update({
          where: { id: transaction.productId },
          data: { stock: { increment: transaction.qty } },
        });
      });
      console.log(
        `CRON EXPIRED -> Transaction with id : ${transaction.id} EXPIRED`,
      );
    }
  });
};
