import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Cloud, Sun, CloudRain, Eye, Wind, Droplets, Thermometer, RefreshCw } from "lucide-react";

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
  dailyForecast: {
    time: string;
    temperature: number;
    icon: string;
  }[];
}

interface WeatherWidgetProps {
  location?: string;
  data?: WeatherData;
}

export default function WeatherWidget({ location, data }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async (locationQuery: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/weather/${encodeURIComponent(locationQuery)}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Unable to get weather information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      setWeatherData(data);
    }
  }, [data]);

  const getWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case 'sun':
        return <Sun className="h-5 w-5" />;
      case 'cloud':
        return <Cloud className="h-5 w-5" />;
      case 'cloud-rain':
        return <CloudRain className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading weather...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Weather Unavailable</h3>
            <p className="text-sm text-gray-200 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => location && fetchWeatherData(location)}
              className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData && !location) {
    return (
      <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Weather Widget</h3>
            <p className="text-sm text-slate-200">
              Search for a location to see weather information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Current Weather</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => location && fetchWeatherData(location)}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {weatherData && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-bold">{weatherData.temperature}°</div>
              <div className="flex-1">
                <div className="text-lg font-medium">{weatherData.location}</div>
                <div className="text-blue-100 text-sm">{weatherData.description}</div>
              </div>
              <Cloud className="h-8 w-8 opacity-80" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-200" />
                <span>Visibility: {weatherData.visibility}km</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-200" />
                <span>Wind: {weatherData.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-200" />
                <span>Humidity: {weatherData.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-blue-200" />
                <span>Feels like: {weatherData.feelsLike}°</span>
              </div>
            </div>

            {/* Hourly Forecast */}
            <div className="pt-4 border-t border-blue-400/30">
              <div className="text-sm font-medium mb-3">Next 6 Hours</div>
              <div className="flex justify-between text-xs">
                {weatherData.dailyForecast.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-blue-200 mb-1">{day.time}</div>
                    <div className="flex justify-center mb-1">
                      {getWeatherIcon(day.icon)}
                    </div>
                    <div className="font-medium">{day.temperature}°</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
