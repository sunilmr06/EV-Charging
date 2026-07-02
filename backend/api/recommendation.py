import math
import random
from .models import ChargingStation

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points 
    on the Earth in kilometers.
    """
    R = 6371.0 # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def generate_route_stations(current_lat, current_lng, dest_lat, dest_lng):
    """
    Dynamically generates mock charging stations along the highway 
    connecting current location and destination for all-India coverage.
    """
    dist = haversine_distance(current_lat, current_lng, dest_lat, dest_lng)
    if dist < 40:
        return # Within city limits, use existing seeded stations
        
    # Determine step size in km (e.g. every 70km)
    step_size = 70.0
    num_steps = int(dist / step_size)
    if num_steps == 0:
        num_steps = 1
        
    for i in range(1, num_steps + 1):
        fraction = (i * step_size) / dist
        if fraction >= 0.95:
            continue
            
        # Interpolate coordinates
        station_lat = current_lat + fraction * (dest_lat - current_lat)
        station_lng = current_lng + fraction * (dest_lng - current_lng)
        
        # Check if a station already exists within 15 km of this point
        existing = False
        for s in ChargingStation.objects.all():
            if haversine_distance(station_lat, station_lng, s.latitude, s.longitude) < 15.0:
                existing = True
                break
                
        if not existing:
            # Create a new station along the highway
            hwy_names = ["NH44", "NH48", "NH66", "National Expressway", "State Highway"]
            hwy = random.choice(hwy_names)
            station_name = f"Highway EZ Charge - {hwy} Stop #{i}"
            
            ChargingStation.objects.create(
                name=station_name,
                address=f"National Highway Stop, Km {int(i*step_size)} towards Destination",
                latitude=station_lat,
                longitude=station_lng,
                connector_types="CCS2,Type 2,CHAdeMO,5A Socket,Ather Connector,Ola Connector",
                charging_speed=random.choice([50, 60, 120, 150]),
                price_per_kwh=random.choice([16.50, 18.00, 19.50, 21.00]),
                rating=round(random.uniform(4.2, 4.9), 1),
                total_chargers=6,
                available_chargers=random.randint(2, 4),
                busy_chargers=random.randint(1, 2),
                offline_chargers=0,
                is_open=True,
                amenities="Food Court,WiFi,Restrooms,Tea Shop",
                image_url="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            )

def get_smart_recommendation(current_lat, current_lng, dest_lat=None, dest_lng=None, battery_percentage=100, connector_type=None):
    """
    Algorithm to recommend the best charging station based on:
    - Distance from current location
    - Detour distance along route to destination
    - Current battery level (triggers urgency if < 20%)
    - Charger speed and availability
    - Price and user ratings
    """
    # Dynamically generate highway chargers if destination is outside city
    if dest_lat is not None and dest_lng is not None:
        generate_route_stations(current_lat, current_lng, dest_lat, dest_lng)

    stations = ChargingStation.objects.filter(is_open=True)
    
    if not stations.exists():
        return None, "No active charging stations found."
        
    # Filter by connector compatibility if specified
    compatible_stations = []
    if connector_type:
        for station in stations:
            # Check if user's connector is in comma-separated list
            connectors = [c.strip().lower() for c in station.connector_types.split(',')]
            if connector_type.strip().lower() in connectors:
                compatible_stations.append(station)
    else:
        compatible_stations = list(stations)
        
    if not compatible_stations:
        return None, f"No stations support your vehicle's connector type: {connector_type}."
        
    best_station = None
    max_score = -999999
    best_reason = ""
    best_metrics = {}
    
    # Calculate direct distance to destination if available
    direct_dist = 0
    if dest_lat is not None and dest_lng is not None:
        direct_dist = haversine_distance(current_lat, current_lng, dest_lat, dest_lng)
        
    for station in compatible_stations:
        # 1. Distances
        dist_to_station = haversine_distance(current_lat, current_lng, station.latitude, station.longitude)
        
        detour = 0
        dist_station_to_dest = 0
        if dest_lat is not None and dest_lng is not None:
            dist_station_to_dest = haversine_distance(station.latitude, station.longitude, dest_lat, dest_lng)
            # Detour is the extra distance added by stopping at this station
            detour = max(0.0, (dist_to_station + dist_station_to_dest) - direct_dist)
            
        # 2. Score Calculation (starts at 100)
        score = 100.0
        
        # Availability penalty/bonus
        if station.available_chargers > 0:
            score += 35.0
        else:
            # Heavily penalize busy/offline stations
            score -= 80.0
            
        # Charging speed bonus (DC fast chargers get more points)
        # speed (kW) adds to score
        score += float(station.charging_speed) * 0.4
        
        # Rating bonus
        score += station.rating * 12.0
        
        # Price penalty (cheaper is better)
        score -= float(station.price_per_kwh) * 1.5
        
        # Distance constraints based on Battery Percentage
        is_low_battery = battery_percentage < 25
        if is_low_battery:
            # Low battery: distance is critical, ignore detour to avoid running out of charge
            score -= dist_to_station * 18.0
        else:
            # Normal battery: minimize detour and general travel distance
            score -= detour * 12.0
            score -= dist_to_station * 1.5
            
        # Update best recommendation if score is higher
        if score > max_score:
            max_score = score
            best_station = station
            
            # Format custom reason
            speed_type = "Ultra-Fast" if station.charging_speed >= 100 else ("Fast" if station.charging_speed >= 50 else "Standard")
            
            if is_low_battery:
                best_reason = f"Urgent! Recommended because your battery is low ({battery_percentage}%) and this is the closest compatible {speed_type} charger ({dist_to_station:.1f} km away) with active slots."
            elif dest_lat is not None and dest_lng is not None:
                best_reason = f"Recommended because it is a compatible {speed_type} charger ({station.charging_speed:.0f} kW) with {station.available_chargers} open slots, requiring a minimal detour of only {detour:.1f} km along your route."
            else:
                best_reason = f"Recommended because it is the highest-rated compatible {speed_type} charger ({station.charging_speed:.0f} kW) in your immediate vicinity with slots available."
                
            best_metrics = {
                "distance_to_station": dist_to_station,
                "detour_distance": detour,
                "charging_speed": station.charging_speed,
                "price": float(station.price_per_kwh),
                "rating": station.rating,
                "available_chargers": station.available_chargers
            }
            
    return best_station, best_reason, best_metrics
