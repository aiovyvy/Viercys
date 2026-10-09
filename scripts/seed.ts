import { db, listRooms } from "../src/lib/db";
console.log(
  `Seed complete: ${listRooms().length} physical Santorini rooms. Local DB: ${process.env.VIERCYS_DB_PATH || "data/viercys.sqlite"}`,
);
console.log(
  "Local demo staff credentials are in data/demo-staff.json. Keep that file private.",
);
db().close();
