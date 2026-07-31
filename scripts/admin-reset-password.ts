import { resetSingleEditorPassword } from "./lib/admin-reset-password";
import { openScriptDatabase } from "./lib/database";
import { readMaskedSecret } from "./lib/masked-secret";

const { db, client, environment } = openScriptDatabase();

try {
  const targetEmail = process.env.ADMIN_RESET_EMAIL ?? environment.ADMIN_EMAIL;
  const newPassword = await readMaskedSecret({
    environmentVariable: "ADMIN_RESET_PASSWORD",
    prompt: "New editor password",
  });
  const result = await resetSingleEditorPassword({
    db,
    environment,
    targetEmail,
    newPassword,
  });
  console.log(`Reset the single editor password for ${result.email}.`);
  console.log(
    "Existing sessions were invalidated. The password was not shown.",
  );
} finally {
  await client.end();
}
