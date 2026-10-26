'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;
let workouts = [];

// 1. Get current position of user
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
       (pos) => {
            const {latitude, longitude} = pos.coords;
            console.log(`Lat: ${latitude}, Lng: ${longitude}`);

            map = L.map('map').setView([latitude, longitude], 13);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            L.marker([latitude, longitude])
                 .addTo(map)
                .bindPopup('Running on 14')
                .openPopup();

            // Page load hote hi local storage se data load karo
            getLocalStorage();

            function onMapClick(e) {
                mapEvent = e;
                form.classList.remove('hidden');
                inputDistance.focus();
            }

            map.on('click', onMapClick);
        },  
        (err) => {
            console.log(`Error ${err.code}: ${err.message}`);
        },
        { enableHighAccuracy: true }
    );
} else { 
    console.error("Geolocation is not supported by this browser.");
}

// 2. Workout Card Render karne ka reusable function
function renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} on ${months[new Date(workout.date).getMonth()]} ${new Date(workout.date).getDate()}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">KM</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">MIN</span>
          </div>
    `;

    if (workout.type === 'running') {
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">MIN/KM</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">SPM</span>
          </div>
        </li>
        `;
    }

    if (workout.type === 'cycling') {
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">KM/H</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">M</span>
          </div>
        </li>
        `;
    }

    containerWorkouts.insertAdjacentHTML('afterbegin', html);
}

// 3. Form Submit Event
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const {lat, lng} = mapEvent.latlng;

    const workout = {
        id: (Date.now() + '').slice(-10),
        coords: [lat, lng],
        type: type,
        distance: distance,
        duration: duration,
        date: new Date(),
    };

    if (type === "running") {
        const cadence = +inputCadence.value;
        workout.cadence = cadence;
        workout.pace = duration / distance;
    } else if (type === "cycling") {
        const elevation = +inputElevation.value;
        workout.elevationGain = elevation;
        workout.speed = distance / (duration / 60);
    }

    // Workouts array me push karo (Yeh zaroori hai!)
    workouts.push(workout);

    // Local Storage me save karo
    setLocalStorage();

    form.classList.add('hidden');

    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';

    // Map par Marker lagana aur Popup show karna
    L.marker(mapEvent.latlng)
        .addTo(map)
        .bindPopup(
          L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${type}-popup`,
          })
        )
        .setPopupContent(`${type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${type.charAt(0).toUpperCase() + type.slice(1)} on ${months[workout.date.getMonth()]} ${workout.date.getDate()}`)
        .openPopup();

    // Sidebar mein HTML card render karna
    renderWorkout(workout);
});

// 4. Dropdown Change Event
inputType.addEventListener('change', function() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});

// 5. Local Storage Functions (Global Scope - File ke aakhir mein)
function setLocalStorage() {
  localStorage.setItem('workouts', JSON.stringify(workouts));
}

function getLocalStorage() {
  const data = JSON.parse(localStorage.getItem('workouts'));
  if (!data) return;

  workouts = data;
  workouts.forEach(work => {
    renderWorkout(work);
  });
}