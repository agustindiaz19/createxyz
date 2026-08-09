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

export default function SettingsScreen() {
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
        backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? "#333333" : "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${color}20`,
          justifyContent: "center",
          alignItems: "center",
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
            color: isDark ? "#FFFFFF" : "#000000",
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
      <ChevronRight size={20} color={isDark ? "#9CA3AF" : "#9B9B9B"} />
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return null;
  }

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
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Inter_600SemiBold",
            color: isDark ? "#FFFFFF" : "#000000",
          }}
        >
          Settings
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginTop: 4,
          }}
        >
          App preferences and information
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Section */}
        <View
          style={{
            backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#00B86C",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Recycle size={28} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 4,
            }}
          >
            Recipunto
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: isDark ? "#9CA3AF" : "#6B7280",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Tetra Pak Collection Tracker
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              color: isDark ? "#9CA3AF" : "#6B7280",
            }}
          >
            Version 1.0.0
          </Text>
        </View>

        {/* Support */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            Support
          </Text>

          <SettingsItem
            title="Help & Support"
            subtitle="Get help with using the app"
            icon={HelpCircle}
            onPress={handleEmailSupport}
            color="#3B82F6"
          />

          <SettingsItem
            title="Contact Us"
            subtitle="Send us feedback or report issues"
            icon={Mail}
            onPress={handleEmailSupport}
            color="#8B5CF6"
          />
        </View>

        {/* About */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            About
          </Text>

          <SettingsItem
            title="About Recipunto"
            subtitle="Learn more about our mission"
            icon={Info}
            onPress={handleOpenWebsite}
            color="#00B86C"
          />

          <SettingsItem
            title="Visit Website"
            subtitle="recipunto.com"
            icon={ExternalLink}
            onPress={handleOpenWebsite}
            color="#F59E0B"
          />
        </View>

        {/* Sign Out Section */}
        <View style={{ marginTop: 24 }}>
          <SettingsItem
            title="Cerrar Sesión"
            subtitle="Salir de tu cuenta"
            icon={LogOut}
            onPress={handleSignOut}
            color="#EF4444"
          />
        </View>
      </ScrollView>
    </View>
  );
}
