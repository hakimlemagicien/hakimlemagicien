export type BankId = "uae" | "morocco" | "bmce";

export type BankTransferAccount = {
  id: BankId;
  bankName: string;
  countryLabel: string;
  countryBadgeClass: string;
  currency: "USD" | "MAD";
  holder: string;
  iban: string;
  account: string;
  swift: string;
};

export const BANK_TRANSFER_ACCOUNTS: BankTransferAccount[] = [
  {
    id: "uae",
    bankName: "Emirates NBD",
    countryLabel: "الإمارات",
    countryBadgeClass: "bg-[#FF6B00] text-white",
    currency: "USD",
    holder: "Hakim Coaching FZ-LLC",
    iban: "AE07 0260 0010 1543 2109 876",
    account: "1015432109876",
    swift: "EBILAEAD",
  },
  {
    id: "morocco",
    bankName: "CIH Bank",
    countryLabel: "المغرب",
    countryBadgeClass: "bg-[#2563EB] text-white",
    currency: "MAD",
    holder: "Hakim Coaching",
    iban: "MA64 2308 1021 1321 7221 0160 0012",
    account: "230 810 2113217221016000 12",
    swift: "CIHMMAMC",
  },
  {
    id: "bmce",
    bankName: "BMCE Bank",
    countryLabel: "المغرب",
    countryBadgeClass: "bg-[#2563EB] text-white",
    currency: "MAD",
    holder: "Hakim Coaching",
    iban: "MA64 0118 1000 0001 2345 6789 0134",
    account: "011 810 0000123456789012 34",
    swift: "BMCEMAMC",
  },
];

export function getBankAccount(id: BankId): BankTransferAccount {
  return BANK_TRANSFER_ACCOUNTS.find((a) => a.id === id) ?? BANK_TRANSFER_ACCOUNTS[0];
}

/** Approximate MAD equivalent for display on Moroccan account */
export function getMadAmount(usdPrice: string | number): number {
  return Math.round(Number(usdPrice) * 9.7);
}

export function formatTransferAmount(account: BankTransferAccount, usdTierPrice: string): string {
  if (account.currency === "USD") {
    return `${usdTierPrice} USD`;
  }
  return `${getMadAmount(usdTierPrice).toLocaleString("ar-EG")} MAD`;
}
