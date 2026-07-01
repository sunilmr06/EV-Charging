import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { 
  User, Car, Calendar, Heart, ShieldAlert, Award, Star, 
  Trash2, QrCode, AlertCircle, Loader2, Navigation 
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedBookingQr, setSelectedBookingQr] = useState(null);

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const vRes = await api.get('/vehicles/');
      setVehicles(vRes.data);
      
      const bRes = await api.get('/bookings/');
      setBookings(bRes.data);

      const fRes = await api.get('/favorites/');
      setFavorites(fRes.data);
    } catch (err) {
      console.error("Failed to load profile data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to remove this vehicle profile?")) return;
    try {
      await api.delete(`/vehicles/${id}/`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };

  const handleNavigateStation = (station) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white shadow-soft shrink-0">
            <User className="h-10 w-10" />
          </div>
          <div className="text-center sm:text-left space-y-1.5">
            <span className="text-[10px] text-primary-600 font-extrabold uppercase bg-primary-50 px-2.5 py-1 rounded-full">
              Verified Driver Account
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{user?.username}</h2>
            <p className="text-sm text-slate-400 font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Vehicles Management */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <h3 className="font-extrabold text-lg text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Car className="h-5 w-5 text-primary-500" />
              <span>Registered EV Vehicles</span>
            </h3>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No vehicle profiles added yet.</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">{v.name}</h4>
                      <p className="text-xs text-slate-500">{v.brand} {v.model}</p>
                      <div className="flex space-x-2 text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>🔌 {v.connector_type}</span>
                        <span>&bull;</span>
                        <span>🔋 {v.battery_capacity} kWh</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Bookings and Favorites Tabbed Container */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden flex flex-col min-h-[450px]">
            
            {/* Tabs selector */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`flex-grow sm:flex-initial px-6 py-4 text-sm font-extrabold flex items-center justify-center space-x-2 border-b-2 transition-all ${
                  activeTab === "bookings" 
                    ? 'border-primary-500 text-primary-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Slot Bookings ({bookings.length})</span>
              </button>
              
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-grow sm:flex-initial px-6 py-4 text-sm font-extrabold flex items-center justify-center space-x-2 border-b-2 transition-all ${
                  activeTab === "favorites" 
                    ? 'border-primary-500 text-primary-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>Favorites ({favorites.length})</span>
              </button>
            </div>

            {/* Tab content panel */}
            <div className="p-6 flex-grow">
              {loading ? (
                <div className="flex items-center justify-center h-full py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : activeTab === "bookings" ? (
                /* Bookings History */
                bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm italic">
                    You have no charging slot booking history.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((b) => (
                      <div key={b.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-sm text-slate-800">{b.station_name}</h4>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>{b.status}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{b.station_address}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1 font-semibold">
                            <span>📅 {b.booking_date}</span>
                            <span>⏰ {b.booking_time}</span>
                            <span>🔌 {b.connector_type}</span>
                            <span>🚗 {b.vehicle_model}</span>
                          </div>
                        </div>

                        {/* View QR Code Button */}
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => setSelectedBookingQr(b)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 self-start sm:self-auto"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>Show QR Code</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Favorite Stations list */
                favorites.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm italic">
                    No favorite charging stations saved yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favorites.map((station) => (
                      <div key={station.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-sm text-slate-800 leading-tight truncate">{station.name}</h4>
                            <div className="flex items-center space-x-1 bg-yellow-500 text-slate-900 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{station.rating}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{station.address}</p>
                          
                          <div className="flex items-center justify-between text-xs pt-2">
                            <span className="font-bold text-primary-600">₹{station.price_per_kwh}/kWh</span>
                            <span className="text-slate-500 font-semibold">{station.charging_speed} kW (DC)</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleNavigateStation(station)}
                          className="w-full py-2 bg-secondary-50 hover:bg-secondary-100 text-secondary-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Directions</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>

        </div>

      </div>

      {/* QR CODE DISPLAY MODAL */}
      {selectedBookingQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-soft-lg border border-slate-100 p-6 text-center space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Charging Slot Ticket</h3>
              <p className="text-xs text-slate-400">Scan this code at the station kiosk to start charging.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <div className="w-48 h-48 bg-slate-800 flex items-center justify-center text-white text-center rounded-2xl p-4 font-bold text-sm tracking-wider">
                [ QR CODE ]<br/>
                {selectedBookingQr.qr_code_data}
              </div>
              <span className="font-mono font-bold text-sm text-slate-700 tracking-wider mt-1">{selectedBookingQr.qr_code_data}</span>
            </div>

            <div className="text-xs text-slate-500 text-left space-y-1 border-t border-slate-100 pt-4">
              <p><span className="font-semibold">Station:</span> {selectedBookingQr.station_name}</p>
              <p><span className="font-semibold">Schedule:</span> {selectedBookingQr.booking_date} at {selectedBookingQr.booking_time}</p>
              <p><span className="font-semibold">Connector:</span> {selectedBookingQr.connector_type}</p>
            </div>

            <button
              onClick={() => setSelectedBookingQr(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Close Ticket
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProfilePage;
