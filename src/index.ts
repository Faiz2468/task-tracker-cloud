// Task Tracker API - testing CI pipeline

export interface Env {
	task_tracker_db: D1Database;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const { pathname } = url;
		const method = request.method;

		// GET /tasks - list all tasks
		if (method === "GET" && pathname === "/tasks") {
			const { results } = await env.task_tracker_db
				.prepare("SELECT * FROM tasks ORDER BY created_at DESC")
				.all();
			return Response.json(results);
		}

		// POST /tasks - create a task
		if (method === "POST" && pathname === "/tasks") {
			const body = await request.json<{ title: string; description?: string }>();
			if (!body.title) {
				return Response.json({ error: "title is required" }, { status: 400 });
			}
			const { success, meta } = await env.task_tracker_db
				.prepare("INSERT INTO tasks (title, description) VALUES (?, ?)")
				.bind(body.title, body.description ?? null)
				.run();
			return Response.json({ success, id: meta.last_row_id }, { status: 201 });
		}

		// PATCH /tasks/:id - update a task's status
		const patchMatch = pathname.match(/^\/tasks\/(\d+)$/);
		if (method === "PATCH" && patchMatch) {
			const id = patchMatch[1];
			const body = await request.json<{ status?: string; title?: string; description?: string }>();
			const { success } = await env.task_tracker_db
				.prepare(
					"UPDATE tasks SET status = COALESCE(?, status), title = COALESCE(?, title), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?"
				)
				.bind(body.status ?? null, body.title ?? null, body.description ?? null, id)
				.run();
			return Response.json({ success });
		}

		// DELETE /tasks/:id
		const deleteMatch = pathname.match(/^\/tasks\/(\d+)$/);
		if (method === "DELETE" && deleteMatch) {
			const id = deleteMatch[1];
			const { success } = await env.task_tracker_db
				.prepare("DELETE FROM tasks WHERE id = ?")
				.bind(id)
				.run();
			return Response.json({ success });
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;