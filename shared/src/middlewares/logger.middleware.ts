import { type ServiceBase } from "@workspace/shared/services/service.base";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { createServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { format } from "date-fns";

export const loggerMiddleware = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
	try {
		console.log(`\x1b[35m📑 [${ctx.methodName}] service called at ${currentDate} \x1b[0m`);
		const next_process = await next();
		return next_process;
	} catch (error) {
		if (error instanceof ApiError && error.details.length) {
			console.error(
				`🔴\x1b[31m ${error.statusCode} ERROR - ${error.message} - ${currentDate}\x1b[0m \n`,
				error.details.map((detail) => detail?.stack),
			);
		} else {
			console.error(`🔴\x1b[31m ERROR - `, error, currentDate, "\x1b[0m");
		}
		throw error;
	} finally {
		console.log(`\x1b[35m [${ctx.methodName}] service finished \x1b[0m`);
	}
});
