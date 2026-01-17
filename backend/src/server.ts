import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";
import { startReminderScheduler } from "./services/reminderService";

app.listen(env.port, () => {
  console.log(`API running on port ${env.port}`);

  // Start the reminder scheduler
  startReminderScheduler();
});
