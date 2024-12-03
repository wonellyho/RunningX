import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const MapContainer = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [places, setPlaces] = useState([]); // 편의점 데이터
  const [nearbyToilets, setNearbyToilets] = useState([]); // 주변 화장실 데이터
  const [publicToilets, setPublicToilets] = useState([]); // 공공데이터 화장실 전체
  const [filteredPublicToilets, setFilteredPublicToilets] = useState([]); // 1000m 내의 화장실
  const [selectedPlace, setSelectedPlace] = useState(null);

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  const defaultCenter = {
    lat: 37.5665, // 서울의 위도 (기본 중심 위치)
    lng: 126.9780 // 서울의 경도
  };

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(newPosition);
          loadNearbyPlaces(newPosition, "convenience_store", setPlaces);
          loadNearbyPlaces(newPosition, "toilet", setNearbyToilets);
          filterPublicToilets(newPosition); // 현재 위치를 기준으로 공공데이터 필터링
          console.log("Initial position: ", position.coords);
        },
        (error) => {
          console.error("Error getting location", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentPosition(newPosition);
        loadNearbyPlaces(newPosition, "convenience_store", setPlaces);
        loadNearbyPlaces(newPosition, "toilet", setNearbyToilets);
        filterPublicToilets(newPosition); // 현재 위치 업데이트 시 필터링도 수행
        console.log("Updated position: ", position.coords);
      },
      (error) => {
        console.error("Error watching location", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 공공데이터 화장실 정보 로드
  useEffect(() => {
    fetch("/toilets_cleaned.json") // 공공데이터 JSON 파일 경로
      .then((response) => response.json())
      .then((data) => {
        const parsedData = data.map((toilet) => ({
          ...toilet,
          latitude: parseFloat(toilet.latitude),
          longitude: parseFloat(toilet.longitude)
        }));
        setPublicToilets(parsedData);
        console.log("Public toilet data: ", parsedData);
      })
      .catch((error) => console.error("Error loading public toilet data:", error));
  }, []);

  // 공공데이터 화장실 필터링
  const filterPublicToilets = (position) => {
    if (!position || publicToilets.length === 0) return;

    const filtered = publicToilets.filter((toilet) => {
      const toiletPosition = new window.google.maps.LatLng(toilet.latitude, toilet.longitude);
      const currentLatLng = new window.google.maps.LatLng(position.lat, position.lng);

      // Google Maps API로 거리 계산
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        currentLatLng,
        toiletPosition
      );
      return distance <= 5000; // 1000m 이하인 화장실만 필터링
    });

    setFilteredPublicToilets(filtered);
    console.log("Filtered toilets: ", filtered);
  };

  // 주변 장소 로드 (편의점, 주변 화장실)
  const loadNearbyPlaces = (position, type, setPlacesCallback) => {
    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
    const request = {
      location: position,
      radius: "1000", // 1km 반경
      type: [type]
    };
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setPlacesCallback(results);
      } else {
        console.error(`Places service status (${type}): `, status);
      }
    });
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={["places", "geometry"]}
    >
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={15}
        center={currentPosition || defaultCenter}
      >
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }}
          />
        )}
        {places.map((place, index) => (
          <Marker
            key={`place-${index}`}
            position={{
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }}
            onClick={() => setSelectedPlace(place)}
          />
        ))}
        {nearbyToilets.map((toilet, index) => (
          <Marker
            key={`nearby-toilet-${index}`}
            position={{
              lat: toilet.geometry.location.lat(),
              lng: toilet.geometry.location.lng()
            }}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            }}
            onClick={() => setSelectedPlace(toilet)}
          />
        ))}
        {filteredPublicToilets.map((toilet, index) => (
          <Marker
            key={`public-toilet-${index}`}
            position={{
              lat: toilet.latitude,
              lng: toilet.longitude
            }}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
            }}
            onClick={() => setSelectedPlace(toilet)}
          />
        ))}
        {selectedPlace && (
          <InfoWindow
            position={
              selectedPlace.geometry
                ? {
                    lat: selectedPlace.geometry.location.lat(),
                    lng: selectedPlace.geometry.location.lng()
                  }
                : {
                    lat: selectedPlace.latitude,
                    lng: selectedPlace.longitude
                  }
            }
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div>
              <h4>{selectedPlace.name}</h4>
              {selectedPlace.vicinity && <p>{selectedPlace.vicinity}</p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapContainer;
