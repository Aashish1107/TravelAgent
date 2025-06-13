import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MapPin, Plus, Minus, Layers } from "lucide-react";

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface InteractiveMapProps {
  locations: Location[];
  selectedLocation: any;
  onLocationSelect: (location: any) => void;
}

export default function InteractiveMap({ locations, selectedLocation, onLocationSelect }: InteractiveMapProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Interactive Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-b-lg overflow-hidden">
          {/* Placeholder for Google Maps integration */}
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=400"
            alt="Map view placeholder"
            className="w-full h-full object-cover"
          />
          
          {/* Map Controls */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
            <Button size="icon" variant="outline" className="w-8 h-8">
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="w-8 h-8">
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Location Markers */}
          {locations.map((location, index) => (
            <div
              key={location.id}
              className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer animate-bounce ${
                index === 0 ? 'bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
                index === 1 ? 'bg-blue-500 top-1/3 left-1/3' :
                index === 2 ? 'bg-green-500 top-2/3 left-2/3' :
                'bg-purple-500 top-1/4 right-1/4'
              }`}
              onClick={() => onLocationSelect(location)}
              title={location.name}
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}

          {/* Map Type Toggle */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <select className="border-none bg-transparent focus:outline-none text-sm">
                <option>Satellite</option>
                <option>Street</option>
                <option>Terrain</option>
              </select>
            </Button>
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedLocation.location}</h3>
              <p className="text-sm text-gray-600">
                {selectedLocation.latitude && selectedLocation.longitude
                  ? `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                  : "Coordinates not available"}
              </p>
            </div>
          )}

          {/* Integration Note */}
          <div className="absolute bottom-4 right-4 bg-blue-500/90 text-white px-3 py-2 rounded-lg text-sm font-medium">
            🗺️ Google Maps Integration Ready
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
