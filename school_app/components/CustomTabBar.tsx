import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";

const { width } = Dimensions.get("window");

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const { user } = useAuthStore();
  const role = user?.role || "guest";
  const isFloating =
    role === "super_admin" ||
    role === "parent" ||
    role === "guest" ||
    role === "admin_staff" ||
    role === "teacher";

  const getGradientColors = () => {
    if (role === "admin_staff") return ["#0d2a24", "#121414"] as const;
    if (role === "teacher") return ["#121212", "#0d0d12"] as const;
    if (role === "parent") return ["#16162D", "#0A0A1F"] as const;
    return ["#1c2222", "#101415"] as const;
  };

  return (
    <View
      style={[
        isFloating ? styles.floatingContainer : styles.fullWidthContainer,
        role === "teacher"
          ? {
              shadowColor: "#ddb7ff",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 22,
              elevation: 24,
              overflow: "visible",
            }
          : role === "parent"
          ? {
              shadowColor: "#5E5CE6",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 24,
              overflow: "visible",
              borderColor: "rgba(255, 255, 255, 0.15)",
            }
          : {},
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.blurContainer,
          isFloating
            ? { borderRadius: 37, overflow: "hidden" }
            : {
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: "hidden",
              },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const isTeacher = role === "teacher";
          const isParent = role === "parent";
          const hasManyTabs = state.routes.length > 5;
          const themeColor = options.tabBarActiveTintColor || (isParent ? "#5E5CE6" : "#ddb7ff");

          const activeColor = (isParent || isTeacher) ? themeColor : "#0F172A";
          const inactiveColor = isParent ? "rgba(255, 255, 255, 0.4)" : isTeacher ? "rgba(207, 194, 214, 0.6)" : "#8a9996";

          const activeStyle = (isTeacher || isParent)
            ? { backgroundColor: "transparent" }
            : {
                backgroundColor: themeColor,
                borderRadius: 9999,
                shadowColor: themeColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 8,
              };

          return (
            <Pressable
              key={index}
              onPress={onPress}
              style={[
                styles.tabItem,
                hasManyTabs && { paddingHorizontal: 4, marginHorizontal: 1 },
                isFocused ? activeStyle : styles.tabItemInactive,
              ]}
            >
              {options.tabBarIcon &&
                options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? activeColor : inactiveColor,
                  size: 20,
                })}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  color: isFocused ? activeColor : inactiveColor,
                  fontSize: hasManyTabs ? 9 : 10,
                  marginTop: 4,
                  fontWeight: isFocused ? "bold" : "600",
                  letterSpacing: hasManyTabs ? 0.1 : 0.5,
                }}
              >
                {label as string}
              </Text>
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 36 : 28,
    left: "2%",
    right: "2%",
    width: "96%",
    height: 74,
    borderRadius: 37,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  fullWidthContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    backgroundColor: "transparent",
  },
  blurContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 0, // safe area bottom on iOS
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  tabItemFocused: {
    backgroundColor: "#46f1c5",
    borderRadius: 9999,
    shadowColor: "#46f1c5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItemInactive: {
    backgroundColor: "transparent",
  },
});
