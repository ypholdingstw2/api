# backend/orders/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    """訂單序列化器"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    order_type_display = serializers.CharField(source='get_order_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user', 'user_name',
            'symbol', 'order_type', 'order_type_display',
            'quantity', 'price', 'amount',
            'status', 'status_display', 'filled_quantity',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_id', 'amount', 'created_at', 'updated_at', 'user']


class CreateOrderSerializer(serializers.ModelSerializer):
    """建立訂單序列化器"""
    
    class Meta:
        model = Order
        fields = ['symbol', 'order_type', 'quantity', 'price']
    
    def validate_quantity(self, value):
        """驗證數量"""
        if value <= 0:
            raise serializers.ValidationError("數量必須大於0")
        return value
    
    def validate_price(self, value):
        """驗證價格"""
        if value <= 0:
            raise serializers.ValidationError("價格必須大於0")
        return value
    
    def create(self, validated_data):
        """建立訂單時自動關聯當前用戶"""
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    """使用者序列化器"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_staff']


class UserCreateSerializer(serializers.ModelSerializer):
    """註冊使用者序列化器（含密碼寫入）"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "兩次密碼輸入不一致"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """更新使用者資料（不允許修改密碼）"""
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name']