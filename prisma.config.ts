import "dotenv/config";

// Kita gunakan export default objek langsung agar kompatibel dengan Prisma v5
export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "mysql://root:@localhost:3306/wadcapstone",
  },
};