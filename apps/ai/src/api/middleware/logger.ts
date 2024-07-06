import * as Logger from "../../../../../packages/logger/src/logger";
import type { Context, Next } from "../../types";

export async function logger(c: Context, next: Next) {
	c.set("Logger", Logger);

	await next();
}
