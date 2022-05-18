import * as fs from 'fs/promises';
import * as path from 'path';
import { CreditCardTextTransactionReader } from './CreditCardTextTransactionReader';

async function runApp() {
	const creditCardTextTransactionsFolder = path.resolve(__dirname, '../credit_card_transactions');
	console.log(creditCardTextTransactionsFolder);
	const files = await fs.readdir(creditCardTextTransactionsFolder);
	console.log(files);
	files.forEach(file => {
		const creditCardTxnReader = new CreditCardTextTransactionReader(path.join(creditCardTextTransactionsFolder, file));
		const transactions = creditCardTxnReader.read();
	});
}

runApp();
