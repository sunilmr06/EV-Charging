import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import LeafletMap from '../components/LeafletMap';
import StationDetailsModal from '../components/StationDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, MapPin, Compass, Search, SlidersHorizontal, CheckCircle2,
  Navigation, Calendar, Heart, Plus, Star, Fuel, BatteryCharging,
  Loader2, AlertTriangle, RefreshCw, X
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  // State variables
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [batteryPercentage, setBatteryPercentage] = useState(45);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  
  // Geolocation states
  const [currentLocation, setCurrentLocation] = useState([12.9716, 77.6101]); // MG Road default
  const [locationName, setLocationName] = useState("MG Road, Bengaluru");
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Search and routing states
  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Recommendations and Detail Modals
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [compatibleOnly, setCompatibleOnly] = useState(true);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState("timeline");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [connectorFilter, setConnectorFilter] = useState("All");
  const [speedFilter, setSpeedFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Vehicle creation form state
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState("Car");
  const [newVehicleBrand, setNewVehicleBrand] = useState("Tata");
  const [newVehicleModel, setNewVehicleModel] = useState("Nexon EV");
  const [newVehicleName, setNewVehicleName] = useState("My EV");
  const [newVehicleCapacity, setNewVehicleCapacity] = useState(40.5);
  const [newVehicleConnector, setNewVehicleConnector] = useState("CCS2");
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  // Dynamic autocomplete destination state (fetches all of India via Nominatim API)
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [searchingDestinations, setSearchingDestinations] = useState(false);

  useEffect(() => {
    if (!destinationQuery || destinationQuery.trim().length < 3) {
      setDestinationOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingDestinations(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationQuery)}&countrycodes=in&limit=6`
        );
        const data = await response.json();
        const formatted = data.map((item) => {
          // Shorten long OSM names for display
          const parts = item.display_name.split(',');
          const namePart = parts.slice(0, 3).join(',').trim();
          return {
            name: namePart,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          };
        });
        setDestinationOptions(formatted);
      } catch (err) {
        console.error("Geocoding API failed", err);
      } finally {
        setSearchingDestinations(false);
      }
    }, 400); // 400ms debounce to prevent spamming

    return () => clearTimeout(delayDebounceFn);
  }, [destinationQuery]);

  // 1. Fetch user data (vehicles, bookings, favorites, stations) on mount
  useEffect(() => {
    fetchInitialData();
    detectGPSLocation();
  }, []);

  // 2. Fetch stations when currentLocation changes
  useEffect(() => {
    fetchStations();
  }, [currentLocation]);

  // 3. Trigger smart recommendation whenever inputs change
  useEffect(() => {
    if (currentLocation && activeVehicle) {
      fetchRecommendation();
    } else {
      setAiRecommendation(null);
    }
  }, [currentLocation, selectedDestination, activeVehicle, batteryPercentage]);

  const fetchInitialData = async () => {
    try {
      // Vehicles
      const vehiclesRes = await api.get('/vehicles/');
      setVehicles(vehiclesRes.data);
      if (vehiclesRes.data.length > 0) {
        setActiveVehicle(vehiclesRes.data[0]);
        setBatteryPercentage(vehiclesRes.data[0].current_battery_percentage);
      }
      
      // Bookings
      const bookingsRes = await api.get('/bookings/');
      setBookings(bookingsRes.data.slice(0, 5)); // show top 5

      // Favorites
      const favoritesRes = await api.get('/favorites/');
      setFavorites(favoritesRes.data);
    } catch (err) {
      console.error("Failed to load initial user data", err);
    }
  };

  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const response = await api.get('/stations/');
      setStations(response.data);
    } catch (err) {
      console.error("Failed to fetch stations", err);
    } finally {
      setLoadingStations(false);
    }
  };

  const fetchRecommendation = async () => {
    setLoadingRecommendation(true);
    setRecommendationError(null);
    try {
      let url = `/recommend/?lat=${currentLocation[0]}&lng=${currentLocation[1]}&battery_percentage=${batteryPercentage}&vehicle_id=${activeVehicle.id}`;
      if (selectedDestination) {
        url += `&dest_lat=${selectedDestination.lat}&dest_lng=${selectedDestination.lng}`;
      }
      const response = await api.get(url);
      setAiRecommendation(response.data);
      // Refresh charging stations list in case new highway points were generated dynamically
      fetchStations();
    } catch (err) {
      console.error("Error loading AI recommendation", err);
      setRecommendationError(err.response?.data?.error || "Unable to find compatible recommendation.");
      setAiRecommendation(null);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // GPS sensing
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation([lat, lng]);
        setLocationName(`Detected Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setDetectingLocation(false);
      },
      (error) => {
        console.warn("GPS Access Denied/Failed, falling back to MG Road Bengaluru", error);
        // Default coordinates
        setCurrentLocation([12.9740, 77.6101]);
        setLocationName("MG Road, Bengaluru (GPS Fallback)");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Add Vehicle handler
  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    setSubmittingVehicle(true);
    try {
      const response = await api.post('/vehicles/', {
        name: newVehicleName,
        brand: newVehicleBrand,
        model: newVehicleModel,
        battery_capacity: parseFloat(newVehicleCapacity),
        connector_type: newVehicleConnector,
        current_battery_percentage: 100
      });
      const updatedVehicles = [...vehicles, response.data];
      setVehicles(updatedVehicles);
      setActiveVehicle(response.data);
      setBatteryPercentage(100);
      setShowAddVehicleModal(false);
      
      // Reset form
      setNewVehicleName("My EV");
      setNewVehicleType("Car");
      setNewVehicleBrand("Tata");
      setNewVehicleModel("Nexon EV");
      setNewVehicleCapacity(40.5);
      setNewVehicleConnector("CCS2");
    } catch (err) {
      console.error("Failed to add vehicle", err);
      alert("Failed to add vehicle. Please try again.");
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleVehicleChange = (vehicleId) => {
    const v = vehicles.find(item => item.id === parseInt(vehicleId));
    if (v) {
      setActiveVehicle(v);
      setBatteryPercentage(v.current_battery_percentage);
    }
  };

  const handleDestinationSelect = (dest) => {
    setSelectedDestination(dest);
    setDestinationQuery(dest.name);
    setShowDestSuggestions(false);
  };

  const clearDestination = () => {
    setSelectedDestination(null);
    setDestinationQuery("");
  };

  const handleFavoriteToggled = (stationId, isFavorite) => {
    // Refresh favorites list
    api.get('/favorites/').then(res => setFavorites(res.data));
  };

  // Haversine distance calculator for sorting stations in UI list
  const getDistanceTo = (lat, lng) => {
    const lat1 = currentLocation[0];
    const lon1 = currentLocation[1];
    const R = 6371.0;
    
    const dlat = (lat - lat1) * (Math.PI / 180);
    const dlon = (lng - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dlat / 2)**2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dlon / 2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  };

  // Distance calculator between two custom points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371.0;
    const dlat = (lat2 - lat1) * (Math.PI / 180);
    const dlon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dlat / 2)**2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dlon / 2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filters application
  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          station.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesConnector = connectorFilter === "All" || 
                              station.connector_types.toLowerCase().includes(connectorFilter.toLowerCase());
    
    const matchesSpeed = speedFilter === "All" || 
                         (speedFilter === "Fast" && station.charging_speed >= 50) || 
                         (speedFilter === "Standard" && station.charging_speed < 50);

    const matchesStatus = statusFilter === "All" || 
                          (statusFilter === "Available" && station.available_chargers > 0);

    const matchesCompatibility = !compatibleOnly || !activeVehicle || 
                                 station.connector_types.toLowerCase().includes(activeVehicle.connector_type.toLowerCase());

    return matchesSearch && matchesConnector && matchesSpeed && matchesStatus && matchesCompatibility;
  }).sort((a, b) => getDistanceTo(a.latitude, a.longitude) - getDistanceTo(b.latitude, b.longitude));

  const handleNavigateStation = (station) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation[0]},${currentLocation[1]}&destination=${station.latitude},${station.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Controls, Recommendation, Nearby stations */}
        <div className="w-full lg:w-7/12 flex flex-col space-y-6">
          
          {/* Welcome User & Current Location Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">EV Dashboard</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">Hello, {user?.username || 'Driver'}</h2>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                <span className="font-semibold text-slate-700">{locationName}</span>
              </div>
            </div>
            <button
              onClick={detectGPSLocation}
              disabled={detectingLocation}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 self-stretch sm:self-auto justify-center"
            >
              {detectingLocation ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Compass className="h-3.5 w-3.5 text-primary-500" />
                  <span>Update GPS</span>
                </>
              )}
            </button>
          </div>

          {/* Vehicle Config & Battery Slider */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
                <Fuel className="h-5 w-5 text-primary-500" />
                <span>Active Vehicle Profile</span>
              </h3>
              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Vehicle</span>
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="bg-primary-50/50 border border-dashed border-primary-200 rounded-2xl p-6 text-center space-y-3">
                <Fuel className="h-8 w-8 text-primary-500 mx-auto" />
                <h4 className="font-bold text-slate-800">No Vehicle Connected</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your Electric Vehicle details to filter matching plugs and let AI calculate charging detours.
                </p>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-soft transition-all"
                >
                  Register EV Car
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Vehicle Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select EV Profile</label>
                    <select
                      value={activeVehicle?.id || ''}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary-500"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.name})</option>
                      ))}
                    </select>
                  </div>

                  {/* EV specs view */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Plug Socket</span>
                      <span className="font-extrabold text-sm text-slate-700 mt-0.5 block">{activeVehicle?.connector_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Battery Size</span>
                      <span className="font-extrabold text-sm text-slate-700 mt-0.5 block">{activeVehicle?.battery_capacity} kWh</span>
                    </div>
                  </div>
                </div>

                {/* Battery Slider Simulator */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">SIMULATED BATTERY STATE</span>
                    <span className={`px-2 py-0.5 rounded-full font-extrabold ${
                      batteryPercentage < 25 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {batteryPercentage}% Charged
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={batteryPercentage}
                      onChange={(e) => setBatteryPercentage(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Drag to test how AI triggers different recommendations at lower battery levels.</p>
                </div>
              </div>
            )}
          </div>

          {/* Destination Search */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 relative z-20">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
              <Search className="h-5 w-5 text-secondary-500" />
              <span>Search Destination Stop</span>
            </h3>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={destinationQuery}
                onChange={(e) => {
                  setDestinationQuery(e.target.value);
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                placeholder="Search any city or place in India... (e.g. Goa, Delhi, Mysuru)"
              />
              {selectedDestination && (
                <button
                  onClick={clearDestination}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                >
                  Clear
                </button>
              )}

              {/* Suggestions Autocomplete */}
              {showDestSuggestions && destinationQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-soft-lg z-30 max-h-60 overflow-y-auto">
                  {searchingDestinations ? (
                    <div className="p-4 text-xs text-slate-400 text-center flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                      <span>Searching locations in India...</span>
                    </div>
                  ) : destinationOptions.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center italic">
                      No matching places found. Type at least 3 letters.
                    </div>
                  ) : (
                    destinationOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleDestinationSelect(opt)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 border-b border-slate-100 last:border-0 flex items-center space-x-2 cursor-pointer"
                      >
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{opt.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendation Card */}
          <AnimatePresence mode="wait">
            {loadingRecommendation ? (
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-3xl p-6 shadow-soft flex items-center justify-center space-x-2 min-h-36">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-extrabold text-sm tracking-wider">AI RECOMMENDATION SYSTEM BOOTING...</span>
              </div>
            ) : aiRecommendation ? (() => {
              const distStationToDest = selectedDestination
                ? calculateDistance(
                    aiRecommendation.station.latitude,
                    aiRecommendation.station.longitude,
                    selectedDestination.lat,
                    selectedDestination.lng
                  )
                : 0;

              const batteryConsumedPostCharge = activeVehicle
                ? ((distStationToDest / 5.0) / activeVehicle.battery_capacity) * 100
                : 0;

              const finalBattery = Math.max(0, Math.round(90 - batteryConsumedPostCharge));

              const maxRange = activeVehicle ? activeVehicle.battery_capacity * 5.0 : 200;
              const currentRange = maxRange * (batteryPercentage / 100.0);
              
              const isLeg1Possible = parseFloat(aiRecommendation.metrics.distance_to_station_km) <= currentRange;
              const isLeg2Possible = distStationToDest <= maxRange * 0.9;
              const isTripPossible = isLeg1Possible && isLeg2Possible;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-3xl p-6 border-2 border-primary-500 shadow-soft-lg space-y-4 relative overflow-hidden"
                >
                  {/* Decorative header gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 to-secondary-500" />
                  
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <Zap className="h-5 w-5 fill-current text-primary-500" />
                      <span className="font-extrabold text-slate-900 text-sm tracking-wider">AI TRIP PLANNER</span>
                    </div>
                    <div className="flex space-x-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveRecommendationTab("timeline")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          activeRecommendationTab === "timeline" 
                            ? 'bg-primary-600 text-white shadow-soft font-extrabold' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        Route Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRecommendationTab("summary")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          activeRecommendationTab === "summary" 
                            ? 'bg-primary-600 text-white shadow-soft font-extrabold' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        AI Summary
                      </button>
                    </div>
                  </div>

                  {activeRecommendationTab === "summary" ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-800">{aiRecommendation.station.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{aiRecommendation.station.address}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-yellow-500 text-slate-900 px-2 py-0.5 rounded-lg font-bold text-xs shrink-0">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{aiRecommendation.station.rating}</span>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                        "{aiRecommendation.reason}"
                      </div>

                      {/* Recommended station metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Speed</span>
                          <span className="font-extrabold text-slate-700 block mt-0.5">{aiRecommendation.station.charging_speed} kW</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Arrival Battery</span>
                          <span className={`font-extrabold block mt-0.5 ${
                            aiRecommendation.metrics.battery_on_arrival_pct < 15 ? 'text-red-600' : 'text-emerald-600'
                          }`}>{aiRecommendation.metrics.battery_on_arrival_pct}%</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Time to 90%</span>
                          <span className="font-extrabold text-slate-700 block mt-0.5">{aiRecommendation.metrics.estimated_charging_time_mins} mins</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Price/kWh</span>
                          <span className="font-extrabold text-primary-600 block mt-0.5">₹{aiRecommendation.station.price_per_kwh}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Step-by-Step Route Plan Timeline */
                    <div className="space-y-4 pt-1 animate-fade-in">
                      
                      {/* Warning Banner if Trip is not possible */}
                      {!isTripPossible && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-4 space-y-1.5 shadow-sm">
                          <div className="flex items-center space-x-1.5 font-extrabold">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 animate-bounce" />
                            <span>⚠️ RANGE INSUFFICIENT FOR TRIP</span>
                          </div>
                          <p className="leading-relaxed font-semibold text-slate-700">
                            {!isLeg1Possible 
                              ? `Insufficient initial charge! Your current range (${currentRange.toFixed(0)} km at ${batteryPercentage}%) is less than the distance to the recommended charger (${aiRecommendation.metrics.distance_to_station_km} km).`
                              : `Destination out of range! Even after charging to 90% at this station, your maximum range is ${Math.round(maxRange * 0.9)} km, but the remaining distance to destination is ${distStationToDest.toFixed(0)} km.`
                            }
                          </p>
                          <p className="text-[10px] text-rose-600/80 font-bold">Suggestions: Add intermediate charging stops, drive a vehicle with a larger battery capacity, or start with a higher battery percentage.</p>
                        </div>
                      )}

                      {/* Step 1: Start */}
                      <div className={`flex items-start space-x-3 relative ${!isLeg1Possible ? 'border-l-2 border-dashed border-rose-300 pl-2' : ''}`}>
                        <div className="absolute top-6 bottom-0 left-3 w-0.5 bg-slate-200" />
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                          !isLeg1Possible ? 'bg-rose-100 text-rose-600 border border-rose-300' : 'bg-blue-100 text-blue-600'
                        }`}>
                          1
                        </div>
                        <div className="space-y-0.5 flex-grow">
                          <div className="flex justify-between text-xs">
                            <span className="font-extrabold text-slate-800">Start Journey</span>
                            <span className={`font-bold ${!isLeg1Possible ? 'text-rose-600' : 'text-blue-600'}`}>🔋 {batteryPercentage}%</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{locationName}</p>
                          <p className="text-[9px] text-slate-400">Available starting range: {currentRange.toFixed(0)} km</p>
                        </div>
                      </div>

                      {/* Step 2: Charging Stop */}
                      <div className={`flex items-start space-x-3 relative ${!isLeg1Possible ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="absolute top-6 bottom-0 left-3 w-0.5 bg-slate-200" />
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                          isLeg1Possible ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-400'
                        }`}>
                          2
                        </div>
                        <div className="space-y-2 flex-grow bg-slate-50 border border-slate-100 rounded-2xl p-3 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs">
                            <div>
                              <span className="font-extrabold text-slate-800">Stop & Charge</span>
                              <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                                {aiRecommendation.metrics.distance_to_station_km} km from start &bull; {aiRecommendation.metrics.detour_distance_km} km detour
                              </span>
                            </div>
                            <span className={`font-bold text-xs self-start sm:self-auto ${
                              aiRecommendation.metrics.battery_on_arrival_pct < 25 ? 'text-red-500' : 'text-emerald-600'
                            }`}>
                              🔌 Arrive at {aiRecommendation.metrics.battery_on_arrival_pct}%
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">{aiRecommendation.station.name}</p>
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-1 border-t border-slate-100/50 mt-1">
                            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                              ⚡ Charge to 90% (adds ~{aiRecommendation.metrics.estimated_charging_time_mins} mins) &bull; ₹{aiRecommendation.station.price_per_kwh}/kWh
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedStation(aiRecommendation.station)}
                              className="px-3.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-[10px] shadow-soft transition-all self-start sm:self-auto cursor-pointer"
                            >
                              Reserve Slot
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Finish */}
                      <div className={`flex items-start space-x-3 ${!isTripPossible ? 'opacity-40' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                          isTripPossible ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          3
                        </div>
                        <div className="space-y-0.5 flex-grow">
                          <div className="flex justify-between text-xs">
                            <span className="font-extrabold text-slate-800">Reach Destination</span>
                            <span className={`font-bold ${!isTripPossible ? 'text-rose-600' : 'text-purple-600'}`}>
                              🏁 {!isTripPossible ? 'Run out of charge' : `${finalBattery}% battery`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{selectedDestination ? selectedDestination.name : "Destination"}</p>
                          {selectedDestination && (
                            <p className="text-[9px] text-slate-400 font-semibold">
                              Remaining leg: {distStationToDest.toFixed(1)} km &bull; Total journey: {(parseFloat(aiRecommendation.metrics.distance_to_station_km) + distStationToDest).toFixed(1)} km
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendation actions */}
                  <div className="flex space-x-2 pt-1 shrink-0">
                    <button
                      onClick={() => handleNavigateStation(aiRecommendation.station)}
                      className="flex-grow py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-soft flex items-center justify-center space-x-1.5"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Navigate (Google Maps)</span>
                    </button>
                    <button
                      onClick={() => setSelectedStation(aiRecommendation.station)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-all"
                    >
                      Details & Book
                    </button>
                  </div>
                </motion.div>
              );
            })() : recommendationError && activeVehicle ? (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-red-800 text-sm flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Recommendation Error</p>
                  <p className="text-xs text-red-600 mt-1">{recommendationError}</p>
                </div>
              </div>
            ) : null}
          </AnimatePresence>

          {/* Near Stations Search & List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-900">Nearby Charging Stations</h3>
              
              {/* Quick Text Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none w-full sm:w-44"
                  placeholder="Filter name..."
                />
              </div>
            </div>

            {/* Filter Pill Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              
              {/* Connector filter */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <span className="text-slate-400 font-semibold uppercase text-[9px]">Plug:</span>
                <select
                  value={connectorFilter}
                  onChange={(e) => setConnectorFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-600 focus:outline-none"
                >
                  <option value="All">All Plugs</option>
                  <option value="CCS2">CCS2</option>
                  <option value="Type 2">Type 2</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="5A Socket">5A Socket</option>
                  <option value="Ather Connector">Ather Grid</option>
                </select>
              </div>

              {/* Speed filter */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <span className="text-slate-400 font-semibold uppercase text-[9px]">Speed:</span>
                <select
                  value={speedFilter}
                  onChange={(e) => setSpeedFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-600 focus:outline-none"
                >
                  <option value="All">All Speeds</option>
                  <option value="Fast">Fast (&ge;50kW)</option>
                  <option value="Standard">AC (&lt;50kW)</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <span className="text-slate-400 font-semibold uppercase text-[9px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-600 focus:outline-none"
                >
                  <option value="All">All Stations</option>
                  <option value="Available">Slots Available</option>
                </select>
              </div>

              {/* Active Vehicle Compatibility toggle */}
              {activeVehicle && (
                <button
                  type="button"
                  onClick={() => setCompatibleOnly(!compatibleOnly)}
                  className={`px-3 py-1 rounded-xl border transition-all font-bold flex items-center space-x-1 cursor-pointer ${
                    compatibleOnly 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className={`h-3.5 w-3.5 ${compatibleOnly ? 'text-primary-500' : 'text-slate-300'}`} />
                  <span>Compatible with {activeVehicle.brand} ({activeVehicle.connector_type})</span>
                </button>
              )}

            </div>

            {/* Stations list */}
            {loadingStations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                No charging stations found matching the select filters.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredStations.map((station) => {
                  const dist = getDistanceTo(station.latitude, station.longitude);
                  return (
                    <div 
                      key={station.id}
                      className="bg-white hover:bg-slate-50/50 border border-slate-100 rounded-2xl p-4 shadow-soft hover:shadow-soft-lg transition-all flex flex-col sm:flex-row gap-4"
                    >
                      {/* Thumbnail image */}
                      <div className="w-full sm:w-28 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        <img 
                          src={station.image_url || "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80"}
                          alt={station.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content details */}
                      <div className="flex-grow space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{station.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{station.address}</p>
                          </div>
                          <span className="text-xs font-bold text-primary-600 shrink-0">
                            {dist.toFixed(1)} km
                          </span>
                        </div>

                        {/* Availability and power speed info */}
                        <div className="flex items-center space-x-3 text-xs">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold ${
                            station.available_chargers > 0 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            <span>{station.available_chargers}/{station.total_chargers} Free</span>
                          </span>
                          <span className="text-slate-400 font-semibold">|</span>
                          <span className="text-slate-600 font-bold">{station.charging_speed} kW (DC)</span>
                          <span className="text-slate-400 font-semibold">|</span>
                          <span className="text-primary-600 font-bold">₹{station.price_per_kwh}/kWh</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-2 pt-1 shrink-0">
                          <button
                            onClick={() => setSelectedStation(station)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                          >
                            Details & Book
                          </button>
                          <button
                            onClick={() => handleNavigateStation(station)}
                            className="px-3.5 py-1.5 bg-secondary-50 hover:bg-secondary-100 text-secondary-600 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1"
                          >
                            <Navigation className="h-3 w-3" />
                            <span>Navigate</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Map container (Sticky on desktop) */}
        <div className="w-full lg:w-5/12 h-[350px] lg:h-[calc(100vh-120px)] lg:sticky lg:top-20 z-10">
          <div className="w-full h-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-soft-lg flex flex-col">
            
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-1.5">
                <Compass className="h-4 w-4 text-primary-500" />
                <span>Interactive Charging Map</span>
              </h3>
              {selectedDestination && (
                <div className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Route Plotted
                </div>
              )}
            </div>

            <div className="flex-grow relative">
              <LeafletMap
                currentLocation={currentLocation}
                destination={selectedDestination ? [selectedDestination.lat, selectedDestination.lng] : null}
                stations={filteredStations}
                onSelectStation={setSelectedStation}
              />
            </div>

            {/* Map Legends */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-around text-[10px] font-bold text-slate-500 shrink-0">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                <span>Busy</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>Offline</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span>You</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* DETAIL MODAL PANEL */}
      {selectedStation && (
        <StationDetailsModal
          station={selectedStation}
          currentLocation={currentLocation}
          vehicles={vehicles}
          onClose={() => setSelectedStation(null)}
          onFavoriteToggled={handleFavoriteToggled}
        />
      )}

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-soft-lg border border-slate-100 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-900">Add EV Vehicle</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vehicle Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleType"
                      value="Car"
                      checked={newVehicleType === "Car"}
                      onChange={() => {
                        setNewVehicleType("Car");
                        setNewVehicleBrand("Tata");
                        setNewVehicleModel("Nexon EV");
                        setNewVehicleCapacity(40.5);
                        setNewVehicleConnector("CCS2");
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>🚗 EV Car</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleType"
                      value="Scooter"
                      checked={newVehicleType === "Scooter"}
                      onChange={() => {
                        setNewVehicleType("Scooter");
                        setNewVehicleBrand("Ather");
                        setNewVehicleModel("450X");
                        setNewVehicleCapacity(3.7);
                        setNewVehicleConnector("Ather Connector");
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>🛵 EV Scooter (Scooty)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Brand Name</label>
                <select
                  value={newVehicleBrand}
                  onChange={(e) => {
                    const brand = e.target.value;
                    setNewVehicleBrand(brand);
                    if (newVehicleType === "Car") {
                      if (brand === "Tata") {
                        setNewVehicleModel("Nexon EV");
                        setNewVehicleCapacity(40.5);
                        setNewVehicleConnector("CCS2");
                      } else if (brand === "MG") {
                        setNewVehicleModel("ZS EV");
                        setNewVehicleCapacity(50.3);
                        setNewVehicleConnector("CCS2");
                      } else if (brand === "BYD") {
                        setNewVehicleModel("Atto 3");
                        setNewVehicleCapacity(60.48);
                        setNewVehicleConnector("CCS2");
                      } else if (brand === "Hyundai") {
                        setNewVehicleModel("Kona Electric");
                        setNewVehicleCapacity(39.2);
                        setNewVehicleConnector("CCS2");
                      } else if (brand === "Mahindra") {
                        setNewVehicleModel("XUV400");
                        setNewVehicleCapacity(39.4);
                        setNewVehicleConnector("CCS2");
                      } else if (brand === "Kia") {
                        setNewVehicleModel("EV6");
                        setNewVehicleCapacity(77.4);
                        setNewVehicleConnector("CCS2");
                      } else if (brand === "BMW") {
                        setNewVehicleModel("i4");
                        setNewVehicleCapacity(83.9);
                        setNewVehicleConnector("CCS2");
                      }
                    } else {
                      if (brand === "Ather") {
                        setNewVehicleModel("450X");
                        setNewVehicleCapacity(3.7);
                        setNewVehicleConnector("Ather Connector");
                      } else if (brand === "Ola Electric") {
                        setNewVehicleModel("S1 Pro");
                        setNewVehicleCapacity(4.0);
                        setNewVehicleConnector("5A Socket");
                      } else if (brand === "TVS") {
                        setNewVehicleModel("iQube");
                        setNewVehicleCapacity(3.4);
                        setNewVehicleConnector("5A Socket");
                      } else if (brand === "Bajaj") {
                        setNewVehicleModel("Chetak");
                        setNewVehicleCapacity(2.9);
                        setNewVehicleConnector("5A Socket");
                      } else if (brand === "Hero Vida") {
                        setNewVehicleModel("V1");
                        setNewVehicleCapacity(3.94);
                        setNewVehicleConnector("5A Socket");
                      }
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                >
                  {newVehicleType === "Car" ? (
                    <>
                      <option value="Tata">Tata</option>
                      <option value="MG">MG</option>
                      <option value="BYD">BYD</option>
                      <option value="Hyundai">Hyundai</option>
                      <option value="Mahindra">Mahindra</option>
                      <option value="Kia">Kia</option>
                      <option value="BMW">BMW</option>
                    </>
                  ) : (
                    <>
                      <option value="Ather">Ather</option>
                      <option value="Ola Electric">Ola Electric</option>
                      <option value="TVS">TVS</option>
                      <option value="Bajaj">Bajaj</option>
                      <option value="Hero Vida">Hero Vida</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Nexon EV, ZS EV"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nickname (Identifier)</label>
                <input
                  type="text"
                  required
                  value={newVehicleName}
                  onChange={(e) => setNewVehicleName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                  placeholder="e.g. My Nexon EV, Primary Scooter"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newVehicleCapacity}
                    onChange={(e) => setNewVehicleCapacity(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Plug Socket</label>
                  <select
                    value={newVehicleConnector}
                    onChange={(e) => setNewVehicleConnector(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                  >
                    {newVehicleType === "Car" ? (
                      <>
                        <option value="CCS2">CCS2 (Standard DC)</option>
                        <option value="Type 2">Type 2 (Standard AC)</option>
                        <option value="CHAdeMO">CHAdeMO (Old standard)</option>
                      </>
                    ) : (
                      <>
                        <option value="5A Socket">5A/15A Socket (Standard Home Plug)</option>
                        <option value="Ather Connector">Ather Grid Plug</option>
                        <option value="Ola Connector">Ola Grid Plug</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingVehicle}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-soft flex items-center justify-center space-x-1.5"
              >
                {submittingVehicle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Adding Vehicle...</span>
                  </>
                ) : (
                  <span>Register Vehicle</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
