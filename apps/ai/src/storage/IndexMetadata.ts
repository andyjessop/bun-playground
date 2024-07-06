import { DurableObject } from "cloudflare:workers";

export class IndexMetadata extends DurableObject {
	async entries() {
		const list = await this.ctx.storage.list();

		return Array.from(list.entries());
	}

	async values() {
		const list = await this.ctx.storage.list();

		return Array.from(list.values());
	}

	async keys() {
		const list = await this.ctx.storage.list();

		return Array.from(list.keys());
	}

	async get(id: string) {
		return this.ctx.storage.get(id);
	}

	async put(id: string, entry: unknown) {
		return this.ctx.storage.put(id, entry);
	}

	async delete(id: string) {
		return this.ctx.storage.delete(id);
	}
}
