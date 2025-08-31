document.getElementById("find-restaurants").addEventListener(
  "click", () => {
    const location = document.getElementById("search-input").value.trim();
    if (location) {
      fetchLocationCoordinates(location);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showRestaurantByPosition, showError);
    } else {
      alert("Geolocation is not supported by the browser!");
    }
  }
);

const fetchLocationCoordinates = (location) => {
  const nominatimEndpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;
  fetch(nominatimEndpoint)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        const { lat, lon } = data[0];
        fetchRestaurants(lat, lon);
      } else {
        alert("Location not found!");
      }
    })
    .catch((error) => {
      console.log("Error fetching location data from Nominatim", error);
    });
};

const showRestaurantByPosition = (position) => {
  const { latitude, longitude } = position.coords;
  fetchRestaurants(latitude, longitude);
};

const fetchRestaurants = (latitude, longitude) => {
  const overpassEndpoint = `https://www.overpass-api.de/api/interpreter?data=[out:json];node[amenity=restaurant](around:5000,${latitude},${longitude});out;`;

  fetch(overpassEndpoint)
    .then((response) => response.json())
    .then((data) => {
      const restaurants = data.elements;
      const restaurantsContainer = document.getElementById("restaurants");
      restaurantsContainer.innerHTML = ""; // clear previous results

      if (restaurants.length === 0) {
        restaurantsContainer.innerHTML = "<p>No restaurants found nearby.</p>";
        return;
      }

      // Limit to 10 restaurants to stay within API limits
      const limitedRestaurants = restaurants.slice(0, 10);

      limitedRestaurants.forEach((restaurant, i) => {
        setTimeout(() => {
          const card = document.createElement("div");
          card.className = "restaurant-card";

          const name = restaurant.tags.name || "Unnamed Restaurant";
          const cuisine = restaurant.tags.cuisine
            ? restaurant.tags.cuisine.replace(/_/g, " ")
            : "Cuisine not specified";

          // Reverse geocode (1 request per second per restaurant)
          const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${restaurant.lat}&lon=${restaurant.lon}`;

          fetch(reverseUrl)
            .then((res) => res.json())
            .then((addrData) => {
              const fullAddress = addrData.display_name || "Address not available";

              card.innerHTML = `
                <a href="https://www.openstreetmap.org/?mlat=${restaurant.lat}&mlon=${restaurant.lon}" 
                    target="_blank" rel="noopener noreferrer">
                    <h2>${name}</h2>
                </a>
                <p><strong>Cuisine:</strong> ${cuisine}</p>
                <p><strong>Address:</strong> ${fullAddress}</p>
              `;
              restaurantsContainer.appendChild(card);
            })
            .catch(() => {
              card.innerHTML = `
                <a href="https://www.openstreetmap.org/?mlat=${restaurant.lat}&mlon=${restaurant.lon}" 
                    target="_blank" rel="noopener noreferrer">
                    <h2>${name}</h2>
                </a>
                <p><strong>Cuisine:</strong> ${cuisine}</p>
                <p><strong>Address:</strong> Not available</p>
              `;
              restaurantsContainer.appendChild(card);
            });
        }, i * 1200); // space requests ~1.2 sec apart
      });
    })
    .catch((error) => {
      console.log("Error fetching data from Overpass API", error);
    });
};


const showError = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert("User denied location permission!");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable!");
      break;
    case error.TIMEOUT:
      alert("The request to get location timed out!");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred!");
      break;
  }
};
