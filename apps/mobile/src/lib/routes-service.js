import AsyncStorage from '@react-native-async-storage/async-storage';

const ROUTES_STORAGE_KEY = '@recipunto_routes';

// Service to handle routes
export const routesService = {
  // Get all routes
  async getAllRoutes() {
    try {
      const data = await AsyncStorage.getItem(ROUTES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching routes:', error);
      return [];
    }
  },

  // Create a new route
  async createRoute(routeData) {
    try {
      const routes = await this.getAllRoutes();
      const newRoute = {
        id: Date.now().toString(),
        name: routeData.name,
        boxes: routeData.boxes,
        createdAt: new Date().toISOString(),
        totalDistance: routeData.totalDistance || 0,
        estimatedTime: routeData.estimatedTime || 0,
        algorithm: routeData.algorithm || 'nearest',
      };
      
      routes.push(newRoute);
      await AsyncStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
      return newRoute;
    } catch (error) {
      console.error('Error creating route:', error);
      throw new Error('Failed to create route');
    }
  },

  // Get a route by ID
  async getRouteById(id) {
    try {
      const routes = await this.getAllRoutes();
      return routes.find(route => route.id === id);
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  },

  // Delete a route
  async deleteRoute(id) {
    try {
      const routes = await this.getAllRoutes();
      const filteredRoutes = routes.filter(route => route.id !== id);
      await AsyncStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(filteredRoutes));
      return true;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw new Error('Failed to delete route');
    }
  },
};

