import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Plus, Package, MapPin, X, Check } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxesService } from "../../lib/boxes-service";
import { useAuth } from "../../utils/auth";
import KeyboardAvoidingAnimatedView from "../../components/KeyboardAvoidingAnimatedView";
import { useTheme } from "../../utils/theme";
import debounce from "lodash/debounce";

export default function CitizenMapScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [location, setLocation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [newBoxData, setNewBoxData] = useState({
    current_containers: "0",
    max_containers: "10",
  });
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [ignoreMapPress, setIgnoreMapPress] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Debounced region change handler
  const debouncedSetRegion = useCallback(
    debounce((region) => {
      setCurrentRegion(region);
    }, 150),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetRegion.cancel();
    };
  }, [debouncedSetRegion]);

  // Map styles
  const lightMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9b2a6' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#dfd2ae' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#93817c' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#a5b076' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#447530' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f1e6' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fdfcf8' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f8c967' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e9bc62' }] },
    { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#e98d58' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#806b63' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#dfd2ae' }] },
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#b9d3c2' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#92998d' }] }
  ];

  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#303030' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263238' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383838' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#4a4a4a' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#616161' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f1f1f' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b3d91' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#b0c4de' }] }
  ];

  // Fetch boxes
  const { data: boxesData, isLoading, refetch } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => boxesService.getAllBoxes(),
    enabled: isAuthenticated,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Create box mutation
  const createBoxMutation = useMutation({
    mutationFn: (boxData) => boxesService.createBox(boxData),
    onSuccess: async (newBox) => {
      await queryClient.invalidateQueries({ queryKey: ["boxes"] });
      await queryClient.refetchQueries({ queryKey: ["boxes"] });
      
      setShowAddModal(false);
      setNewBoxData({ current_containers: "0", max_containers: "10" });
      setSelectedCoordinate(null);
      Alert.alert("Éxito", "¡Caja creada exitosamente!");
    },
    onError: (error) => {
      console.error('Create box error:', error);
      Alert.alert("Error", error.message || "Error al crear la caja");
    },
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se requiere acceso a la ubicación");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      setCurrentRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated && refetch) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  const handleMapPress = useCallback((event) => {
    if (ignoreMapPress) {
      return;
    }
    
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
    setShowAddModal(true);
  }, [ignoreMapPress]);

  const handleCreateBox = useCallback(() => {
    if (!selectedCoordinate) return;

    const current = parseInt(newBoxData.current_containers) || 0;
    const max = parseInt(newBoxData.max_containers) || 10;

    if (current > max) {
      Alert.alert("Error", "Los envases actuales no pueden exceder la capacidad máxima");
      return;
    }

    createBoxMutation.mutate({
      latitude: selectedCoordinate.latitude,
      longitude: selectedCoordinate.longitude,
      current_containers: current,
      max_containers: max,
    });
  }, [selectedCoordinate, newBoxData, createBoxMutation]);

  const getMarkerColor = (box) => {
    const percentage = (box.current_containers / box.max_containers) * 100;
    if (percentage >= 100) return "#EF4444"; // Red - Full
    if (percentage >= 75) return "#F59E0B"; // Orange - Almost full
    return "#00B86C"; // Green - Available
  };

  const SimpleMarker = ({ box }) => {
    const handleMarkerPress = useCallback((event) => {
      try {
        if (event && event.stopPropagation) {
          event.stopPropagation();
        }
        
        setIgnoreMapPress(true);
        
        if (!box || !box.id || typeof box.current_containers === 'undefined' || typeof box.max_containers === 'undefined') {
          console.warn('Invalid box data:', box);
          setIgnoreMapPress(false);
          return;
        }
        
        setSelectedBox(box);
        setShowDetailModal(true);
        
        setTimeout(() => {
          setIgnoreMapPress(false);
        }, 100);
        
      } catch (error) {
        console.error('Error handling marker press:', error);
        setIgnoreMapPress(false);
      }
    }, [box]);

    const latitude = parseFloat(box.latitude);
    const longitude = parseFloat(box.longitude);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.warn('Invalid coordinates for box:', box.id, box.latitude, box.longitude);
      return null;
    }

    return (
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        pinColor={getMarkerColor(box)}
        title={`Box ${box.id}`}
        description={`${box.current_containers}/${box.max_containers} containers`}
        onPress={handleMarkerPress}
      />
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  const boxes = boxesData || [];
  
  console.log('Citizen Map - Current boxes:', boxes.length, boxes.map(b => ({ id: b.id, lat: b.latitude, lng: b.longitude })));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: isDark ? "#121212" : "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#333333" : "#F0F0F0",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Inter_600SemiBold",
            color: isDark ? "#FFFFFF" : "#000000",
          }}
        >
          Recipunto - Ciudadano
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginTop: 4,
          }}
        >
          Toca en el mapa para agregar una nueva caja de recolección
        </Text>
      </View>

      {/* Map */}
      <View style={{ flex: 1, marginTop: 100 }}>
        {location && currentRegion && (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            region={currentRegion}
            onPress={handleMapPress}
            onRegionChangeComplete={debouncedSetRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            customMapStyle={isDark ? darkMapStyle : []}
          >
            {boxes.filter(box => box && box.id && box.latitude && box.longitude).map((box) => (
              <SimpleMarker
                key={box.id}
                box={box}
              />
            ))}
          </MapView>
        )}
      </View>

      {/* Add Box Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingAnimatedView
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <View
            style={{
              backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
              maxHeight: "80%",
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 20,
              }}
            >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Agregar Caja de Recolección
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            {/* Location Display */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
                padding: 12,
                backgroundColor: isDark ? "#333333" : "#F0F0F0",
                borderRadius: 8,
              }}
            >
              <MapPin size={20} color="#00B86C" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                {selectedCoordinate
                  ? `${selectedCoordinate.latitude.toFixed(4)}, ${selectedCoordinate.longitude.toFixed(4)}`
                  : "No se ha seleccionado ubicación"}
              </Text>
            </View>

              {/* Form */}
              <View style={{ marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#FFFFFF" : "#000000",
                    marginBottom: 8,
                  }}
                >
                  Envases Actuales
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#333333" : "#E5E5E5",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#FFFFFF" : "#000000",
                    backgroundColor: isDark ? "#333333" : "#FFFFFF",
                    marginBottom: 20,
                  }}
                  value={newBoxData.current_containers}
                  onChangeText={(text) =>
                    setNewBoxData({ ...newBoxData, current_containers: text })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                />

                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#FFFFFF" : "#000000",
                    marginBottom: 8,
                  }}
                >
                  Capacidad Máxima
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#333333" : "#E5E5E5",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#FFFFFF" : "#000000",
                    backgroundColor: isDark ? "#333333" : "#FFFFFF",
                  }}
                  value={newBoxData.max_containers}
                  onChangeText={(text) =>
                    setNewBoxData({ ...newBoxData, max_containers: text })
                  }
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </View>

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? "#333333" : "#F0F0F0",
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#00B86C",
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    opacity: createBoxMutation.isPending ? 0.7 : 1,
                  }}
                  onPress={handleCreateBox}
                  disabled={createBoxMutation.isPending}
                >
                  <Check size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 16,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                    }}
                  >
                    {createBoxMutation.isPending ? "Creando..." : "Crear Caja"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingAnimatedView>
      </Modal>

      {/* Box Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDetailModal(false);
          setIgnoreMapPress(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
              borderRadius: 20,
              padding: 24,
              marginHorizontal: 20,
              minWidth: 280,
              maxWidth: 320,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Detalles de la Caja
              </Text>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setIgnoreMapPress(false);
              }}>
                <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            {/* Box Details */}
            {selectedBox && selectedBox.id && (
              <>
                {/* Box ID */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      marginBottom: 4,
                    }}
                  >
                    ID de la Caja
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_400Regular",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    #{selectedBox.id}
                  </Text>
                </View>

                {/* Container Status */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      marginBottom: 4,
                    }}
                  >
                    Estado de Envases
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontFamily: "Inter_600SemiBold",
                        color: getMarkerColor(selectedBox),
                      }}
                    >
                      {selectedBox.current_containers || 0}/{selectedBox.max_containers || 0}
                    </Text>
                    <Package 
                      size={24} 
                      color={getMarkerColor(selectedBox)} 
                    />
                  </View>
                </View>

                {/* Capacity Percentage */}
                <View style={{ marginBottom: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: isDark ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      Capacidad
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: getMarkerColor(selectedBox),
                      }}
                    >
                      {Math.round(((selectedBox.current_containers || 0) / (selectedBox.max_containers || 1)) * 100)}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: isDark ? "#333333" : "#E5E5E5",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${((selectedBox.current_containers || 0) / (selectedBox.max_containers || 1)) * 100}%`,
                        backgroundColor: getMarkerColor(selectedBox),
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>

                {/* Location */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      marginBottom: 4,
                    }}
                  >
                    Ubicación
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <MapPin size={16} color="#00B86C" />
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        color: isDark ? "#FFFFFF" : "#000000",
                      }}
                    >
                      {parseFloat(selectedBox.latitude || 0).toFixed(4)}, {parseFloat(selectedBox.longitude || 0).toFixed(4)}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    backgroundColor: getMarkerColor(selectedBox) + "20",
                    borderRadius: 20,
                    marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: getMarkerColor(selectedBox),
                      marginRight: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: getMarkerColor(selectedBox),
                    }}
                  >
                    {(() => {
                      const current = selectedBox.current_containers || 0;
                      const max = selectedBox.max_containers || 1;
                      const percentage = (current / max) * 100;
                      if (percentage >= 100) return "Llena";
                      if (percentage >= 75) return "Casi Llena";
                      return "Disponible";
                    })()}
                  </Text>
                </View>
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={{
                backgroundColor: isDark ? "#333333" : "#F0F0F0",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={() => {
                setShowDetailModal(false);
                setIgnoreMapPress(false);
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
