import { Transaction } from './Transaction';
import { TransactionReader } from './TransactionReader.interface';

export class NullReader implements TransactionReader {
	constructor(private textFilePath: string) {}

	public async read(): Promise<Transaction[]> {
		return [new Transaction(new Date(), 0, `ERROR! Could not read transactions from ${this.textFilePath}`)];
	}
}
