import * as fs from 'fs/promises';
import { DateTime } from 'luxon';
import * as path from 'path';
import { CreditCardTextTransactionReader } from './CreditCardTextTransactionReader';

async function runApp() {
	const creditCardTextTransactionsFolder = path.resolve(__dirname, '../credit_card_transactions');
	console.log(creditCardTextTransactionsFolder);
	const files = await fs.readdir(creditCardTextTransactionsFolder);
	console.log(files);
	for (const file of files) {
		// test pdf.
		if(file.endsWith('.pdf')){
			// pfreader
			// const fsSync = require("fs");
			// const { PdfReader } = require("pdfreader");
	
			// fsSync.readFile(path.join(creditCardTextTransactionsFolder, file), (err: any, pdfBuffer: any) => {
			// // pdfBuffer contains the file content
			// new PdfReader().parseBuffer(pdfBuffer, (err: any, item: any) => {
			// 	if (err) console.error("error:", err);
			// 	else if (!item) console.warn("end of buffer");
			// 	else if (item.text) console.log(item.text);
			// });
			// });
			// console.log(file);
			// pdfreader test. output is not pretty and easy to work with...

			const fs = require('fs');
			const pdf = require('pdf-parse');
			
			let dataBuffer = fs.readFileSync(path.join(creditCardTextTransactionsFolder, file));
			
			pdf(dataBuffer).then(function(data: any) {
			
				// number of pages
				console.log(data.numpages);
				// number of rendered pages
				console.log(data.numrender);
				// PDF info
				console.log(data.info);
				// PDF metadata
				console.log(data.metadata); 
				// PDF.js version
				// check https://mozilla.github.io/pdf.js/getting_started/
				console.log(data.version);
				// PDF text
				console.log(data.text); 
					
			});
		}


		break;
		continue;
		const creditCardTxnReader = new CreditCardTextTransactionReader(path.join(creditCardTextTransactionsFolder, file));
		const transactions = await creditCardTxnReader.read();
		transactions.forEach(transaction => {
			let dateFormatted = DateTime.fromJSDate(transaction.date).toFormat('dd/MM/yyyy');
			console.log([dateFormatted, transaction.description, transaction.amount].join(','));
		});
	}
}

runApp();
