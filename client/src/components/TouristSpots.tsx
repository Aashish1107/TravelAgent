import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MapPin, Star, Bookmark, ExternalLink, MoreVertical } from "lucide-react";

interface TouristSpot {
  id: string;
  name: string;
  description: string;
  rating: number;
  distance: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface TouristSpotsProps {
  spots: TouristSpot[];
  isLoading: boolean;
  onSaveSpot: (spot: TouristSpot) => void;
}

export default function TouristSpots({ spots, isLoading, onSaveSpot }: TouristSpotsProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate loading more spots
    setTimeout(() => {
      setLoadingMore(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Searching for Tourist Spots...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary icon1 icon1:hover" />
            Nearby Tourist Spots
          </CardTitle>
          <Badge variant="secondary" className="bg-gray-100">
            {spots.length} found
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {spots.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4 icon1" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spots found</h3>
            <p className="text-gray-500">
              Try searching for a different location to discover amazing tourist attractions.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {spots.map((spot) => (
                <div
                  key={spot.id}
                  className="group cursor-pointer bg-gray-50/80 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900"
                        onClick={() => onSaveSpot(spot)}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{spot.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{spot.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{spot.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{spot.distance}km away</span>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        View Details
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {spots.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-medium"
                >
                  {loadingMore ? "Loading..." : "Load More Spots"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
