import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Zap, MapPin, Compass, Shield, Award, Users, CreditCard, 
  ChevronDown, Send, CheckCircle2, ChevronRight, Navigation 
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const [faqOpen, setFaqOpen] = useState({});
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const faqs = [
    {
      q: "How does the AI smart recommendation work?",
      a: "Our engine filters chargers based on your vehicle's connector type, checks real-time availability, and evaluates the charging speed. If you enter a destination, it selects the charger that minimizes your route detour and calculates your battery on arrival."
    },
    {
      q: "Do I need a subscription to use ChargeMate AI?",
      a: "No! Accessing location detection, finding nearby charging stations, using our smart route recommendations, and navigating via Google Maps are completely free for all users."
    },
    {
      q: "Can I book a charging slot in advance?",
      a: "Yes. Through our booking slot MVP features, you can pick a specific date, time, and connector at supported stations to reserve a slot before arriving."
    },
    {
      q: "Which EV cars are compatible with the app?",
      a: "All major passenger EVs in India (Tata Nexon/Tigor/Punch EV, MG ZS/Windsor EV, Hyundai Kona, BYD Atto/Seal, Mahindra XUV400, Kia EV6, BMW i4, etc.) are compatible. You just select your model when registering your vehicle."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pb-28">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-primary-200/30 to-secondary-200/30 blur-3xl rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div 
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 text-sm font-semibold text-primary-700">
                <Zap className="h-4 w-4 fill-current text-primary-500" />
                <span>AI-Powered EV Charging Helper</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Smart EV Charging, <br />
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Re-Imagined by AI
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
                Zero range anxiety. Enter your destination, and let ChargeMate AI scan nearby compatible chargers, verify active slots, and plot the perfect charging stop along your route.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg transition-all shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 text-center flex items-center justify-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-bold text-lg transition-all text-center flex items-center justify-center space-x-2"
                >
                  <Navigation className="h-5 w-5 text-secondary-500" />
                  <span>Find Charging Station</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Graphic Mockup */}
            <motion.div 
              className="lg:col-span-5 relative flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-soft-lg border border-slate-100">
                {/* Floating glassmorphic card */}
                <div className="absolute -top-4 -left-4 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-soft border border-slate-100/50 flex items-center space-x-3">
                  <div className="bg-primary-500 text-white p-2 rounded-xl">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Tata Nexon EV</h4>
                    <p className="text-xs text-primary-600 font-semibold">Active Profile &bull; 45%</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-soft border border-slate-100/50 flex items-center space-x-3">
                  <div className="bg-secondary-500 text-white p-2 rounded-xl">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Electronic City</h4>
                    <p className="text-xs text-slate-500">Fastest Route Plotted</p>
                  </div>
                </div>

                {/* Simulated UI */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-800">AI Recommendation</span>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">Best Match</span>
                  </div>
                  <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-extrabold text-slate-800">Zeon Charger - Domlur</h4>
                      <span className="text-xs font-bold text-slate-500">4.5 km away</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "Recommended because it is a compatible DC fast charger (120 kW) on your route with 4 slots open and minimal detour (0.2 km)."
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-slate-400">Charge Speed</p>
                        <p className="font-bold text-slate-700">120 kW (DC)</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-slate-400">Price/kWh</p>
                        <p className="font-bold text-primary-600">₹20.50</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="text-red-500 h-4 w-4" />
                      <span className="text-xs font-medium text-slate-700">Bengaluru KIAL Airport</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Destination</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-y border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">20+</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Verified Chargers</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-secondary-600">50+</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Active EV Drivers</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">150 kW</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Max Charge Speed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-secondary-600">100%</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">GPS Navigation Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Practical Features for Real Drivers
            </h2>
            <p className="text-slate-600">
              No clutter. We designed ChargeMate AI to solve range anxiety in under 1 minute with the fewest clicks.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft space-y-4">
              <div className="bg-primary-50 p-4 rounded-2xl w-14 h-14 flex items-center justify-center text-primary-600">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Current Location Sensing</h3>
              <p className="text-slate-600 leading-relaxed">
                Detects your coordinates automatically. Instantly shows you verified nearby EV chargers, their current operational status, and real-time prices.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft space-y-4">
              <div className="bg-secondary-50 p-4 rounded-2xl w-14 h-14 flex items-center justify-center text-secondary-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Route Recommendations</h3>
              <p className="text-slate-600 leading-relaxed">
                Plots the best charger along your route, factoring in your active vehicle type, battery capacity, current level, and charger availability.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft space-y-4">
              <div className="bg-primary-50 p-4 rounded-2xl w-14 h-14 flex items-center justify-center text-primary-600">
                <Navigation className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">One-Click Google Maps</h3>
              <p className="text-slate-600 leading-relaxed">
                Click navigate and launch Google Maps direction immediately with turn-by-turn routing from your coordinates to the charging station.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="text-slate-600">
              Four simple steps from login to charging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-slate-100 -translate-y-12 -z-10" />

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-soft">
                1
              </div>
              <h4 className="font-bold text-lg text-slate-800">Add Vehicle</h4>
              <p className="text-sm text-slate-500 px-4">Register your EV brand, model, and active battery capacity in seconds.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-soft">
                2
              </div>
              <h4 className="font-bold text-lg text-slate-800">Search Destination</h4>
              <p className="text-sm text-slate-500 px-4">Allow GPS access and enter where you are heading.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-soft">
                3
              </div>
              <h4 className="font-bold text-lg text-slate-800">Get Recommendation</h4>
              <p className="text-sm text-slate-500 px-4">AI finds the best compatible fast charger on the way and estimates battery on arrival.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-soft">
                4
              </div>
              <h4 className="font-bold text-lg text-slate-800">Launch Navigation</h4>
              <p className="text-sm text-slate-500 px-4">Click navigate and drive with standard turn-by-turn Google Maps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Why Drivers Choose ChargeMate AI
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Existing mapping solutions don't understand your car. They show you offline or incompatible slow chargers. ChargeMate AI fixes that with custom filters and instant recommendation rationales.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  "Compatibility matching by vehicle plug type",
                  "Estimates battery depletion on arrival",
                  "Displays chargers color-coded by occupancy status",
                  "Saves your favorite charging points",
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-500 shrink-0" />
                    <span className="font-medium text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-100 shadow-soft">
              <div className="space-y-6">
                <div className="border-l-4 border-primary-500 pl-4 space-y-2">
                  <p className="font-bold text-slate-800">"Awesome Bengaluru EV companion!"</p>
                  <p className="text-sm text-slate-600 italic">
                    "I took my BYD Atto 3 from Indiranagar to KIAL Airport. My battery was at 30% and I was nervous. The app immediately suggested a 150kW charger at Airport Parking with 8 slots open. The Google Maps routing got me there seamlessly!"
                  </p>
                  <p className="text-xs font-bold text-primary-600">— Rajesh K., Bangalore</p>
                </div>
                <div className="border-l-4 border-secondary-500 pl-4 space-y-2">
                  <p className="font-bold text-slate-800">"No more range anxiety"</p>
                  <p className="text-sm text-slate-600 italic">
                    "Being able to see if a charger is busy or offline before driving there is a game-changer. Saves me so much time and avoids unnecessary queuing."
                  </p>
                  <p className="text-xs font-bold text-secondary-600">— Ananya M., HSR Layout</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-500 mt-2">Answers to common queries about ChargeMate AI</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${faqOpen[index] ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen[index] && (
                  <div className="p-5 pt-0 text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft text-center space-y-6">
            <div className="bg-primary-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-primary-600">
              <Send className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Need Help or Partnerships?</h2>
            <p className="text-slate-500 text-sm">
              Are you a charge point operator? Integrate your APIs with ChargeMate AI to increase your slot bookings.
            </p>

            {contactSubmitted ? (
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-primary-600 mx-auto" />
                <h4 className="font-bold text-slate-800">Message Received!</h4>
                <p className="text-xs text-slate-500">We will respond to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-sm transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Message</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-sm transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-soft flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Submit Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
