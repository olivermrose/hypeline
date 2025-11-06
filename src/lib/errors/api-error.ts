export class ApiError extends Error {
	public constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
	}
}
