import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Vehicle, ChargingStation, Favorite, Booking, Review
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds the database with users, vehicles, charging stations, reviews, favorites, and bookings'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")
        
        # Clear existing data
        Review.objects.all().delete()
        Booking.objects.all().delete()
        Favorite.objects.all().delete()
        Vehicle.objects.all().delete()
        ChargingStation.objects.all().delete()
        User.objects.all().delete()
        
        # 1. Create Users
        users = []
        # Create a default admin/user for demonstration
        demo_user = User.objects.create_user(
            username="demouser",
            email="demo@chargemate.ai",
            password="password123"
        )
        users.append(demo_user)
        
        for i in range(1, 50):
            username = f"ev_driver_{i}"
            email = f"driver{i}@gmail.com"
            u = User.objects.create_user(
                username=username,
                email=email,
                password="password123"
            )
            users.append(u)
            
        self.stdout.write(f"Created {len(users)} users.")

        # 2. Create Vehicles for users (including scooters/scooties)
        brands = [
            ("Tata", "Nexon EV", 40.5, "CCS2"),
            ("Tata", "Punch EV", 35.0, "CCS2"),
            ("MG", "ZS EV", 50.3, "CCS2"),
            ("MG", "Windsor EV", 38.0, "CCS2"),
            ("Hyundai", "Kona Electric", 39.2, "CCS2"),
            ("BYD", "Atto 3", 60.48, "CCS2"),
            ("BYD", "Seal", 82.5, "CCS2"),
            ("Mahindra", "XUV400", 39.4, "CCS2"),
            ("Kia", "EV6", 77.4, "CCS2"),
            ("BMW", "i4", 83.9, "CCS2"),
            ("Mahindra", "eVerito", 21.2, "CHAdeMO"),
            # Scooter / Scooties
            ("Ather", "450X", 3.7, "Ather Connector"),
            ("Ola Electric", "S1 Pro", 4.0, "5A Socket"),
            ("TVS", "iQube", 3.4, "5A Socket"),
            ("Hero Vida", "V1", 3.94, "5A Socket"),
            ("Bajaj", "Chetak", 2.9, "5A Socket"),
        ]
        
        # Assign 1-2 vehicles to demo user
        Vehicle.objects.create(
            user=demo_user,
            name="My Nexon EV",
            brand="Tata",
            model="Nexon EV",
            battery_capacity=40.5,
            connector_type="CCS2",
            current_battery_percentage=45
        )
        Vehicle.objects.create(
            user=demo_user,
            name="City Scooter",
            brand="Ather",
            model="450X",
            battery_capacity=3.7,
            connector_type="Ather Connector",
            current_battery_percentage=35
        )
        
        # Assign vehicles to other users
        for u in users[1:]:
            brand, model, capacity, conn = random.choice(brands)
            Vehicle.objects.create(
                user=u,
                name=f"{u.username}'s {model}",
                brand=brand,
                model=model,
                battery_capacity=capacity,
                connector_type=conn,
                current_battery_percentage=random.randint(15, 95)
            )
            
        self.stdout.write("Created vehicles.")

        # 3. Create 20 Charging Stations in Bengaluru with scooter support
        stations_data = [
            {
                "name": "Tata Power EZ Charge - MG Road Metro",
                "address": "MG Road Metro Station Parking Lot, Bengaluru 560001",
                "latitude": 12.9740,
                "longitude": 77.6101,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 18.50,
                "rating": 4.6,
                "total": 6, "available": 3, "busy": 2, "offline": 1,
                "amenities": "Coffee Shop,WiFi,Restroom,Metro Connectivity",
                "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Fast Charger - Indiranagar 100ft Rd",
                "address": "100 Feet Rd, Hal 2nd Stage, Indiranagar, Bengaluru 560038",
                "latitude": 12.9784,
                "longitude": 77.6408,
                "connector_types": "CCS2,Ather Connector",
                "charging_speed": 120,
                "price_per_kwh": 21.00,
                "rating": 4.8,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Shopping Mall,Restrooms,Cafes",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Kazam Charging Station - Koramangala 4th Block",
                "address": "80 Feet Rd, Koramangala 4th Block, Bengaluru 560034",
                "latitude": 12.9352,
                "longitude": 77.6244,
                "connector_types": "CCS2,Type 2,CHAdeMO,5A Socket",
                "charging_speed": 50,
                "price_per_kwh": 17.00,
                "rating": 4.4,
                "total": 5, "available": 1, "busy": 3, "offline": 1,
                "amenities": "WiFi,Food Court,Lounge",
                "image": "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Jio-bp pulse - HSR Layout 19th Main",
                "address": "19th Main Road, Sector 3, HSR Layout, Bengaluru 560102",
                "latitude": 12.9141,
                "longitude": 77.6413,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 150,
                "price_per_kwh": 22.50,
                "rating": 4.9,
                "total": 8, "available": 5, "busy": 3, "offline": 0,
                "amenities": "Supermarket,Restrooms,EV Lounge,Air Pump",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Electronic City Phase 1",
                "address": "Electronic City Phase 1, Toll Plaza Road, Bengaluru 560100",
                "latitude": 12.8407,
                "longitude": 77.6754,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 30,
                "price_per_kwh": 16.50,
                "rating": 4.2,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Tea Stall,Restroom",
                "image": "https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Ather Grid - Electronic City Phase 2",
                "address": "Infosys Drive, Phase 2, Electronic City, Bengaluru 560100",
                "latitude": 12.8523,
                "longitude": 77.6621,
                "connector_types": "CCS2,Type 2,Ather Connector,5A Socket",
                "charging_speed": 22,
                "price_per_kwh": 15.00,
                "rating": 4.3,
                "total": 3, "available": 0, "busy": 3, "offline": 0,
                "amenities": "WiFi,Food Court,Lounge",
                "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Bolt Share - ITPL Whitefield",
                "address": "ITPL Main Road, Pattandur Agrahara, Whitefield, Bengaluru 560066",
                "latitude": 12.9698,
                "longitude": 77.7500,
                "connector_types": "Type 2,5A Socket",
                "charging_speed": 7.4,
                "price_per_kwh": 12.00,
                "rating": 4.0,
                "total": 10, "available": 8, "busy": 2, "offline": 0,
                "amenities": "Tech Park Cafes,WiFi,Restrooms",
                "image": "https://images.unsplash.com/photo-1620843394593-fb80dfbe77bf?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Shell Recharge - Whitefield Main Road",
                "address": "Shell Petrol Bunk, Whitefield Main Road, Bengaluru 560066",
                "latitude": 12.9715,
                "longitude": 77.7289,
                "connector_types": "CCS2,Ather Connector",
                "charging_speed": 120,
                "price_per_kwh": 20.00,
                "rating": 4.7,
                "total": 4, "available": 1, "busy": 2, "offline": 1,
                "amenities": "Shell Select Store,Cafeteria,Restroom,Air/Water",
                "image": "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Hebbal Flyover Hub",
                "address": "Outer Ring Road, Hebbal, Bengaluru 560024",
                "latitude": 13.0359,
                "longitude": 77.5978,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 18.00,
                "rating": 4.5,
                "total": 6, "available": 4, "busy": 2, "offline": 0,
                "amenities": "Restrooms,Lounge,Food Stall",
                "image": "https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Ather Grid - Malleshwaram Central",
                "address": "15th Cross Rd, Malleshwaram, Bengaluru 560003",
                "latitude": 13.0031,
                "longitude": 77.5695,
                "connector_types": "CCS2,Type 2,Ather Connector,5A Socket",
                "charging_speed": 22,
                "price_per_kwh": 14.50,
                "rating": 4.3,
                "total": 4, "available": 2, "busy": 1, "offline": 1,
                "amenities": "Traditional Restaurants,Restroom",
                "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - Yelahanka Hub",
                "address": "Yelahanka New Town Road, Sector A, Bengaluru 560064",
                "latitude": 13.1007,
                "longitude": 77.5963,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 50,
                "price_per_kwh": 17.50,
                "rating": 4.5,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "Shopping,Cafes,Restroom",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "ChargeMate Hub - KIAL Airport Lounge",
                "address": "P4 Parking, Kempegowda International Airport, Bengaluru 560300",
                "latitude": 13.2007,
                "longitude": 77.7116,
                "connector_types": "CCS2,CHAdeMO,5A Socket",
                "charging_speed": 150,
                "price_per_kwh": 24.00,
                "rating": 4.9,
                "total": 12, "available": 8, "busy": 4, "offline": 0,
                "amenities": "Airport Lounge,Cafe,WiFi,Charging Port,Restrooms",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Relux Electric - Yeshwanthpur Metro",
                "address": "Tumkur Rd, Yeshwanthpur Industrial Area, Bengaluru 560022",
                "latitude": 13.0300,
                "longitude": 77.5500,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 18.00,
                "rating": 4.4,
                "total": 4, "available": 0, "busy": 3, "offline": 1,
                "amenities": "Restrooms,Teastall,Metro Access",
                "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Magenta ChargeGrid - Jayanagar 4th Block",
                "address": "9th Main Road, Jayanagar 4th Block, Bengaluru 560011",
                "latitude": 12.9300,
                "longitude": 77.5800,
                "connector_types": "Type 2,5A Socket",
                "charging_speed": 7.4,
                "price_per_kwh": 12.50,
                "rating": 4.1,
                "total": 6, "available": 4, "busy": 2, "offline": 0,
                "amenities": "Market Shopping,Restrooms,WiFi",
                "image": "https://images.unsplash.com/photo-1620843394593-fb80dfbe77bf?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Majestic Station",
                "address": "KSR Railway Station Parking, Majestic, Bengaluru 560023",
                "latitude": 12.9756,
                "longitude": 77.5728,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 50,
                "price_per_kwh": 17.80,
                "rating": 4.3,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Railway Lounge,Food Stalls,Restrooms",
                "image": "https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Kazam Charging - Bannerghatta Road",
                "address": "Bannerghatta Main Rd, JP Nagar 3rd Phase, Bengaluru 560076",
                "latitude": 12.8950,
                "longitude": 77.6010,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 30,
                "price_per_kwh": 16.00,
                "rating": 4.2,
                "total": 4, "available": 2, "busy": 1, "offline": 1,
                "amenities": "Hypermarket,Restroom,Cafe",
                "image": "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Jio-bp pulse - JP Nagar Hub",
                "address": "2nd Phase, JP Nagar Main Road, Bengaluru 560078",
                "latitude": 12.9100,
                "longitude": 77.5900,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 19.00,
                "rating": 4.6,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "Convenience Store,Restrooms,Tea Shop",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Ather Grid - Rajajinagar Link Road",
                "address": "Link Road, Rajajinagar, Bengaluru 560010",
                "latitude": 12.9900,
                "longitude": 77.5500,
                "connector_types": "Type 2,Ather Connector,5A Socket",
                "charging_speed": 22,
                "price_per_kwh": 14.00,
                "rating": 4.2,
                "total": 3, "available": 2, "busy": 1, "offline": 0,
                "amenities": "WiFi,Cafe,Restroom",
                "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Bolt Share - Bellandur ORR",
                "address": "Outer Ring Road, Bellandur, Bengaluru 560103",
                "latitude": 12.9280,
                "longitude": 77.6780,
                "connector_types": "Type 2,5A Socket",
                "charging_speed": 7.4,
                "price_per_kwh": 11.50,
                "rating": 4.1,
                "total": 8, "available": 5, "busy": 3, "offline": 0,
                "amenities": "Transit Food Court,WiFi,Restrooms",
                "image": "https://images.unsplash.com/photo-1620843394593-fb80dfbe77bf?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - Domlur Flyover Hub",
                "address": "Domlur Flyover Park area, Bengaluru 560071",
                "latitude": 12.9610,
                "longitude": 77.6380,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 20.50,
                "rating": 4.7,
                "total": 6, "available": 4, "busy": 2, "offline": 0,
                "amenities": "Coffee Lounge,WiFi,Restrooms,EV Detailing",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Channapatna Highway Stop",
                "address": "Bengaluru-Mysore Highway, Channapatna, Karnataka 562160",
                "latitude": 12.6518,
                "longitude": 77.2006,
                "connector_types": "CCS2,Type 2,Ather Connector,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 18.00,
                "rating": 4.5,
                "total": 6, "available": 4, "busy": 2, "offline": 0,
                "amenities": "Food Court,Restroom,Play Area",
                "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - Mandya Highway Hub",
                "address": "Bengaluru-Mysore Highway, Mandya, Karnataka 571401",
                "latitude": 12.5242,
                "longitude": 76.8997,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 21.50,
                "rating": 4.7,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "A2B Restaurant,Restrooms,Lounge",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - Mysore Palace Hub",
                "address": "Near Mysore Palace, Devaraja Mohalla, Mysuru, Karnataka 570001",
                "latitude": 12.3052,
                "longitude": 76.6552,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 50,
                "price_per_kwh": 19.00,
                "rating": 4.6,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Cafes,Palace Parking,Restroom",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Ather Grid - Gokulam Mysore",
                "address": "3rd Stage, Gokulam, Mysuru, Karnataka 570002",
                "latitude": 12.3250,
                "longitude": 76.6340,
                "connector_types": "Ather Connector,5A Socket",
                "charging_speed": 22,
                "price_per_kwh": 15.00,
                "rating": 4.4,
                "total": 3, "available": 2, "busy": 1, "offline": 0,
                "amenities": "WiFi,Cafe",
                "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Jio-bp pulse - Tumakuru Highway Hub",
                "address": "Tumkur Bypass road, Tumakuru, Karnataka 572101",
                "latitude": 13.3400,
                "longitude": 77.1000,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 20.00,
                "rating": 4.5,
                "total": 6, "available": 5, "busy": 1, "offline": 0,
                "amenities": "Highway Restaurant,Restroom,Coffee Shop",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Arsikere Highway Stop",
                "address": "Shivamogga Highway, Arsikere, Karnataka 573103",
                "latitude": 13.3100,
                "longitude": 76.2600,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 18.50,
                "rating": 4.3,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "Restrooms,Teastall",
                "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Magenta ChargeGrid - Kadur Stop",
                "address": "Shivamogga Highway, Kadur, Karnataka 577548",
                "latitude": 13.5500,
                "longitude": 76.0100,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 30,
                "price_per_kwh": 17.00,
                "rating": 4.1,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Tea Shop,Restrooms",
                "image": "https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - Shivamogga City Center",
                "address": "Opposite Bus Stand, Shivamogga, Karnataka 577201",
                "latitude": 13.9299,
                "longitude": 75.5681,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 19.50,
                "rating": 4.6,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "Hotel Parking,Restrooms,Lounge",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Ather Grid - Shivamogga Mall",
                "address": "City Mall Road, Shivamogga, Karnataka 577202",
                "latitude": 13.9350,
                "longitude": 75.5720,
                "connector_types": "Ather Connector,5A Socket",
                "charging_speed": 22,
                "price_per_kwh": 15.00,
                "rating": 4.5,
                "total": 3, "available": 2, "busy": 1, "offline": 0,
                "amenities": "Mall Dining,Restrooms",
                "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Connaught Place",
                "address": "E-Block Connaught Place, New Delhi 110001",
                "latitude": 28.6304,
                "longitude": 77.2177,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 22.00,
                "rating": 4.7,
                "total": 6, "available": 4, "busy": 2, "offline": 0,
                "amenities": "Metro Walkway,Restaurants,Lounge",
                "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Jio-bp pulse - Bandra Kurla Complex Hub",
                "address": "G-Block, BKC Bandra East, Mumbai 400051",
                "latitude": 19.0596,
                "longitude": 72.8741,
                "connector_types": "CCS2,Type 2,CHAdeMO,5A Socket",
                "charging_speed": 150,
                "price_per_kwh": 23.50,
                "rating": 4.8,
                "total": 8, "available": 5, "busy": 3, "offline": 0,
                "amenities": "Cafes,EV Waiting Lounge,Restroom",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - T-Nagar Hub Chennai",
                "address": "South Usman Road, T-Nagar, Chennai 600017",
                "latitude": 13.0418,
                "longitude": 80.2341,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 21.00,
                "rating": 4.6,
                "total": 6, "available": 3, "busy": 3, "offline": 0,
                "amenities": "Shopping Area,Restrooms,Cafe",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power EZ Charge - Gachibowli Hyderabad",
                "address": "Outer Ring Road, Gachibowli, Hyderabad 500032",
                "latitude": 17.4401,
                "longitude": 78.3489,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 19.50,
                "rating": 4.5,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "Tech Park Cafeteria,Restrooms",
                "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Relux Charger - Panaji Goa",
                "address": "EDC Patto Plaza, Panaji, Goa 403001",
                "latitude": 15.4909,
                "longitude": 73.8278,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 20.00,
                "rating": 4.4,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Restrooms,Transit Lounge",
                "image": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Zeon Charging - Mangaluru City Hub",
                "address": "Kavoor Main Road, Mangaluru, Karnataka 575015",
                "latitude": 12.9141,
                "longitude": 74.8560,
                "connector_types": "CCS2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 20.00,
                "rating": 4.6,
                "total": 4, "available": 3, "busy": 1, "offline": 0,
                "amenities": "Restrooms,Teastall",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Tata Power - Lulu Mall Kochi",
                "address": "Lulu Mall Parking Area, Edappally, Kochi, Kerala 682024",
                "latitude": 10.0261,
                "longitude": 76.3090,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 120,
                "price_per_kwh": 21.00,
                "rating": 4.7,
                "total": 6, "available": 4, "busy": 2, "offline": 0,
                "amenities": "Lulu Mall Food Court,Shopping,Lounge",
                "image": "https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Jio-bp pulse - Salt Lake Sector 5 Kolkata",
                "address": "Salt Lake Sector V, Bidhannagar, Kolkata 700091",
                "latitude": 22.5735,
                "longitude": 88.4331,
                "connector_types": "CCS2,Type 2,5A Socket",
                "charging_speed": 60,
                "price_per_kwh": 19.00,
                "rating": 4.5,
                "total": 4, "available": 2, "busy": 2, "offline": 0,
                "amenities": "Restrooms,Food Court",
                "image": "https://images.unsplash.com/photo-1593941707882-a5bba1491017?auto=format&fit=crop&w=600&q=80"
            }
        ]

        stations = []
        for s in stations_data:
            station = ChargingStation.objects.create(
                name=s["name"],
                address=s["address"],
                latitude=s["latitude"],
                longitude=s["longitude"],
                connector_types=s["connector_types"],
                charging_speed=s["charging_speed"],
                price_per_kwh=s["price_per_kwh"],
                rating=s["rating"],
                total_chargers=s["total"],
                available_chargers=s["available"],
                busy_chargers=s["busy"],
                offline_chargers=s["offline"],
                amenities=s["amenities"],
                image_url=s["image"],
                is_open=True
            )
            stations.append(station)
            
        self.stdout.write(f"Created {len(stations)} charging stations.")

        # 4. Create Reviews
        reviews_comments = [
            (5, "Absolutely lightning-fast charging! Clean waiting area with delicious coffee."),
            (4, "Great experience, charger worked instantly. The lounge had good Wi-Fi."),
            (5, "Highly recommended. Very friendly staff and clean restroom amenities."),
            (3, "Charging speed was a bit slower than advertised but the location is very convenient."),
            (4, "Easy check-in, plenty of slots available. Reasonable pricing."),
            (2, "One of the chargers was offline, had to wait in a queue for 20 minutes."),
            (5, "Awesome premium facility! It feels like a futuristic charging hub."),
            (4, "Good value, reliable charger. Shell Select shop has excellent snacks.")
        ]
        
        for station in stations:
            num_reviews = random.randint(2, 5)
            for _ in range(num_reviews):
                u = random.choice(users)
                rating, comment = random.choice(reviews_comments)
                rating = max(1, min(5, rating + random.choice([-1, 0, 1])))
                Review.objects.create(
                    station=station,
                    user=u,
                    rating=rating,
                    comment=comment
                )
                
            avg_rating = sum(r.rating for r in station.reviews.all()) / station.reviews.count()
            station.rating = round(avg_rating, 1)
            station.save()
            
        self.stdout.write("Created reviews.")

        # 5. Create some favorites
        for _ in range(25):
            u = random.choice(users)
            s = random.choice(stations)
            try:
                Favorite.objects.create(user=u, station=s)
            except:
                pass
                
        self.stdout.write("Created favorites.")

        # 6. Create some Bookings
        booking_statuses = ['Confirmed', 'Completed', 'Cancelled']
        for i in range(15):
            u = random.choice(users)
            s = random.choice(stations)
            vehicle = u.vehicles.first()
            if not vehicle:
                continue
                
            date = timezone.now().date() + timedelta(days=random.randint(-5, 5))
            time = timezone.now().time()
            
            Booking.objects.create(
                user=u,
                station=s,
                vehicle=vehicle,
                booking_date=date,
                booking_time=time,
                connector_type=vehicle.connector_type,
                status=random.choice(booking_statuses),
                qr_code_data=f"CHARGEMATE-{random.randint(100000, 999999)}"
            )
            
        self.stdout.write("Created bookings.")
        self.stdout.write("Database seeding completed successfully!")
