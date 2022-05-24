import { Transaction } from './Transaction';
import * as fs from 'fs';
import * as readline from 'readline';
import { once } from 'events';
import { DateTime } from 'luxon';
import { TransactionReader } from './TransactionReader.interface';

// from printable version
export class PersonalChequingAccountTextTransactionReader implements TransactionReader {
	private readonly DATE_FORMAT = 'dd MMM yyyy';

	private transactionListHasStarted = false;

	private rawTextTransactionLine: string[] = [];
	private transactions: Transaction[] = [];

	constructor(private textFilePath: string) {
	
	}

	public async read(): Promise<Transaction[]> {
		await this.extractRawTextTransactions();
		this.buildTransactionList();
		this.orderTransactionFromOldest1st()

		return this.transactions;
	}

	private async extractRawTextTransactions(): Promise<void> {
		const fileStream = fs.createReadStream(this.textFilePath);
	
		const rl = readline.createInterface({
		  input: fileStream,
		  crlfDelay: Infinity
		});

		// assume line are process in order. might not be true
		rl.on('line', (line) => {	
			if(!this.transactionListHasStarted && line.startsWith('Date   	Description')){
				this.transactionListHasStarted = true;
				return;
			}

			if(this.transactionListHasStarted && line.length === 0){
				rl.removeAllListeners('line');

				// rl.close();
				/**
				 * rl.close(); does not work. it is mostlikely because the stream has already read the rest of the file
				 * so closing it doest not clear the buffer and the event on 'line' still get exceuted with what is in the buffer.
				 * 
				 * Working alternative solution was to have a boolean flag and ignore the rest of the line when no more transactions.
				 * 
				 */
				return;
			}

			if(this.transactionListHasStarted){
				this.rawTextTransactionLine.push(line);
			}
		});

		await once(rl, 'close');
	}

	private buildTransactionList(){
		this.rawTextTransactionLine.forEach(line => {
			const parts = line.split("\t");
			// parts[2] is withdrawal
			if(parts[2] === ''){
				return;
			}
		
			const transaction = this.buildTransaction(parts);
			this.transactions.push(transaction);
			// dd day of the month, padded to 2 => 06
			// MMM month as an abbreviated localized string => Aug
			// the month value is all cap but the match is case insensitive
			// DateTime.fromFormatExplain(parts[0], "dd MMM yyyy")
		});
	}

	private buildTransaction(rawData: string[]): Transaction {
		const txnDate = DateTime.fromFormat(rawData[0], this.DATE_FORMAT).toJSDate();
		const amount = this.parseMoneyAmountInCents(rawData[2]);
		const description = rawData[1];
		return new Transaction(txnDate, amount, description);
	}

	private parseMoneyAmountInCents(stringAmount: string): number {
		// remove any non digit
		stringAmount = stringAmount.replace(/\D/g, '');
		return parseInt(stringAmount);
	}

	private orderTransactionFromOldest1st(): void {
		this.transactions.sort((a, b) => {
			// ascending order by ts.
			return a.date.valueOf() - b.date.valueOf()
		});
	}
}
