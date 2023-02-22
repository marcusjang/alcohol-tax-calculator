const parcelPrice = [
	[1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
	[9900, 15500, 20000, 24500, 29000, 34000, 38500, 43000, 47500, 52500, 57000],
	[11000, 17000, 21500, 26000, 30500, 35500, 40000, 44500, 49000, 54000, 58500],
	[12000, 18500, 24500, 30500, 37000, 43000, 49000, 55500, 61500, 67500, 74000],
	[13000, 20000, 27500, 35500, 43000, 50500, 58500, 66000, 74000, 81500, 89000]
];

const rates = {
	"EUR": 1363.3,
	"USD": 1274.36,
	"GBP": 1538.63,
	"DKK": 183,
	"JPY": 9.5808,
	"KRW": 1
}

const countryData = [{
		"country_code": "EU",
		"country_name": "유럽연합",
		"currency_code": "EUR",
		"currency_name": "유로"
	},
	{
		"country_code": "US",
		"country_name": "미국",
		"currency_code": "USD",
		"currency_name": "달러"
	},
	{
		"country_code": "GB",
		"country_name": "영국",
		"currency_code": "GBP",
		"currency_name": "파운드"
	},
	{
		"country_code": "DK",
		"country_name": "덴마크",
		"currency_code": "DKK",
		"currency_name": "크로네"
	},
	{
		"country_code": "JP",
		"country_name": "일본",
		"currency_code": "JPY",
		"currency_name": "엔"
	},
	{
		"country_code": "KR",
		"country_name": "대한민국",
		"currency_code": "KRW",
		"currency_name": "원"
	}
]


class QuoteForm {
	constructor(form) {
		this.form = form;
		this.elements = this.form.elements;
		this.#initForm();
	}
	
	#initForm() {
		for (const elem of this.elements)  {
			const { name, tagName } = elem;
			const { type } = elem.dataset;
			if (tagName === 'INPUT' && type === 'price') {
				elem.addEventListener('input', event => {
					event.target.dispatchEvent(
						new CustomEvent('update-price', {
							bubbles: true,
							detail: {
								originalTarget: event.target,
								value: parseFloat(event.target.value),
								currency: event.target.dataset.currency
							}
						})
					)
				});
			} else if (tagName === 'INPUT' && name === 'fta') {
				elem.addEventListener('change', event => {
					this.fta = elem.checked;
					this.render();
				});
			} else if (tagName === 'SELECT' && name === 'currency') {
				elem.addEventListener('change', () => this.#setCurrency());
			} else if (tagName === 'INPUT' && elem.type === 'text') {
				elem.addEventListener('input', () => this.render());
			} else if ((tagName === 'INPUT' && elem.type === 'checkbox') ||
					(tagName === 'SELECT')) {
				elem.addEventListener('change', () => this.render());
			}
		}

		this.form.addEventListener('update-price', event => {
			this.price = event.detail.value * this.rate;
			
			for (const elem of event.currentTarget.elements)  {
				if (elem.tagName === 'INPUT' && elem.dataset.type === 'price' &&
					elem !== event.detail.originalTarget) {
					const value = this.price / rates[elem.dataset.currency];
					if (!isNaN(value)) {
						elem.value = QuoteForm.trunc(value);
					}
				}
			}
			this.render();
		}, true);
		
		this.#setCurrency();
	}

	#setCurrency() {
		this.currency = this.elements.currency.value;
		this.rate = rates[this.currency];
		this.elements.price.dataset.currency = this.currency;
		this.elements.price.dispatchEvent(new InputEvent('input'));
	}
	
	render() {
		this.elements['tax-total'].value = this.totalTax;
		this.elements['tax-alcohol'].value = this.alcoholTax;
		this.elements['tax-edu'].value = this.eduTax;
		this.elements['tax-tariff'].value = this.tariff;
		this.elements['tax-vat'].value = this.vat;
	}
	
	get shipping() {
		const input = parseFloat(this.elements.shipping.value);
		return (this.over200kKRW) ? QuoteForm.trunc(input * this.rate) : 18500;
		// todo: variable shipping price according to region and/or weight
	}
	
	get priceUSD() {
		return QuoteForm.trunc(this.price / rates['USD']);
	}
	
	get over150USD() {
		return this.priceUSD > 150;
	}
	
	get over200kKRW() {
		return this.price > 200000;
	}
	
	get multipleBottles() {
		return this.elements['multiple-bottles'].checked;
	}
	
	get includeShipping() {
		return this.elements['include-shipping'].checked;
	}
	
	get baseline() {
		return (this.includeShipping) ? this.price + this.shipping : this.price;
	}
	
	get tariff() {
		const rate = parseInt(this.elements['tax-tariff-rate'].value) / 100
		return (this.fta || !this.over150USD) && !this.multipleBottles ?
			0 : QuoteForm.floorTen(this.baseline * rate);
	}
	
	get alcoholTax() {
		const rate = parseInt(this.elements['tax-alcohol-rate'].value) / 100
		return QuoteForm.floorTen((this.baseline + this.tariff) * rate);
	}
	
	get eduTax() {
		return QuoteForm.floorTen(this.alcoholTax * 0.3);
	}
	
	get vat() {
		return (!this.over150USD) && !this.multipleBottles ?
			0 : QuoteForm.floorTen(
				(this.baseline + this.tariff + this.alcoholTax + this.eduTax) * 0.1
			);
	}
	
	get totalTax() {
		return this.tariff + this.alcoholTax + this.eduTax + this.vat;
	}
	
	static trunc(number) {
		return Math.floor(number * 100) / 100;
	}
	
	static floorTen(number) {
		return Math.floor(number / 10) * 10;
	}
}

function init() {
	const form = document.forms[0];
	const quote = new QuoteForm(form);
}

document.addEventListener('DOMContentLoaded', init);
