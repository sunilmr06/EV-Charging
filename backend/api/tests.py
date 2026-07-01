from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Vehicle, ChargingStation, Booking
from api.recommendation import get_smart_recommendation

class ModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testdriver", password="password123")
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name="Test Nexon",
            brand="Tata",
            model="Nexon EV",
            battery_capacity=40.5,
            connector_type="CCS2",
            current_battery_percentage=50
        )
        self.station = ChargingStation.objects.create(
            name="Test Station MG Road",
            address="12 MG Road",
            latitude=12.9740,
            longitude=77.6101,
            connector_types="CCS2,Type 2",
            charging_speed=60.0,
            price_per_kwh=18.0,
            rating=4.5,
            total_chargers=4,
            available_chargers=2,
            busy_chargers=2,
            offline_chargers=0
        )

    def test_vehicle_creation(self):
        self.assertEqual(self.vehicle.brand, "Tata")
        self.assertEqual(self.vehicle.connector_type, "CCS2")

    def test_station_creation(self):
        self.assertEqual(self.station.charging_speed, 60.0)
        self.assertTrue(self.station.is_open)


class RecommendationTestCase(TestCase):
    def setUp(self):
        # Create a compatible station with available chargers
        self.station1 = ChargingStation.objects.create(
            name="Fast Compatible Station",
            address="100ft road Indiranagar",
            latitude=12.9780,
            longitude=77.6400,
            connector_types="CCS2",
            charging_speed=120.0,
            price_per_kwh=20.0,
            rating=4.8,
            total_chargers=4,
            available_chargers=2,
            busy_chargers=2,
            offline_chargers=0
        )
        # Create a slow compatible station
        self.station2 = ChargingStation.objects.create(
            name="Slow Station",
            address="Koramangala",
            latitude=12.9350,
            longitude=77.6200,
            connector_types="CCS2",
            charging_speed=22.0,
            price_per_kwh=15.0,
            rating=4.2,
            total_chargers=2,
            available_chargers=2,
            busy_chargers=0,
            offline_chargers=0
        )
        # Create an incompatible station
        self.station3 = ChargingStation.objects.create(
            name="Incompatible Station",
            address="HSR Layout",
            latitude=12.9100,
            longitude=77.6400,
            connector_types="CHAdeMO",
            charging_speed=50.0,
            price_per_kwh=17.0,
            rating=4.5,
            total_chargers=2,
            available_chargers=2,
            busy_chargers=0,
            offline_chargers=0
        )

    def test_smart_recommendation_dc_fast(self):
        # High battery (45%), current location near MG Road (12.974, 77.61)
        # Should recommend the 120kW fast compatible station over the 22kW slow one
        station, reason, metrics = get_smart_recommendation(
            current_lat=12.9740,
            current_lng=77.6100,
            battery_percentage=45,
            connector_type="CCS2"
        )
        self.assertIsNotNone(station)
        self.assertEqual(station.name, "Fast Compatible Station")
        self.assertIn("120 kW", reason)

    def test_incompatible_connector_filtering(self):
        # Only CHAdeMO compatible station should be returned
        station, reason, metrics = get_smart_recommendation(
            current_lat=12.9740,
            current_lng=77.6100,
            battery_percentage=50,
            connector_type="CHAdeMO"
        )
        self.assertIsNotNone(station)
        self.assertEqual(station.name, "Incompatible Station")
