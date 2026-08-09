import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Linking,
  } from "react-native";
  import { useSafeAreaInsets } from "react-native-safe-area-context";
  import { StatusBar } from "expo-status-bar";
  import { useRouter } from "expo-router";
  import {
    HelpCircle,
    Info,
    Mail,
    ExternalLink,
    Recycle,
    ChevronRight,
    LogOut,
  } from "lucide-react-native";
  import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  } from "@expo-google-fonts/inter";
  import { useAuth } from "../../utils/auth";
  import { Alert } from "react-native";
  
  export default function CollectorSettingsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const { signOut } = useAuth();
    const router = useRouter();
  
    const [fontsLoaded] = useFonts({
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
    });
  
    const handleEmailSupport = () => {
      Linking.openURL(
        "mailto:support@recipunto.com?subject=Recipunto App Support",
      );
    };
  
    const handleOpenWebsite = () => {
      Linking.openURL("https://recipunto.com");
    };
  
    const handleSignOut = () => {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que quieres cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar Sesión",
            style: "destructive",
            onPress: async () => {
              const { error } = await signOut();
              if (error) {
                Alert.alert("Error", error.message);
              } else {
                // Redirigir explícitamente al login
                router.replace("/auth");
              }
            },
          },
        ]
      );
    };
  
    const SettingsItem = ({
      title,
      subtitle,
      icon: Icon,
      onPress,
      color = isDark ? "#FFFFFF" : "#000000",
    }) => (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#3A3A3A" : "#F0F0F0",
        }}
        onPress={onPress}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#3A3A3A" : "#F5F5F5",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <Icon size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_500Medium",
              color: color,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
      </TouchableOpacity>
    );
  
    if (!fontsLoaded) {
      return null;
    }
  
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
          paddingTop: insets.top,
        }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#3A3A3A" : "#E5E5E5",
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 4,
            }}
          >
            Configuración
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              color: isDark ? "#9CA3AF" : "#6B7280",
            }}
          >
            Gestiona tu cuenta y preferencias
          </Text>
        </View>
  
        <ScrollView style={{ flex: 1 }}>
          {/* Support Section */}
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 12,
                paddingHorizontal: 20,
              }}
            >
              Soporte
            </Text>
            
            <View
              style={{
                backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
                borderRadius: 12,
                marginHorizontal: 20,
                overflow: "hidden",
              }}
            >
              <SettingsItem
                title="Contactar Soporte"
                subtitle="Envía un email para obtener ayuda"
                icon={Mail}
                onPress={handleEmailSupport}
              />
              <SettingsItem
                title="Sitio Web"
                subtitle="Visita recipunto.com"
                icon={ExternalLink}
                onPress={handleOpenWebsite}
              />
              <SettingsItem
                title="Acerca de Recipunto"
                subtitle="Información de la aplicación"
                icon={Info}
                onPress={() => {
                  Alert.alert(
                    "Acerca de Recipunto",
                    "Recipunto - Sistema de gestión de residuos reciclables\n\nVersión 1.0.0\n\nUna aplicación para conectar ciudadanos, municipios y recicladores en la gestión sostenible de residuos.",
                    [{ text: "Cerrar", style: "default" }]
                  );
                }}
              />
            </View>
          </View>
  
          {/* Account Section */}
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 12,
                paddingHorizontal: 20,
              }}
            >
              Cuenta
            </Text>
            
            <View
              style={{
                backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
                borderRadius: 12,
                marginHorizontal: 20,
                overflow: "hidden",
              }}
            >
              <SettingsItem
                title="Cerrar Sesión"
                subtitle="Salir de tu cuenta"
                icon={LogOut}
                onPress={handleSignOut}
                color="#EF4444"
              />
            </View>
          </View>
  
          {/* App Info */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Recycle size={24} color="#00B86C" />
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Inter_600SemiBold",
                  color: "#00B86C",
                  marginLeft: 8,
                }}
              >
                Recipunto
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
                textAlign: "center",
              }}
            >
              Gestión sostenible de residuos
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }