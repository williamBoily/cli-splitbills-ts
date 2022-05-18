export class Transaction {
	constructor(
		public readonly date: Date,
		public readonly amount: number,
		public readonly description: string
	) {
		
	}
}
