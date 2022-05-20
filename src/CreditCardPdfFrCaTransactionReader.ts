import * as fs from 'fs';
import { DateTime } from 'luxon';
import PdfParse from 'pdf-parse';
import { Transaction } from './Transaction';

interface RegMatchesFromTxnLine {
	dates: string;
	description: string;
	amount: string;
}

export class CreditCardPdfFrCaTransactionReader {
	private rawTextTransactionLine: string[] = [];
	private transactions: Transaction[] = [];
	private totalFromFile = 0;

	constructor(private textFilePath: string) {}

	public async read(): Promise<Transaction[]> {
		await this.extractRawTextTransactions();
		this.buildTransactionList();
		this.orderTransactionFromOldest1st()
		this.checkIfTransactionsFoundMatchTheTotal();

		return this.transactions;
	}

	private async extractRawTextTransactions(): Promise<void> {
		/**
		 * transaction line should start with 8 digits.
		 * date of transaction day and month followed by posted date day and month
		 * ddmmddmm
		 * 04020402STM JOLIETTE DIN101      MONTREAL     QC 2,00 %       17,25
		 * 
		 * this regex will still hit line like this which are not transactions but operations on the account
		 * 24012401PAIEMENT CAISSE      835,00CR
		 * 26012601CRÉDIT REMISES       25,00CR
		 * 
		 * Deal with it on 2nd pass.
		 */
		const transactionLineRegex = new RegExp(/^\d{8}/);
		
		let dataBuffer = fs.readFileSync(this.textFilePath);

		/**
		 * 25112511PATTES ET GRIFFES        MONTREAL     QC 0,50 %       37,93
		 * 25112511VIDEOTRON LTEE. 100 SPCC MONTREAL     QC      120,69CR
		 * 27112911Spotify P182D4441A       Stockholm    SE 2,00 %       14,94
		 */
		const pdfData = await PdfParse(dataBuffer);

		// console.log(pdfData.text);

		const regTotalLine = new RegExp(/^TOTAL\d+,\d{2}$/);
		this.rawTextTransactionLine = pdfData.text.split("\n").filter(line => {
			if(regTotalLine.test(line)){
				this.totalFromFile = this.parseMoneyAmountInCents(line);
			}

			return transactionLineRegex.test(line);
		})
	}

	private buildTransactionList(): void {
		
		// 25112511PATTES ET GRIFFES        MONTREAL     QC 0,50 %       37,93
		// base on the fact that it has a cash back percent amount. eg. 0,50 % 
		const regTxnWithCashBack = new RegExp(/(?<dates>\d{8})(?<desc>.*[A-Z]{2}).*\%(?<amount>.*)/);	
		this.rawTextTransactionLine.forEach(line => {

			// TODO find better way to match "operation"
			if(line.includes('PAIEMENT CAISSE') || line.includes('CRÉDIT REMISES')){
				return;
			}

			let matches = line.match(regTxnWithCashBack);
			if(matches !== null && matches.groups){
				this.addTransactionFromRegMatches({
					dates: matches.groups.dates,
					description: matches.groups.desc,
					amount: matches.groups.amount,
				});
				return;
			}

			// if the line did not have cash Back (%) regular transaction
			// and it end by CR, assume it's a refund. the format is inconsistent.
			// '25112511PATTES ET GRIFFES        MONTREAL     QC 0,50 %       37,93',
			// '25112511VIDEOTRON LTEE. 100 SPCC MONTREAL     QC      120,69CR',
			const regRefundTxnLine = new RegExp(/(?<dates>\d{8})(?<desc>.*[A-Z]{2}) (?<amount>.*)/);
			matches = line.match(regRefundTxnLine);
			if(matches !== null && matches.groups){
				this.addTransactionFromRegMatches({
					dates: matches.groups.dates,
					description: matches.groups.desc,
					amount: matches.groups.amount,
				});
				return;
			}
		});
	}


	private parseDate(stringDates: string): Date {
		const dateObjUnits =  {
			// year is not present in the data. would need to add logic to determine the year per transaction
			// only an issue for statement at the start/end of year, assume current year for now.
			month: parseInt(stringDates.substring(2,4)),
			day: parseInt(stringDates.substring(0,2))
		};

		return DateTime.fromObject(dateObjUnits).toJSDate();
	}

	private addTransactionFromRegMatches(matches: RegMatchesFromTxnLine): void {
		const amount = this.parseMoneyAmountInCents(matches.amount);
		const txnDate = this.parseDate(matches.dates);

		this.transactions.push(new Transaction(txnDate, amount, matches.description));
	}

	private parseMoneyAmountInCents(stringAmount: string): number {
		let sign = '+';
		// \s : any whitespace char
		stringAmount = stringAmount.replace(/\s/g, '');
		if(stringAmount.endsWith('CR')){
			sign = '-';
		}

		// remove any non digit
		stringAmount = stringAmount.replace(/\D/g, '');
		// const dollar = stringAmount.substring(0, stringAmount.length - 2);
		// const cents = stringAmount.slice(-2);


		return parseInt(`${sign}${stringAmount}`);
	}

	private orderTransactionFromOldest1st(): void {
		this.transactions.sort((a, b) => {
			// ascending order by ts.
			return a.date.valueOf() - b.date.valueOf()
		});
	}

	private checkIfTransactionsFoundMatchTheTotal() {
		const initialValue = 0;
		const totalFromTxn = this.transactions.reduce((sum, transaction) => {
			return sum + transaction.amount;
		}, initialValue);

		if(totalFromTxn !== this.totalFromFile){
			throw new Error(`Miss match between Total from Transactions(${totalFromTxn}) found and from the File(${this.totalFromFile}).`);
		}
	}
}
