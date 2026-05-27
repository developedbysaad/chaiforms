import { asc, schema } from "@repo/database";

import { publicProcedure, router } from "../../trpc";

export const themesRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(schema.themes).orderBy(asc(schema.themes.name));
  }),
});
