import { PersonalChequingAccountTextTransactionReader } from './PersonalChequingAccountTextTransactionReader';
import { CreditCardPdfFrCaTransactionReader } from './CreditCardPdfFrCaTransactionReader';
import { CreditCardTextTransactionReader } from './CreditCardTextTransactionReader';
import { CreditCardTextReconciliationTransactionReader } from './CreditCardTextReconciliationTransactionReader';
import { TransactionReader } from './TransactionReader.interface';
import * as path from 'path';

export class TransactionReaderFactory {
	public create(fileName: string): TransactionReader {
		if (path.basename(fileName).startsWith('pca_') && path.extname(fileName) === '.txt') {
			console.log('pca text reader');
			return new PersonalChequingAccountTextTransactionReader(fileName);
		}
		
		if (fileName.endsWith('.pdf')) {
			console.log('cc pdf statement reader');
			return new CreditCardPdfFrCaTransactionReader(fileName);
		}

		if (path.basename(fileName).startsWith('Reconciliation') && fileName.endsWith('.txt')) {
			console.log('cc Reconciliation text reader');
			return new CreditCardTextReconciliationTransactionReader(fileName);
		}

		if (fileName.endsWith('.txt')) {
			console.log('cc text statement reader');
			return new CreditCardTextTransactionReader(fileName);
		}


		throw new Error(`Unsupported file ${fileName}`);
		
	}
}
