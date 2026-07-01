import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, MapPin, Zap, ShieldAlert, Award, Coffee, Wifi, LogOut, Check,
  Heart, Calendar, Clock, Car, ChevronRight, CheckCircle2, Star, Navigation 
} from 'lucide-react';

const StationDetailsModal = ({ station, onClose, currentLocation, vehicles, onFavoriteToggled }) => {
  const [favorite, setFavorite] = useState(station.is_favorite);
  const [reviews, setReviews] = useState(station.reviews || []);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [bookingMode, setBookingMode] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking form states
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles?.[0]?.id || '');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [selectedConnector, setSelectedConnector] = useState(station.connector_types.split(',')[0]?.trim() || station.connector_types.split(',')[0] || 'CCS2');

  useEffect(() => {
    setFavorite(station.is_favorite);
    setReviews(station.reviews || []);
    // Reset booking states
    setBookingMode(false);
    setBookingConfirmed(null);
  }, [station]);

  const handleFavoriteToggle = async () => {
    try {
      const response = await api.post(`/stations/${station.id}/favorite/`);
      setFavorite(response.data.is_favorite);
      if (onFavoriteToggled) {
        onFavoriteToggled(station.id, response.data.is_favorite);
      }
    } catch (err) {
      console.error("Error toggling favorite", err);
    }
  };

  const handleNavigate = () => {
    let url = '';
    if (currentLocation) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation[0]},${currentLocation[1]}&destination=${station.latitude},${station.longitude}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;
    }
    window.open(url, '_blank');
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert("Please add/select a vehicle first.");
      return;
    }
    setBookingLoading(true);
    try {
      const response = await api.post('/bookings/', {
        station: station.id,
        vehicle: selectedVehicleId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        connector_type: selectedConnector
      });
      setBookingConfirmed(response.data);
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    try {
      const response = await api.post(`/stations/${station.id}/review/`, {
        rating: newReviewRating,
        comment: newReviewComment
      });
      setReviews(prev => [response.data, ...prev]);
      setNewReviewComment('');
    } catch (err) {
      console.error("Failed to post review", err);
    }
  };

  // Convert comma-separated amenities to icons
  const renderAmenityIcon = (amenity) => {
    const term = amenity.trim().toLowerCase();
    if (term.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (term.includes('coffee') || term.includes('cafe')) return <Coffee className="h-4 w-4" />;
    if (term.includes('restroom')) return <Award className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-soft-lg border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="relative h-48 sm:h-56 bg-slate-100 shrink-0">
          <img 
            src={station.image_url || "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"} 
            alt={station.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          <button 
            onClick={handleFavoriteToggle}
            className={`absolute top-4 left-4 p-2 rounded-xl transition-all ${
              favorite 
                ? 'bg-red-500 text-white shadow-soft' 
                : 'bg-white/20 backdrop-blur-md hover:bg-white/40 text-white'
            }`}
          >
            <Heart className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400 bg-primary-950/50 px-2 py-0.5 rounded">
                  {station.charging_speed >= 50 ? 'DC Fast Charger' : 'AC Standard Charger'}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-1">{station.name}</h3>
              </div>
              <div className="flex items-center space-x-1 bg-yellow-500 text-slate-900 px-2 py-0.5 rounded-lg font-bold text-sm shrink-0">
                <Star className="h-4 w-4 fill-current" />
                <span>{station.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {bookingConfirmed ? (
            /* Booking Confirmed Panel */
            <div className="text-center py-6 space-y-4 max-w-sm mx-auto">
              <div className="bg-primary-50 text-primary-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-xl text-slate-900">Slot Booked!</h4>
                <p className="text-sm text-slate-400">Reservation is active and confirmed.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-soft">
                <div className="space-y-1 text-xs text-slate-500">
                  <p>STATION</p>
                  <p className="font-bold text-sm text-slate-800">{station.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left text-xs">
                  <div>
                    <span className="text-slate-400">DATE</span>
                    <p className="font-bold text-slate-800">{bookingConfirmed.booking_date}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">TIME</span>
                    <p className="font-bold text-slate-800">{bookingConfirmed.booking_time}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">CONNECTOR</span>
                    <p className="font-bold text-slate-800">{bookingConfirmed.connector_type}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">VEHICLE</span>
                    <p className="font-bold text-slate-800">{bookingConfirmed.vehicle_model}</p>
                  </div>
                </div>
                
                {/* Simulated QR Code */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <div className="w-32 h-32 bg-slate-800 flex items-center justify-center text-white text-center rounded-xl p-2 font-bold text-xs tracking-wider">
                    [ QR CODE ]<br/>
                    {bookingConfirmed.qr_code_data}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{bookingConfirmed.qr_code_data}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleNavigate}
                  className="flex-grow py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-bold text-sm transition-all shadow-soft flex items-center justify-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Navigate Now</span>
                </button>
                <button
                  onClick={() => { setBookingConfirmed(null); setBookingMode(false); }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : bookingMode ? (
            /* Booking Form */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-lg text-slate-800">Reserve Charger Slot</h4>
                <button 
                  onClick={() => setBookingMode(false)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Cancel
                </button>
              </div>

              {vehicles?.length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-800 text-sm space-y-2">
                  <p className="font-bold">No Vehicles Registered</p>
                  <p className="text-xs">You must register a vehicle in your profile dashboard before you can reserve a charger slot.</p>
                </div>
              ) : (
                <form onSubmit={handleBookSlot} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Vehicle */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Vehicle</label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                      >
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.name})</option>
                        ))}
                      </select>
                    </div>

                    {/* Connector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Plug Connector</label>
                      <select
                        value={selectedConnector}
                        onChange={(e) => setSelectedConnector(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                      >
                        {station.connector_types.split(',').map((c, i) => {
                          const val = c.trim();
                          return <option key={i} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Time Slot</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="time"
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl font-bold text-sm transition-all shadow-soft flex items-center justify-center space-x-2"
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Reservation'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* General Details Display */
            <>
              {/* Core Information Metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Charging Speed</span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-800 mt-1 block">{station.charging_speed} kW</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pricing</span>
                  <span className="font-extrabold text-sm sm:text-base text-primary-600 mt-1 block">₹{station.price_per_kwh}/kWh</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Operational</span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-800 mt-1 block">24/7 Hours</span>
                </div>
              </div>

              {/* Real-time Charger Occupancy Status */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Real-time Slots Availability</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 flex flex-col items-center">
                    <span className="font-extrabold text-base">{station.available_chargers}</span>
                    <span>Available</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-3 flex flex-col items-center">
                    <span className="font-extrabold text-base">{station.busy_chargers}</span>
                    <span>Busy Charging</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 flex flex-col items-center">
                    <span className="font-extrabold text-base">{station.offline_chargers}</span>
                    <span>Offline</span>
                  </div>
                </div>
              </div>

              {/* Connectors & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Plug Types Supported</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {station.connector_types.split(',').map((c, i) => (
                      <span key={i} className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-bold">
                        ⚡ {c.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-sans">Amenities Onsite</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {station.amenities.split(',').map((amenity, i) => (
                      <span key={i} className="bg-slate-50 border border-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
                        {renderAmenityIcon(amenity)}
                        <span>{amenity.trim()}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-2 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs sm:text-sm">
                <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 block">Address Location</span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">{station.address}</p>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Driver Reviews ({reviews.length})</h4>
                
                {/* Write Review Form */}
                <form onSubmit={handleAddReview} className="flex gap-2">
                  <select 
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="5">5 ⭐</option>
                    <option value="4">4 ⭐</option>
                    <option value="3">3 ⭐</option>
                    <option value="2">2 ⭐</option>
                    <option value="1">1 ⭐</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="flex-grow px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Share your charging experience..."
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors shrink-0"
                  >
                    Submit
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No reviews yet. Be the first to leave one!</p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{rev.username}</span>
                          <span className="text-yellow-500 font-bold">{"⭐".repeat(rev.rating)}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        {!bookingConfirmed && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between space-x-3 shrink-0">
            {bookingMode ? (
              <button
                onClick={() => setBookingMode(false)}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-all"
              >
                Back to details
              </button>
            ) : (
              <>
                <button
                  onClick={() => setBookingMode(true)}
                  className="flex-grow py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-soft flex items-center justify-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Slot</span>
                </button>
                <button
                  onClick={handleNavigate}
                  className="flex-grow py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-bold text-sm transition-all shadow-soft flex items-center justify-center space-x-2"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Navigate</span>
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default StationDetailsModal;
