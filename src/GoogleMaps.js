import React, { useState, useRef } from "react";
import { GoogleMap, LoadScript, Autocomplete } from "@react-google-maps/api";

const containerStyle = {
  width: "400px",
  height: "400px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const API_KEY = "AIzaSyCZWnG3j6OildaluVhLMXQhnTQsrBXr0MM"; // Replace with your actual Google Maps API key

function GoogleMaps() {
  const [location, setLocation] = useState("");
  const autocompleteRef = useRef(null);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place) {
        console.log("Selected Place:", place);
        setLocation(place.formatted_address || "");
      }
    }
  };

  return (
    <LoadScript googleMapsApiKey={API_KEY} libraries={["places"]}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        <Autocomplete
          onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
          onPlaceChanged={handlePlaceSelect}
        >
          <input
            type="text"
            placeholder="Search a location"
            style={{
              width: "300px",
              height: "300px",
              marginTop: "100px",
            }}
          />
        </Autocomplete>
      </GoogleMap>
      {location && <p>Selected Location: {location}</p>}
    </LoadScript>
  );
}

export default GoogleMaps;