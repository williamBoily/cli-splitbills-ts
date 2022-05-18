import { Transaction } from './Transaction';
import * as fs from 'fs';
import * as readline from 'readline';
import { once } from 'events';

export class CreditCardTextTransactionReader {
	// private readlineInstance: readline.Interface;
	private transactionListHasStarted = false;
	private transactionListHasEnded = false;
	constructor(private textFilePath: string) {
	
	}

	public async read(): Promise<Transaction[]> {
		const fileStream = fs.createReadStream(this.textFilePath);
	
		const rl = readline.createInterface({
		  input: fileStream,
		  crlfDelay: Infinity
		});

		// assume line are process in order. might not be true
		rl.on('line', (line) => {
			let prefix = 'PRE  TXN: ';
			if(this.transactionListHasStarted){
				prefix = 'IS   TXN(+1): ';
			}
			if(this.transactionListHasEnded){
				prefix = 'POST TXN(-1): ';
			}
			console.log(prefix + line);

			if(!this.transactionListHasStarted && line.startsWith('Transaction date')){
				this.transactionListHasStarted = true;
			}

			if(this.transactionListHasStarted && line.startsWith('Total')){
				this.transactionListHasEnded = true;
			}
		});

		rl.on('close', (input: any) => {
			console.log(`Received close: ${input}`);
		});

		await once(rl, 'close');
		// Note: we use the crlfDelay option to recognize all instances of CR LF
		// ('\r\n') in input.txt as a single line break.
		// await this.readFileUntilTransactionsListStarts();
		// for await (const line of this.readlineInstance) {
		// 	console.log(line);
		// }
		const transactions: Transaction[] = [];

		return transactions;
	}

	// private async readFileUntilTransactionsListStarts(){
	// 	for await (const line of this.readlineInstance) {
	// 		if(line.startsWith('Transaction date')){
	// 			console.log('setting pause');
	// 			this.readlineInstance.pause();
	// 			break;
	// 		}
	// 	}
	// }
}
