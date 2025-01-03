class App {
	constructor() {
		this.searchInput = document.querySelector('#search');
		this.placeTypeFilter = document.querySelector('#place-type-filter');
		this.clearBtn = document.querySelector('.btn-clear');
		this.distanceCheckbox = document.querySelector('.checkbox-distance');
		this.placesCount = document.querySelector('.places-count');
		this.placesGrid = document.querySelector('.places-grid');

		this.loaderCards = `<div class="loader-card"></div>`.repeat(8);

		this.defaultMapCenter = [43.10311, -76.14796];
		this.defaultMapZoom = 11;
		this.userLatitude = null;
		this.userLongitude = null;
		this.userLocationMarker = null;

		this.init();

		this.markerLayer = L.layerGroup().addTo(this.map);
		this.markerMap = new Map();
	}

	async fetchPlaces() {
		try {
			this.placesGrid.innerHTML = this.loaderCards;

			const response = await fetch('/wp-admin/admin-ajax.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					action: 'fetch_places',
					searchInput: this.searchInput.value.trim(),
					placeTypeFilter: this.placeTypeFilter.value || '',
					userLatitude: this.userLatitude || '',
					userLongitude: this.userLongitude || '',
				}),
			});

			if (!response.ok) throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);

			const { data } = await response.json();

			this.placesCount.innerHTML = `${data.length} result${data.length === 1 ? '' : 's'}`;
			this.placesGrid.innerHTML = data.length ? '' : '<p>No places found.</p>';
			this.clearMapMarkers();

			data.forEach((place) => {
				const marker = this.addMapMarker(place);
				const card = this.makePlaceCard(place, marker);
				this.placesGrid.appendChild(card);
			});
		} catch (error) {
			console.error('Error fetching places:', error);
			this.placesGrid.innerHTML = '<p>Error fetching places.</p>';
		}
	}

	async getLocation() {
		this.placesGrid.innerHTML = this.loaderCards;

		try {
			const { coords } = await new Promise((resolve, reject) => (navigator.geolocation ? navigator.geolocation.getCurrentPosition(resolve, reject) : reject(new Error('Geolocation not supported'))));

			this.userLatitude = coords.latitude;
			this.userLongitude = coords.longitude;
			this.map.setView([this.userLatitude, this.userLongitude], 14);

			const userLocationIcon = L.icon({
				iconUrl: '/wp-content/uploads/2024/12/marker-user.png',
				iconSize: [32, 40],
				iconAnchor: [16, 40],
				popupAnchor: [0, -40],
			});

			this.userLocationMarker = L.marker([this.userLatitude, this.userLongitude], { icon: userLocationIcon }).bindPopup('<p class="popup-title">Your Location</p>').addTo(this.map);

			this.fetchPlaces();
		} catch (error) {
			this.fetchPlaces();
			console.error('Error getting location:', error.message);

			if (this.distanceCheckbox) {
				this.distanceCheckbox.checked = false;
			}
		}
	}

	makePlaceCard({ name, placeTypeName, placeTypeEmoji, streetAddress, city, state, zip, phone, website }, marker) {
		const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)},${encodeURIComponent(streetAddress)},${encodeURIComponent(city)},${encodeURIComponent(state)}+${encodeURIComponent(zip)}&destination_place_id=${encodeURIComponent(name)}`;
		const formattedPhone = phone.replace(/\D/g, '');
		const formattedPhoneNumber = formattedPhone.length === 11 && formattedPhone[0] === '1' ? `(${formattedPhone.substring(1, 4)}) ${formattedPhone.substring(4, 7)}-${formattedPhone.substring(7)}` : phone;
		const formattedWebsite = website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

		const card = document.createElement('div');
		card.classList.add('place-card');
		card.innerHTML = `
			<h2 class="card-title">${name}</h2>
			<p class="card-subtitle">${placeTypeEmoji} ${placeTypeName}</p>
			<p class="card-address">${streetAddress}<br>${city}, ${state} ${zip}</p>
			<div class="card-links">
				<div class="card-link">
					<span class="material-symbols-outlined">location_on</span>
					<a href="#" class="card-link-map" aria-label="View on interactive map">View on map</a>
				</div>
				<div class="card-link">
					<span class="material-symbols-outlined">directions</span>
					<a href="${googleMapsLink}" target="_blank" class="card-link-directions" aria-label="Get directions to ${streetAddress}, ${city}, ${state} ${zip}">Get directions</a>
				</div>
				<div class="card-link">
					<span class="material-symbols-outlined">call</span>
					<a href="tel:${phone}" class="card-link-phone" aria-label="Call ${formattedPhoneNumber}">${formattedPhoneNumber}</a>
				</div>
				<div class="card-link">
					<span class="material-symbols-outlined">globe</span>
					<a href="${website}" target="_blank" class="card-link-website" aria-label="Visit the website for ${formattedWebsite}">${formattedWebsite}</a>
				</div>
			</div>
		`;

		card.querySelector('.card-link-map').addEventListener('click', () => {
			marker.openPopup();
			this.map.setView(marker.getLatLng(), 17, { animate: true });

			gtag('event', 'card_link_click', {
				event_category: 'Card Link - Map',
				event_action: 'Click',
				event_label: this.textContent,
				place_name: card.querySelector('.card-title').textContent,
			});
		});

		card.querySelector('.card-link-directions').addEventListener('click', function () {
			gtag('event', 'card_link_click', {
				event_category: 'Card Link - Directions',
				event_action: 'Click',
				event_label: this.innerHTML.replace('<br>', ', '),
				place_name: card.querySelector('.card-title').textContent,
			});
		});

		card.querySelector('.card-link-phone').addEventListener('click', function () {
			gtag('event', 'card_link_click', {
				event_category: 'Card Link - Phone',
				event_action: 'Click',
				event_label: this.textContent,
				place_name: card.querySelector('.card-title').textContent,
			});
		});

		card.querySelector('.card-link-website').addEventListener('click', function () {
			gtag('event', 'card_link_click', {
				event_category: 'Card Link - Website',
				event_action: 'Click',
				event_label: this.href,
				place_name: card.querySelector('.card-title').textContent,
			});
		});

		return card;
	}

	addMapMarker({ name, placeTypeName, placeTypeEmoji, streetAddress, city, state, zip, phone, latitude, longitude }) {
		const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)},${encodeURIComponent(streetAddress)},${encodeURIComponent(city)},${encodeURIComponent(state)}+${encodeURIComponent(zip)}&destination_place_id=${encodeURIComponent(name)}`;
		const formattedPhone = phone.replace(/\D/g, '');
		const formattedPhoneNumber = formattedPhone.length === 11 && formattedPhone[0] === '1' ? `(${formattedPhone.substring(1, 4)}) ${formattedPhone.substring(4, 7)}-${formattedPhone.substring(7)}` : phone;

		const marker = L.marker([latitude, longitude], {
			icon: L.icon({
				iconUrl: '/wp-content/uploads/2024/12/marker-place.png',
				iconSize: [32, 40],
				iconAnchor: [16, 40],
				popupAnchor: [0, -40],
			}),
		})
			.bindPopup(
				`
					<p class="popup-title">${name}</p>
					<p class="popup-subtitle">${placeTypeEmoji} ${placeTypeName}</p>
					<a href="${googleMapsLink}" class="popup-link" target="_blank">${streetAddress}<br>${city}, ${state} ${zip}</a>
					<a href="tel:${phone}" class="popup-link" aria-label="Call ${formattedPhoneNumber}">${formattedPhoneNumber}</a>
				`
			)
			.addTo(this.markerLayer);

		this.markerMap.set(name, marker);
		return marker;
	}

	clearFilters() {
		if (this.searchInput.value || this.placeTypeFilter.value) {
			this.searchInput.value = '';
			this.placeTypeFilter.value = '';
			this.fetchPlaces();
		}
	}

	clearMapMarkers() {
		this.markerLayer.clearLayers();
		this.markerMap.clear();
	}

	clearUserLocationMarker() {
		if (this.userLocationMarker) {
			this.map.removeLayer(this.userLocationMarker);
			this.userLocationMarker = null;
		}
	}

	init() {
		let timer;
		this.searchInput.addEventListener('input', () => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				this.fetchPlaces();

				gtag('event', 'search_input', {
					event_category: 'Search Input',
					event_action: 'Input',
					event_label: this.searchInput.value,
				});
			}, 300);
		});

		this.placeTypeFilter.addEventListener('change', () => {
			this.fetchPlaces();

			gtag('event', 'filter_change', {
				event_category: 'Place Type Filter',
				event_action: 'Change',
				event_label: this.placeTypeFilter.value,
			});
		});

		this.clearBtn.addEventListener('click', () => {
			this.clearFilters();

			gtag('event', 'button_click', {
				event_category: 'Clear Button',
				event_action: 'Click',
				event_label: this.clearBtn.textContent,
			});
		});

		this.distanceCheckbox.addEventListener('change', () => {
			if (this.distanceCheckbox.checked) {
				this.getLocation();

				gtag('event', 'checkbox_change', {
					event_category: 'Sort by distance',
					event_action: 'Change',
					event_label: 'On',
				});
			} else {
				this.userLatitude = null;
				this.userLongitude = null;
				this.clearUserLocationMarker();
				this.fetchPlaces();

				this.map.setView(this.defaultMapCenter, this.defaultMapZoom);

				gtag('event', 'checkbox_change', {
					event_category: 'Sort by distance',
					event_action: 'Change',
					event_label: 'Off',
				});
			}
		});

		this.map = L.map('map', { center: this.defaultMapCenter, zoom: this.defaultMapZoom, scrollWheelZoom: false });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.map);

		this.fetchPlaces();
	}
}

new App();
