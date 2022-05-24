import { Transaction } from "./Transaction";

export interface TransactionReader {
	read(): Promise<Transaction[]>;
}
