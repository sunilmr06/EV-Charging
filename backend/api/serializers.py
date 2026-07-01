from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vehicle, ChargingStation, Favorite, Booking, Review

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', validated_data['username']),
            password=validated_data['password']
        )
        return user

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('user',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'station', 'username', 'rating', 'comment', 'created_at')
        read_only_fields = ('user',)

class ChargingStationSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = ChargingStation
        fields = '__all__'

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, station=obj).exists()
        return False

class BookingSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    station_address = serializers.CharField(source='station.address', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.model', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'status', 'qr_code_data')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        import uuid
        validated_data['qr_code_data'] = f"CHARGEMATE-{uuid.uuid4().hex[:8].upper()}"
        
        # Safely decrement available chargers
        station = validated_data['station']
        if station.available_chargers > 0:
            station.available_chargers -= 1
            station.busy_chargers += 1
            station.save()
            
        return super().create(validated_data)
