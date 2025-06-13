import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Search, MapPin, Cloud } from "lucide-react";

interface LocationSearchProps {
  onLocationSearch: (location: { location: string; latitude?: number; longitude?: number }, searchType: 'tourist' | 'weather' | 'both') => void;
  isLoading: boolean;
}

export default function LocationSearch({ onLocationSearch, isLoading }: LocationSearchProps) {
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = (searchType: 'tourist' | 'weather' | 'both', e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim() && (!latitude || !longitude)) {
      alert("Please enter a location or coordinates");
      return;
    }

    const locationData = {
      location: location.trim() || `${latitude}, ${longitude}`,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };

    onLocationSearch(locationData, searchType);
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          setLocation(`Current Location (${lat}, ${lng})`);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your current location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Text Search */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">Search by Location</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter city, address, or landmark"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-12 h-12 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="w-full"
                disabled={isLoading}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use Current Location
              </Button>
            </div>

            {/* Coordinates Input */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">Or Use Coordinates</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  step="any"
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Input
                  type="number"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  step="any"
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                Example: 37.7749, -122.4194 (San Francisco)
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              onClick={(e) => handleSubmit('tourist', e)}
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-semibold transform hover:scale-[1.02] transition-all shadow-lg"
            >
              <MapPin className="h-5 w-5 mr-2" />
              {isLoading ? "Searching..." : "Find Tourist Spots"}
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit('weather', e)}
              disabled={isLoading}
              className="flex-1 bg-secondary hover:bg-secondary/90 h-12 text-base font-semibold transform hover:scale-[1.02] transition-all shadow-lg"
            >
              <Cloud className="h-5 w-5 mr-2" />
              {isLoading ? "Searching..." : "Get Weather Info"}
            </Button>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              onClick={(e) => handleSubmit('both', e)}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50"
            >
              🚀 Get Complete Travel Info (Both)
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
