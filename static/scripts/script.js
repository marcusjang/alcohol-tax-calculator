const parcelPrice = [
	[1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
	[9900, 15500, 20000, 24500, 29000, 34000, 38500, 43000, 47500, 52500, 57000],
	[11000, 17000, 21500, 26000, 30500, 35500, 40000, 44500, 49000, 54000, 58500],
	[12000, 18500, 24500, 30500, 37000, 43000, 49000, 55500, 61500, 67500, 74000],
	[13000, 20000, 27500, 35500, 43000, 50500, 58500, 66000, 74000, 81500, 89000]
];

const rateDataUrl = 'https://gist.githubusercontent.com/marcusjang/ae44a296cad4df07a12c4e211ded4871/raw/bf6c0b60456d0f0b21a4c28d2fd95bfc2856ec96/rates.json';
const countryDataUrl = 'https://gist.githubusercontent.com/marcusjang/51253d9124a75e846ff78331415674ac/raw/3d01a7091ffb808170033e6322542953a0c8d558/country_data.json';
const countryPriority = [ 'GB', 'EU', 'US', 'DK', 'JP' ];

// source: https://alanedwardes.com/blog/posts/country-code-to-flag-emoji-csharp/
function isoCountryCodeToFlagEmoji(country) {
	return String.fromCodePoint(...[...country.toUpperCase()].map(c => c.charCodeAt() + 0x1F1A5));
}


async function getData() {
	const key = 'country-data';
	//localStorage.removeItem(key);
	let data = JSON.parse(localStorage.getItem(key));
	if (!data) {
		console.log('no local data found, fetching remote...');
		data = await fetchData();
		localStorage.setItem(key, JSON.stringify(data));
	}
	return data;
}

function fetchData() {
	return Promise.all([
		fetch(rateDataUrl).then(res => res.json()),
		fetch(countryDataUrl).then(res => res.json())
	]).then(data => {
		return data[1].sort((a, b) => {
			const aCode = a.country_code;
			const bCode = b.country_code;
			const aIndex = countryPriority.findIndex(code => code === aCode);
			const bIndex = countryPriority.findIndex(code => code === bCode);
			if (aIndex === -1) return 1;
			if (bIndex === -1) return -1;
			return aIndex - bIndex;
		}).map(country => {
			country.rate = data[0][country.currency_code];
			country.flag = isoCountryCodeToFlagEmoji(country.country_code);
			return country;
		});
	});
}

function renderOption(country) {
	const option = document.createElement('option');
	option.innerText = `${ country.flag } ${ country.country_name } ${ country.currency_name }`;
	option.value = country.rate;
	option.dataset.region = country.region;
	option.dataset.currency = country.currency_code;
	option.dataset.country = country.country_code;

	return option;
}

class QuoteForm {
	constructor(form) {
		this.form = form;
		this.elements = this.form.elements;
		this.rate = 1500;
		this.rateUSD = 1200; // fallback
		this.#initForm();
	}
	
	#initForm() {
		for (const elem of this.elements)  {
			const { name, tagName } = elem;
			const { type } = elem.dataset;
			if (tagName === 'INPUT' && type === 'price') {
				elem.addEventListener('input', event => {
					const value = event.target.value;

					event.target.value = value
						.replace(/[^\d,\.]/g, '')
						.replace(/^0+/, '');

					event.target.dispatchEvent(
						new CustomEvent('update-price', {
							bubbles: true,
							detail: {
								originalTarget: event.target,
								value: parseFloat(value.replace(/[^\d\.]/g, '')),
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
				elem.addEventListener('change', () => this.setCurrency());
			} else if (tagName === 'INPUT' && elem.type === 'text') {
				elem.addEventListener('input', () => this.render());
			} else if ((tagName === 'INPUT' && elem.type === 'checkbox') ||
					(tagName === 'SELECT')) {
				elem.addEventListener('change', () => this.render());
			}
		}

		this.form.addEventListener('update-price', event => {
			
			const originalTarget = event.detail.originalTarget;
			
			if (originalTarget === this.elements.price)
				this.price = event.detail.value * this.rate;
			else if (originalTarget === this.elements['price-usd'])
				this.price = event.detail.value * this.rateUSD;
			else if (originalTarget === this.elements['price-krw'])
				this.price = event.detail.value;
			
			if (originalTarget !== this.elements.price)
				this.elements.price.value = (this.price <= 0 || isNaN(this.price)) ? null : QuoteForm.trunc(this.price / this.rate);
			
			if (originalTarget !== this.elements['price-usd'])
				this.elements['price-usd'].value = (this.price <= 0 || isNaN(this.price)) ? null : this.priceUSD;
			
			if (originalTarget !== this.elements['price-krw'])
				this.elements['price-krw'].value = (this.price <= 0 || isNaN(this.price)) ? null : Math.round(this.price).toLocaleString();

			this.render();
		}, true);
		
		this.setCurrency();
	}

	setCurrency() {
		const select = this.elements.currency;
		const index = select.selectedIndex;
		const selected = select.options[index];
		
		this.rate = parseFloat(select.value);
		this.country = selected.dataset.country;
		this.currency = selected.dataset.currency;
		this.region = parseInt(selected.dataset.region);
		
		this.elements.price.dispatchEvent(new InputEvent('input'));
	}
	
	render() {
		(this.over150USD) ? this.elements['over-150-usd'].classList.add('active') : this.elements['over-150-usd'].classList.remove('active');
		(this.over200kKRW) ? this.elements['over-200k-krw'].classList.add('active') : this.elements['over-200k-krw'].classList.remove('active');
		
		this.elements['tax-total'].value = this.totalTax.toLocaleString();
		this.elements['tax-alcohol'].value = this.alcoholTax.toLocaleString();
		this.elements['tax-edu'].value = this.eduTax.toLocaleString();
		this.elements['tax-tariff'].value = this.tariff.toLocaleString();
		this.elements['tax-vat'].value = this.vat.toLocaleString();
		this.elements['total'].value = this.total.toLocaleString();

		for (const elem of this.elements['currency-code']) {
			elem.value = this.currency;
		}
	}
	
	get shipping() {
		const input = parseFloat(this.elements.shipping.value);
		return QuoteForm.trunc(input * this.rate);
	}
	
	get shippingTax() {
		return (this.over200kKRW) ? this.shipping : 18500;
		// todo: variable shipping price according to region and/or weight
	}
	
	get priceUSD() {
		return QuoteForm.trunc(this.price / this.rateUSD);
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
		return (this.includeShipping) ? this.price + this.shippingTax : this.price;
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
	
	get total() {
		return QuoteForm.floorTen(this.price + this.shipping + this.totalTax);
	}
	
	static trunc(number) {
		const value = Math.floor(number * 100) / 100;
		return (isNaN(value)) ? 0 : value;;
	}
	
	static floorTen(number) {
		const value = Math.floor(number / 10) * 10;
		return (isNaN(value)) ? 0 : value;;
	}
}

function init() {
	const form = document.forms[0];
	
	const quote = new QuoteForm(form);
	
	getData().then(data => {
		const select = quote.elements.currency;
		quote.rates = data;
		quote.rateUSD = data.find(datum => datum.currency_code === 'USD').rate;
		select.innerHTML = '';
		for (const country of data) {
			const option = renderOption(country);
			select.append(option)
		}
		quote.setCurrency();
	});
}

document.addEventListener('DOMContentLoaded', init);
