import * as fs from 'fs/promises';
import { DateTime } from 'luxon';
import * as path from 'path';

import { TransactionReaderFactory } from './TransactionReaderFactory';

async function runApp() {
	const creditCardTextTransactionsFolder = path.resolve(__dirname, '../credit_card_transactions');
	console.log(creditCardTextTransactionsFolder);
	const files = await fs.readdir(creditCardTextTransactionsFolder);
	console.log(files);
	const readerFactory = new TransactionReaderFactory();
	for (const file of files) {
		const absolutePath = path.join(creditCardTextTransactionsFolder, file);
		const fileStat = await fs.stat(absolutePath);
		if(fileStat.isDirectory()){
			continue;
		}
		const reader = readerFactory.create(absolutePath);	
		const transactions = await reader.read();
		transactions.forEach(transaction => {
			let dateFormatted = DateTime.fromJSDate(transaction.date).toFormat('dd/MM/yyyy');

			// not sure the best way to go from 1000 cents to 10.00 $
			const moneyValue = (transaction.amount / 100).toFixed(2);
			// ex if want to format with currency:
			// const currencyAmount = new Intl.NumberFormat('en-CA', {style: 'decimal', useGrouping: false, minimumFractionDigits: 2}).format(transaction.amount);
			console.log([dateFormatted, transaction.description, moneyValue].join(','));
		});
		console.log('');
	}
}

runApp().catch((error) => {
	console.log('ERROR !');
	console.error(error);
});

async function tester(){
	const values: number[] = [];
	let expectedLength = 4; //0.01
	for (let index = 1; index <= 100001; index++) {
		if(index === 1000){
			expectedLength += 1; // 99.99
		}
		
		if(index === 10000){
			expectedLength += 1; // 999.99
		}
		if(index === 100000){
			expectedLength += 1; // 9999.99
		}
		let cad = index / 100;
		// console.log(cad);
		if(cad.toString().length > expectedLength){
			console.log(`err: ${cad}`);
			console.log(index);
			break;
		}
		
		
	} 
	console.log('ok');
}
