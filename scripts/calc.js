class Quote {
    constructor({
        total: { value: total }, 
        bottles: { value: bottles }, 
        shipping: { value: shipping }, 
        rate: { value: rate }, 
        dollarRate: { value: dollarRate }, 
        isFTA: { checked: isFTA }
    }) {
        const parcelPrice = [
            18500,
            24500,
            30500,
            37000,
            43000
        ];
        const prelim = (total*1 + shipping*1) * rate;

        this.baseline = Math.trunc(((total * rate) <= 200000) ? (total * rate) + parcelPrice[bottles-1] : prelim);
        this.hasAdditTax = (this.baseline / dollarRate >= 150) || bottles > 1;
        this.tariff = (this.hasAdditTax && !isFTA) ? this.trunc(this.baseline * 0.2) : 0;
        this.alcoholTax = this.trunc((this.baseline + this.tariff) * 0.72);
        this.eduTax = this.trunc(this.alcoholTax * 0.3);    
        this.vat = (this.hasAdditTax) ? this.trunc((this.baseline + this.tariff + this.alcoholTax + this.eduTax) * 0.1) : 0;

        this.totalTax = this.tariff + this.alcoholTax + this.eduTax + this.vat;
        this.total = this.trunc(prelim + this.totalTax);
    }
  
    trunc(num) {
        return Math.trunc(num / 10) * 10;
    }
}

document.addEventListener("DOMContentLoaded", event => {
    const form = document.getElementById("form");
    const inputs = form.querySelectorAll('input[type=text]');
    const outputs = document.getElementById("outputs");
    const submit = document.querySelector("#submit button");

    const decimal = (1.1).toLocaleString().replace(/\d/g, '');

    inputs.forEach(input => {
        input.addEventListener('input', event => {
        event.target.value = event.target.value
            .replace(new RegExp(`[^${decimal}0-9]`, 'g'), '')
            .replace(new RegExp(`^([0-9]*\${decimal}[0-9]{2}).*$`, 'g'), '$1');
        });
    });

    submit.addEventListener('click', () => {
        const quote = new Quote(form);

        for (const key in quote) {
            if(outputs[key]) outputs[key].value = quote[key].toLocaleString();
        }
    });
});
