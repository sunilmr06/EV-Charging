from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView, VehicleViewSet, StationViewSet, BookingViewSet, FavoriteListView, RecommendationView

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'stations', StationViewSet, basename='station')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', UserProfileView.as_view(), name='user_profile'),
    path('favorites/', FavoriteListView.as_view(), name='user_favorites'),
    path('recommend/', RecommendationView.as_view(), name='smart_recommendation'),
    path('', include(router.urls)),
]
