import * as fs from 'fs/promises';
import { DateTime } from 'luxon';
import * as path from 'path';

import { CreditCardTextTransactionReader } from './CreditCardTextTransactionReader';
import { CreditCardPdfFrCaTransactionReader } from './CreditCardPdfFrCaTransactionReader';

async function runApp() {
	const creditCardTextTransactionsFolder = path.resolve(__dirname, '../credit_card_transactions');
	console.log(creditCardTextTransactionsFolder);
	const files = await fs.readdir(creditCardTextTransactionsFolder);
	console.log(files);
	for (const file of files) {
		if(!file.endsWith('.pdf')){
			continue;
		}
		const creditCardTxnReader = new CreditCardPdfFrCaTransactionReader(path.join(creditCardTextTransactionsFolder, file));
		const transactions = await creditCardTxnReader.read();
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
