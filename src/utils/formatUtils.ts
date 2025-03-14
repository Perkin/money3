
const moneyFormatter = new Intl.NumberFormat('default', {
    style: 'currency',
    currency: 'RUB',
    useGrouping: true,
    maximumSignificantDigits: 9,
});

export const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) {
        return '';
    }

    if (!(date instanceof Date)) {
        return date;
    }

    let year = date.getFullYear() + '';
    let month = date.toLocaleString('default', { month: 'short' }).replace('.', '');
    let day = date.getDate() + '';
    if (date.getDate() < 10) day = '0' + day;

    return `${year}-${month}-${day}`;
}

export const formatMoney = (money: number): string => {
    return moneyFormatter.format(money);
}
