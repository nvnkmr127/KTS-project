import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bus, MapPin, Phone, User, Clock, Navigation, RefreshCw, Satellite, Map as MapIcon, Gauge, Zap, AlertTriangle } from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { BUS_ROUTES_CONFIG, fetchLiveBusPositions, LiveBusData } from '../../services/millitrack';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAYOIEB9I2lOiJbGM7t723CUtDEjm4-Yj0';

export const AdminBusTrackingScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const defaultNavigation = useNavigation<any>();
  const navigation = propNavigation || defaultNavigation;

  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [livePositions, setLivePositions] = useState<LiveBusData[]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid' | 'satellite'>('roadmap');

  const selectedRouteConfig = BUS_ROUTES_CONFIG.find(r => r.id === selectedRouteId) || BUS_ROUTES_CONFIG[0];
  const liveBusData = livePositions.find(p => p.busNumber === selectedRouteConfig.busNumber);

  const currentLat = liveBusData?.lat ?? selectedRouteConfig.startPos.lat;
  const currentLng = liveBusData?.lng ?? selectedRouteConfig.startPos.lng;
  const currentSpeed = liveBusData?.speed ?? 42;
  const isIgnitionOn = liveBusData?.ignition ?? true;
  const lastSeenText = liveBusData?.address || 'Near School Main Route';

  // Calculate Fleet KPIs
  const activeFleetCount = livePositions.filter(p => p.ignition && !p.error).length || 4;
  const totalFleetCount = BUS_ROUTES_CONFIG.length; // 5
  const avgSpeed = Math.round(
    livePositions.filter(p => p.ignition).reduce((sum, p) => sum + p.speed, 0) /
    Math.max(1, livePositions.filter(p => p.ignition).length)
  ) || 40;

  // Safe BackHandler effect
  useEffect(() => {
    const onBackPress = () => {
      if (navigation?.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

  const loadLiveGps = async () => {
    const data = await fetchLiveBusPositions();
    setLivePositions(data);
  };

  useEffect(() => {
    loadLiveGps();
    const interval = setInterval(loadLiveGps, 15000); // 15s live GPS polling (web parity)
    return () => clearInterval(interval);
  }, []);

  // Pure Google Maps JavaScript SDK HTML Generator (Greedy Touch Control Enabled)
  const generateGoogleMapsHtml = () => {
    const allBusesJson = JSON.stringify(
      BUS_ROUTES_CONFIG.map(cfg => {
        const live = livePositions.find(p => p.busNumber === cfg.busNumber);
        return {
          id: cfg.id,
          busNumber: cfg.busNumber,
          route: cfg.route,
          driver: cfg.driver,
          color: cfg.color,
          lat: live?.lat ?? cfg.startPos.lat,
          lng: live?.lng ?? cfg.startPos.lng,
          speed: live?.speed ?? 40,
          ignition: live?.ignition ?? true,
          stops: cfg.stops
        };
      })
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            * { -webkit-tap-highlight-color: transparent; }
            html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e5e3df; touch-action: manipulation; }
          </style>
          <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly"></script>
          <script>
            function initMap() {
              const allBuses = ${allBusesJson};
              const selectedBus = allBuses.find(b => b.id === ${selectedRouteId}) || allBuses[0];
              const centerPos = { lat: selectedBus.lat, lng: selectedBus.lng };

              // Standard Google Map View with full touch controls
              const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: centerPos,
                mapTypeId: '${mapType}',
                gestureHandling: 'greedy',
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: false,
              });

              // Add KTS School Main Marker
              new google.maps.Marker({
                position: { lat: 17.3198, lng: 78.1511 },
                map: map,
                title: "KTS School Main Campus",
                icon: {
                  url: "https://maps.google.com/mapfiles/kml/shapes/schools.png",
                  scaledSize: new google.maps.Size(38, 38)
                }
              });

              // Add Live Bus Location Markers for all 5 buses (NO CONNECTING LINES)
              allBuses.forEach(b => {
                const marker = new google.maps.Marker({
                  position: { lat: b.lat, lng: b.lng },
                  map: map,
                  title: b.busNumber + " (" + b.speed + " km/h)",
                  animation: b.id === ${selectedRouteId} ? google.maps.Animation.BOUNCE : null,
                  icon: {
                    url: "https://maps.google.com/mapfiles/kml/shapes/bus.png",
                    scaledSize: new google.maps.Size(40, 40)
                  }
                });

                if (b.id === ${selectedRouteId}) {
                  const infoWindow = new google.maps.InfoWindow({
                    content: '<div style="padding:6px; font-weight:bold; color:#1a73e8; font-family:sans-serif">' + b.busNumber + '<br/><span style="color:#3c4043; font-size:12px">Speed: ' + b.speed + ' km/h • Driver: ' + b.driver + '</span></div>'
                  });
                  infoWindow.open(map, marker);
                }
              });
            }
          </script>
        </head>
        <body onload="initMap()">
          <div id="map"></div>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Bus Fleet Tracking Console"
        subtitle="Standard Google Maps Location & Route Monitoring"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <Bus size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Account Renewal Pending / Demo GPS Banner (Web Parity) */}
        <View className="px-5 mb-4">
          <View className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-2xl flex-row items-center">
            <View className="w-8 h-8 rounded-xl bg-amber-500/20 items-center justify-center mr-3">
              <AlertTriangle size={18} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-amber-400 font-extrabold text-xs">Demo Mode • Account Renewal Pending</Text>
              <Text className="text-amber-200/70 text-[10px] mt-0.5">Millitrack GPS account renewal pending. Displaying live simulated bus route movement.</Text>
            </View>
          </View>
        </View>

        {/* Top 3 Derived KPI Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[31%] p-3.5 border-white/10 bg-[#101415]/90 items-center">
            <View className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mb-1.5">
              <Bus size={16} color="#00f1a1" />
            </View>
            <Text className="text-white/50 text-[9px] font-bold uppercase text-center">Active Fleet</Text>
            <Text className="text-[#00f1a1] text-xl font-extrabold mt-0.5">{activeFleetCount} / {totalFleetCount}</Text>
            <Text className="text-white/40 text-[9px] text-center mt-0.5">Buses En Route</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[31%] p-3.5 border-white/10 bg-[#101415]/90 items-center">
            <View className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 items-center justify-center mb-1.5">
              <Gauge size={16} color="#38bdf8" />
            </View>
            <Text className="text-white/50 text-[9px] font-bold uppercase text-center">Avg Speed</Text>
            <Text className="text-sky-400 text-xl font-extrabold mt-0.5">{avgSpeed} km/h</Text>
            <Text className="text-white/40 text-[9px] text-center mt-0.5">Fleet Velocity</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[31%] p-3.5 border-white/10 bg-[#101415]/90 items-center">
            <View className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 items-center justify-center mb-1.5">
              <Zap size={16} color="#f59e0b" />
            </View>
            <Text className="text-white/50 text-[9px] font-bold uppercase text-center">GPS Status</Text>
            <Text className="text-amber-400 text-xl font-extrabold mt-0.5">Demo</Text>
            <Text className="text-white/40 text-[9px] text-center mt-0.5">Simulated</Text>
          </GlassCard>
        </View>

        {/* Route Selector Ribbon */}
        <View className="px-5 mb-4 flex-row justify-between items-center">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Select Transport Route (5 Buses)</Text>
          <Pressable onPress={loadLiveGps} className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-2.5 py-1 rounded-xl flex-row items-center">
            <RefreshCw size={11} color="#00f1a1" style={{ marginRight: 4 }} />
            <Text className="text-[#00f1a1] text-[10px] font-bold">Refresh GPS</Text>
          </Pressable>
        </View>

        <View className="px-5 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {BUS_ROUTES_CONFIG.map(r => {
                const isSel = selectedRouteId === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setSelectedRouteId(r.id)}
                    className={`px-3.5 py-2 rounded-xl border ${isSel ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-[#101415]/90 border-white/10'}`}
                  >
                    <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/80'}`}>
                      {r.busNumber} • {r.route.split('—')[1] || r.route}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Large 440px Standard Google Maps View Card */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-3.5 border-white/10 bg-[#101415]/90 overflow-hidden">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Navigation size={16} color="#00f1a1" style={{ marginRight: 6 }} />
                <Text className="text-white font-extrabold text-sm">{selectedRouteConfig.busNumber} Standard Google Map</Text>
              </View>

              {/* Map View Mode Toggles */}
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl p-0.5" style={{ gap: 4 }}>
                <Pressable
                  onPress={() => setMapType('roadmap')}
                  className={`px-2.5 py-1 rounded-lg flex-row items-center ${mapType === 'roadmap' ? 'bg-[#00f1a1]' : ''}`}
                >
                  <MapIcon size={11} color={mapType === 'roadmap' ? '#101415' : '#00f1a1'} style={{ marginRight: 3 }} />
                  <Text className={`text-[10px] font-bold ${mapType === 'roadmap' ? 'text-[#101415]' : 'text-white/70'}`}>Map</Text>
                </Pressable>

                <Pressable
                  onPress={() => setMapType('hybrid')}
                  className={`px-2.5 py-1 rounded-lg flex-row items-center ${mapType === 'hybrid' ? 'bg-[#00f1a1]' : ''}`}
                >
                  <Satellite size={11} color={mapType === 'hybrid' ? '#101415' : '#00f1a1'} style={{ marginRight: 3 }} />
                  <Text className={`text-[10px] font-bold ${mapType === 'hybrid' ? 'text-[#101415]' : 'text-white/70'}`}>Satellite</Text>
                </Pressable>
              </View>
            </View>

            {/* 440px Height Google Maps Window with Greedy Touch Gestures */}
            <View className="w-full h-[440px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
              <WebView
                originWhitelist={['*']}
                source={{ html: generateGoogleMapsHtml() }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={false}
                scrollEnabled={false}
                overScrollMode="never"
              />
            </View>
          </GlassCard>
        </View>

        {/* Vehicle & Driver Info Card */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Vehicle & Driver Info</Text>

            <View className="flex-row justify-between items-center mb-3 bg-black/40 p-3 rounded-2xl border border-white/5">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mr-3">
                  <User size={18} color="#00f1a1" />
                </View>
                <View>
                  <Text className="text-white font-extrabold text-sm">{selectedRouteConfig.driver}</Text>
                  <Text className="text-white/50 text-[10px]">Driver Contact: {selectedRouteConfig.phone}</Text>
                </View>
              </View>

              <Pressable className="bg-[#00f1a1]/20 border border-[#00f1a1]/40 px-3 py-1.5 rounded-xl flex-row items-center">
                <Phone size={13} color="#00f1a1" style={{ marginRight: 4 }} />
                <Text className="text-[#00f1a1] text-xs font-bold">Call</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-between" style={{ gap: 8 }}>
              <View className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                <Text className="text-white/40 text-[9px] uppercase font-bold">Current Speed</Text>
                <Text className="text-[#00f1a1] font-extrabold text-base mt-0.5">{currentSpeed} km/h</Text>
              </View>

              <View className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                <Text className="text-white/40 text-[9px] uppercase font-bold">Ignition Status</Text>
                <Text className="text-sky-400 font-extrabold text-base mt-0.5">{isIgnitionOn ? 'Engine ON' : 'Engine OFF'}</Text>
              </View>
            </View>

            <View className="mt-3 bg-black/40 p-2.5 rounded-xl border border-white/5 flex-row items-center">
              <MapPin size={14} color="#00f1a1" style={{ marginRight: 6 }} />
              <Text className="text-white/70 text-xs flex-1" numberOfLines={1}>Location: {lastSeenText}</Text>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default AdminBusTrackingScreen;
