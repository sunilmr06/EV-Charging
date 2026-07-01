from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.db import IntegrityError
from .models import Vehicle, ChargingStation, Favorite, Booking, Review
from .serializers import UserSerializer, VehicleSerializer, ChargingStationSerializer, BookingSerializer, ReviewSerializer
from .recommendation import get_smart_recommendation, haversine_distance

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response({
                    "message": "User registered successfully",
                    "user": UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({"error": "Username or email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user)

class StationViewSet(viewsets.ModelViewSet):
    serializer_class = ChargingStationSerializer
    queryset = ChargingStation.objects.all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        station = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, station=station)
        if not created:
            favorite.delete()
            return Response({"status": "unfavorited", "is_favorite": False})
        return Response({"status": "favorited", "is_favorite": True})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        station = self.get_object()
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        
        if not rating:
            return Response({"error": "Rating is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        review = Review.objects.create(
            station=station,
            user=request.user,
            rating=int(rating),
            comment=comment
        )
        
        # Update station aggregate rating
        all_reviews = station.reviews.all()
        avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
        station.rating = round(avg_rating, 1)
        station.save()
        
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class FavoriteListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user)
        stations = [fav.station for fav in favorites]
        serializer = ChargingStationSerializer(stations, many=True, context={'request': request})
        return Response(serializer.data)

class RecommendationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        dest_lat = request.query_params.get('dest_lat')
        dest_lng = request.query_params.get('dest_lng')
        battery_percentage = request.query_params.get('battery_percentage', 100)
        vehicle_id = request.query_params.get('vehicle_id')

        if not lat or not lng:
            return Response({"error": "Current latitude and longitude are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            current_lat = float(lat)
            current_lng = float(lng)
            battery_pct = int(battery_percentage)
        except ValueError:
            return Response({"error": "Invalid numeric formats for coordinates or battery"}, status=status.HTTP_400_BAD_REQUEST)

        # Parse destination coordinates if present
        d_lat = None
        d_lng = None
        if dest_lat and dest_lng:
            try:
                d_lat = float(dest_lat)
                d_lng = float(dest_lng)
            except ValueError:
                pass

        # Resolve vehicle details
        connector_type = None
        battery_capacity = 40.0 # default capacity in kWh
        vehicle_name = "EV Vehicle"
        
        if vehicle_id:
            try:
                # If authenticated, try to fetch user's vehicle
                if request.user.is_authenticated:
                    vehicle = Vehicle.objects.get(id=vehicle_id, user=request.user)
                else:
                    vehicle = Vehicle.objects.get(id=vehicle_id)
                connector_type = vehicle.connector_type
                battery_capacity = vehicle.battery_capacity
                vehicle_name = f"{vehicle.brand} {vehicle.model}"
            except Vehicle.DoesNotExist:
                pass

        # If connector_type is still None, grab the first one or default
        if not connector_type:
            connector_type = request.query_params.get('connector_type', 'CCS2')

        # Run recommendation engine
        station, reason, metrics = get_smart_recommendation(
            current_lat=current_lat,
            current_lng=current_lng,
            dest_lat=d_lat,
            dest_lng=d_lng,
            battery_percentage=battery_pct,
            connector_type=connector_type
        )

        if not station:
            return Response({"error": reason}, status=status.HTTP_404_NOT_FOUND)

        # Calculate trip details
        dist_to_station = metrics["distance_to_station"]
        
        # Energy calculations (assuming 5 km per kWh standard EV efficiency)
        efficiency = 5.0 # km/kWh
        energy_used = dist_to_station / efficiency
        percentage_used = (energy_used / battery_capacity) * 100
        battery_on_arrival = max(0, int(battery_pct - percentage_used))

        # Charging calculations (to 90% capacity)
        target_percentage = 90
        charging_time_mins = 0
        if battery_on_arrival < target_percentage:
            energy_needed = ((target_percentage - battery_on_arrival) / 100.0) * battery_capacity
            # charging time in hours = energy / speed
            # charging time in mins = (energy / speed) * 60
            charging_time_mins = int((energy_needed / station.charging_speed) * 60)
            # Add 5 mins overhead for DC charger startup/handshake
            if station.charging_speed >= 50:
                charging_time_mins += 5

        serialized_station = ChargingStationSerializer(station, context={'request': request}).data

        return Response({
            "station": serialized_station,
            "reason": reason,
            "metrics": {
                "distance_to_station_km": round(dist_to_station, 2),
                "detour_distance_km": round(metrics["detour_distance"], 2),
                "battery_on_arrival_pct": battery_on_arrival,
                "estimated_charging_time_mins": charging_time_mins,
                "connector_type": connector_type,
                "vehicle_name": vehicle_name
            }
        })
