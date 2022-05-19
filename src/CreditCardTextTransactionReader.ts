import { Transaction } from './Transaction';
import * as fs from 'fs';
import * as readline from 'readline';
import { once } from 'events';
import { DateTime } from 'luxon';

export class CreditCardTextTransactionReader {
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
			if(!this.transactionListHasStarted && line.startsWith('Transaction date')){
				this.transactionListHasStarted = true;
				return;
			}

			if(this.transactionListHasStarted && line.startsWith('Total')){
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
			const parts = line.split("\t").filter(substring => {
				return substring.length > 0;
			});
		
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
		const amount = this.parseMoneyAmount(rawData[4]);
		const description = rawData[3];
		return new Transaction(txnDate, amount, description);
	}

	private parseMoneyAmount(stringAmount: string): number {
		// remove all non digit, including dot(.), decimal seprarator
		// don't take the chance of finding space, comma, etc
		stringAmount = stringAmount.replace(/\D/g,'');
		const dollar = stringAmount.substring(0, stringAmount.length - 2);
		const cents = stringAmount.slice(-2);

		return parseFloat(`${dollar}.${cents}`);
	}

	private orderTransactionFromOldest1st(): void {
		this.transactions.sort((a, b) => {
			// ascending order by ts.
			return a.date.valueOf() - b.date.valueOf()
		});
	}
}
