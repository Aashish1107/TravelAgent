import { useState } from "react";
import Navigation from "../components/Navigation";
import LocationSearch from "../components/LocationSearch";
import InteractiveMap from "../components/InteractiveMap";
import TouristSpots from "../components/TouristSpots";
import AgentChat from "../components/AgentChat";
import WeatherWidget from "../components/WeatherWidget";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Plus, Bookmark, Share, MapPin } from "lucide-react";

interface LocationData {
  location: string;
  latitude?: number;
  longitude?: number;
}

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const handleLocationSearch = async (locationData: LocationData, searchType: 'tourist' | 'weather' | 'both') => {
    setIsLoading(true);
    setCurrentLocation(locationData);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/search/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          ...locationData,
          searchType,
        }),
      });
      if (response.status==401) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/search/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            ...locationData,
            searchType,
          }),
        });
      }
      const data = await response.json();
      if (data.success) {
        // Simulate some search results for the UI
        setSearchResults([
          ...data.data.spots.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            latitude: item.latitude,
            longitude: item.longitude,
            imageUrl: item.imageUrl,
            rating: item.rating,
            distance: item.distance,
          })),
        ]);
        if (searchType === 'weather' || searchType === 'both') {
          setWeatherData(data.data.weather);
        } else {
          setWeatherData(null);
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanNewTrip = () => {
    setCurrentLocation(null);
    setSearchResults([]);
  };

  const handleSaveCurrentSearch = async () => {
    if (!currentLocation) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `Trip to ${currentLocation.location}`,
          description: `Exploring ${currentLocation.location} and nearby attractions`,
          locations: [currentLocation],
        }),
      });
      if (response.status==401) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/trips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            name: `Trip to ${currentLocation.location}`,
            description: `Exploring ${currentLocation.location} and nearby attractions`,
            locations: [currentLocation],
          }),
        });
      }
      if (response.ok) {
        alert('Trip saved successfully!');
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleShareItinerary = async () => {
    if (navigator.share && currentLocation) {
      try {
        await navigator.share({
          title: `Trip to ${currentLocation.location}`,
          text: `Check out this amazing destination: ${currentLocation.location}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen travel-gradient">
      <Navigation />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section with Location Input */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Your Next Adventure
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let our AI travel agents find the perfect tourist spots and weather information for your destination
            </p>
          </div>

          <LocationSearch onLocationSearch={handleLocationSearch} isLoading={isLoading} />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Map and Results */}
          <div className="lg:col-span-2 space-y-6">
            <InteractiveMap 
              locations={searchResults} 
              selectedLocation={currentLocation} 
              onLocationSelect={setCurrentLocation}
            />
            
            <TouristSpots 
              spots={searchResults} 
              isLoading={isLoading}
              onSaveSpot={async (spot) => {
                try {
                  await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spots/save`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      spotId: spot.id,
                      name: spot.name,
                      description: spot.description,
                      latitude: spot.latitude,
                      longitude: spot.longitude,
                      rating: spot.rating,
                      imageUrl: spot.imageUrl,
                      distance: spot.distance,
                    }),
                  });
                  alert('Spot saved successfully!');
                } catch (error) {
                  console.error('Error saving spot:', error);
                }
              }}
            />
          </div>

          {/* Right Column: Agents and Weather */}
          <div className="space-y-6">
            <AgentChat />
            
            <WeatherWidget data={weatherData} />

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3 hover:bg-white/60"
                    onClick={handlePlanNewTrip}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Plus className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Plan New Trip</div>
                      <div className="text-sm text-gray-500">Start fresh travel planning</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3 hover:bg-white/60"
                    onClick={handleSaveCurrentSearch}
                    disabled={!currentLocation}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Bookmark className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Save Search</div>
                      <div className="text-sm text-gray-500">Bookmark this location</div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3 hover:bg-white/60"
                    onClick={handleShareItinerary}
                    disabled={!currentLocation}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Share className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Share Itinerary</div>
                      <div className="text-sm text-gray-500">Send to friends & family</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button 
          size="icon" 
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          onClick={handlePlanNewTrip}
        >
          <MapPin className="h-6 w-6 icon1" />
        </Button>
      </div>
    </div>
  );
}
