import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import axios from "axios";

// Google Translate API를 사용한 번역 함수
const translateText = async (text, targetLang = "en") => {
  const apiKey = "AIzaSyDldbOmjV78SkOb2Jp3NdwTOgFldJ6J54Q"; // Google Cloud Translation API 키
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  try {
    const response = await axios.post(
      url,
      {
        q: text, // 번역할 텍스트
        target: targetLang, // 번역할 언어 (영어: "en")
        format: "text",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data.translations[0].translatedText; // 번역된 텍스트 반환
  } catch (error) {
    console.error("Translation API error:", error.response?.data || error.message);
    return text; // 에러 발생 시 원본 텍스트 반환
  }
};

const MapContainer = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [places, setPlaces] = useState([]);
  const [toilets, setToilets] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [directions, setDirections] = useState(null);

  const mapStyles = {
    height: "100vh",
    width: "100%",
  };

  const defaultCenter = {
    lat: 37.5665, // 서울의 위도 (기본 중심 위치)
    lng: 126.9780, // 서울의 경도
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(newPosition);
          await loadAndTranslateNearbyPlaces(newPosition, "convenience_store", setPlaces);
          await loadAndTranslateNearbyPlaces(newPosition, "toilet", setToilets);
          await loadAndTranslateNearbyPlaces(newPosition, "tourist_attraction", setLandmarks);
          console.log("Initial position: ", position.coords);
        },
        (error) => {
          console.error("Error getting location", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  // Google Places 데이터를 불러오고 번역하는 함수
  const loadAndTranslateNearbyPlaces = async (position, type, setPlacesCallback) => {
    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
    const request = {
      location: position,
      radius: "1000",
      type: [type],
    };

    service.nearbySearch(request, async (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const translatedResults = await Promise.all(
          results.map(async (place) => {
            const translatedName = await translateText(place.name, "en");
            const translatedVicinity = await translateText(place.vicinity, "en");
            return {
              ...place,
              name: translatedName,
              vicinity: translatedVicinity,
            };
          })
        );
        setPlacesCallback(translatedResults);
      } else {
        console.error(`Places service status (${type}): `, status);
      }
    });
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <div>
        <button onClick={() => console.log("Navigate to convenience store")}>가장 가까운 편의점 길안내</button>
        <button onClick={() => console.log("Navigate to toilet")}>가장 가까운 화장실 길안내</button>
        <GoogleMap mapContainerStyle={mapStyles} zoom={15} center={currentPosition || defaultCenter}>
          {currentPosition && (
            <Marker
              position={currentPosition}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          )}
          {places.map((place, index) => (
            <Marker
              key={index}
              position={{
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
              onClick={() => setSelectedPlace(place)}
            />
          ))}
          {toilets.map((toilet, index) => (
            <Marker
              key={index}
              position={{
                lat: toilet.geometry.location.lat(),
                lng: toilet.geometry.location.lng(),
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
              }}
              onClick={() => setSelectedPlace(toilet)}
            />
          ))}
          {landmarks.map((landmark, index) => (
            <Marker
              key={index}
              position={{
                lat: landmark.geometry.location.lat(),
                lng: landmark.geometry.location.lng(),
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
              }}
              onClick={() => setSelectedPlace(landmark)}
            />
          ))}
          {selectedPlace && (
            <InfoWindow
              position={{
                lat: selectedPlace.geometry?.location?.lat(),
                lng: selectedPlace.geometry?.location?.lng(),
              }}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div>
                <h4>{selectedPlace.name}</h4>
                <p>{selectedPlace.vicinity}</p>
              </div>
            </InfoWindow>
          )}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default MapContainer;
