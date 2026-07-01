from django.db import models
from django.contrib.auth.models import User

class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    battery_capacity = models.FloatField(help_text="Battery capacity in kWh")
    connector_type = models.CharField(max_length=50, help_text="e.g., CCS2, Type 2, CHAdeMO")
    current_battery_percentage = models.IntegerField(default=100)
    
    def __str__(self):
        return f"{self.brand} {self.model} ({self.name})"

class ChargingStation(models.Model):
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    connector_types = models.CharField(max_length=200, help_text="Comma-separated connector types, e.g. CCS2,Type 2")
    charging_speed = models.FloatField(help_text="Charging speed in kW")
    price_per_kwh = models.DecimalField(max_digits=6, decimal_places=2)
    rating = models.FloatField(default=4.5)
    total_chargers = models.IntegerField()
    available_chargers = models.IntegerField()
    busy_chargers = models.IntegerField()
    offline_chargers = models.IntegerField()
    is_open = models.BooleanField(default=True)
    amenities = models.CharField(max_length=255, default="WiFi,Restroom", help_text="Comma-separated amenities")
    image_url = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    station = models.ForeignKey(ChargingStation, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'station')

    def __str__(self):
        return f"{self.user.username} - {self.station.name}"

class Booking(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    station = models.ForeignKey(ChargingStation, on_delete=models.CASCADE, related_name='bookings')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateField()
    booking_time = models.TimeField()
    connector_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Confirmed')
    qr_code_data = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} at {self.station.name} on {self.booking_date}"

class Review(models.Model):
    station = models.ForeignKey(ChargingStation, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.station.name}"
