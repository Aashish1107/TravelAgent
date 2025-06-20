import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Compass, Bell } from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = useAuth().logout; 

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Compass className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900">TravelAgent Pro</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Dashboard
            </a>
            <a href="#" className="text-gray-700 hover:text-primary transition-colors font-medium">
              My Trips
            </a>
            <a href="#" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Agents
            </a>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={handleLogout} className="text-sm">
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = "/api/login"} className="bg-primary hover:bg-primary/90">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
