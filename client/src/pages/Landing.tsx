import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Compass, MapPin, Cloud, Users, Sparkles, Globe } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
    
  };

  return (
    <div className="min-h-screen travel-gradient">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Compass className="h-8 w-8 text-primary icon1" />
              <span className="text-xl font-bold text-gray-900">TravelAgent Pro</span>
            </div>
            <Button onClick={handleLogin} className="button-primary button-primary:hover">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-balance">
            Let our AI travel agents find the perfect tourist spots and weather information for your destination. 
            Experience intelligent travel planning with real-time data and personalized recommendations.
          </p>
          <Button onClick={handleLogin} size="lg" className="button-primary button-primary:hover/90 text-lg px-8 py-6">
            Start Your Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary icon1" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Location Discovery</h3>
              <p className="text-gray-600">
                Our tourist agent uses advanced APIs to find the best attractions, restaurants, and hidden gems near any location.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-8 w-8 text-secondary icon2" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Weather Intel</h3>
              <p className="text-gray-600">
                Get accurate weather forecasts and climate insights to plan your activities with confidence.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent icon3" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Coordination</h3>
              <p className="text-gray-600">
                Multiple specialized agents work together to provide comprehensive travel recommendations tailored to you.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technology Showcase */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge AI agents that communicate through the MCP protocol for seamless coordination.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-primary icon1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Multi-Agent Architecture</h3>
                  <p className="text-gray-600">
                    Specialized AI agents for tourism and weather work together under a supervisor to provide comprehensive travel insights.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 text-secondary icon2" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">MCP Protocol Integration</h3>
                  <p className="text-gray-600">
                    Uses the Model Context Protocol for efficient communication between AI agents and external data sources.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Compass className="h-6 w-6 text-accent icon3" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Real-time Data Sources</h3>
                  <p className="text-gray-600">
                    Integrates with Google Maps, weather APIs, and tourism databases for up-to-date information.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Compass className="h-8 w-8 text-white icon1" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Your Personal Travel Companion
                </h3>
                <p className="text-gray-600 mb-6">
                  Experience the future of travel planning with AI agents that understand your preferences and provide personalized recommendations.
                </p>
                <Button onClick={handleLogin} className="button-primary button-primary:hover/90">
                  Try It Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Explore the World?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who trust TravelAgent Pro for their adventure planning needs.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
            Start Planning Your Trip
          </Button>
        </div>
      </div>
    </div>
  );
}
