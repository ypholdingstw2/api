# backend/orders/views.py



# backend/orders/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.contrib.auth.models import User
from .models import Order
from .serializers import (
    OrderSerializer, CreateOrderSerializer,
    UserSerializer, UserCreateSerializer, UserUpdateSerializer
)


class OrderViewSet(viewsets.ModelViewSet):
    """訂單視圖集"""
    
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response({
            'success': True,
            'message': '訂單已提交',
            'data': OrderSerializer(order).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != 0:
            return Response({
                'success': False,
                'message': f'訂單狀態為{order.get_status_display()}，無法取消'
            }, status=status.HTTP_400_BAD_REQUEST)
        order.status = 3
        order.save()
        return Response({
            'success': True,
            'message': '訂單已取消',
            'data': OrderSerializer(order).data
        })
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        status_filter = request.query_params.get('status')
        queryset = self.get_queryset()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """使用者管理 ViewSet"""
    
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        elif self.action in ['list', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    def retrieve(self, request, *args, **kwargs):
        if kwargs.get('pk') == 'me':
            return Response(self.get_serializer(request.user).data)
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=False, methods=['get', 'put', 'patch', 'delete'], url_path='me')
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserUpdateSerializer(user, data=request.data, partial=(request.method=='PATCH'))
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(UserSerializer(user).data)
        elif request.method == 'DELETE':
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password2 = request.data.get('new_password2')
        
        if not user.check_password(old_password):
            return Response({'old_password': '舊密碼錯誤'}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != new_password2:
            return Response({'new_password': '兩次新密碼不一致'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({'message': '密碼修改成功'})
    


# from rest_framework import viewsets
# from .models import Order
# from .serializers import OrderSerializer








# from rest_framework import viewsets, status, permissions
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from django.contrib.auth.models import User
# from django.db import transaction
# from .models import Order
# from .serializers import (
#     OrderSerializer, CreateOrderSerializer,
#     UserSerializer, UserCreateSerializer, UserUpdateSerializer
# )

# # ... 原有的 OrderViewSet ...
# class OrderViewSet(viewsets.ModelViewSet):
#     queryset = Order.objects.all()
#     serializer_class = OrderSerializer



# class UserViewSet(viewsets.ModelViewSet):
#     """
#     使用者管理 ViewSet
#     - 註冊：POST /api/users/ (不需認證)
#     - 查詢列表：GET /api/users/ (需管理員權限)
#     - 查詢自己：GET /api/users/me/ (需認證)
#     - 修改自己：PUT/PATCH /api/users/me/ (需認證)
#     - 刪除自己：DELETE /api/users/me/ (需認證)
#     - 查詢特定使用者：GET /api/users/{id}/ (需管理員或本人)
#     - 修改特定使用者：PUT/PATCH /api/users/{id}/ (需管理員)
#     - 刪除特定使用者：DELETE /api/users/{id}/ (需管理員)
#     """
#     queryset = User.objects.all().order_by('-date_joined')
    
#     def get_permissions(self):
#         if self.action == 'create':
#             # 註冊允許任何人
#             permission_classes = [AllowAny]
#         elif self.action in ['list', 'destroy']:
#             # 列表、刪除需要管理員
#             permission_classes = [permissions.IsAdminUser]
#         elif self.action in ['retrieve', 'update', 'partial_update']:
#             # 查詢、修改需判斷是否為本人或管理員
#             permission_classes = [IsAuthenticated]
#         else:
#             permission_classes = [IsAuthenticated]
#         return [permission() for permission in permission_classes]
    
#     def get_serializer_class(self):
#         if self.action == 'create':
#             return UserCreateSerializer
#         elif self.action in ['update', 'partial_update']:
#             return UserUpdateSerializer
#         return UserSerializer
    
#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff:
#             return User.objects.all()
#         # 非管理員只能看到自己
#         return User.objects.filter(id=user.id)
    
#     def retrieve(self, request, *args, **kwargs):
#         # 如果要求查詢自己，使用 /me/ 路徑
#         if kwargs.get('pk') == 'me':
#             return Response(self.get_serializer(request.user).data)
#         return super().retrieve(request, *args, **kwargs)
    
#     @action(detail=False, methods=['get', 'put', 'patch', 'delete'], url_path='me')
#     def me(self, request):
#         """當前使用者的個人資料操作"""
#         user = request.user
#         if request.method == 'GET':
#             serializer = self.get_serializer(user)
#             return Response(serializer.data)
#         elif request.method in ['PUT', 'PATCH']:
#             serializer = UserUpdateSerializer(user, data=request.data, partial=(request.method=='PATCH'))
#             serializer.is_valid(raise_exception=True)
#             serializer.save()
#             return Response(UserSerializer(user).data)
#         elif request.method == 'DELETE':
#             user.delete()
#             return Response(status=status.HTTP_204_NO_CONTENT)
    
#     @action(detail=False, methods=['post'], url_path='change-password')
#     def change_password(self, request):
#         """修改密碼"""
#         user = request.user
#         old_password = request.data.get('old_password')
#         new_password = request.data.get('new_password')
#         new_password2 = request.data.get('new_password2')
        
#         if not user.check_password(old_password):
#             return Response({'old_password': '舊密碼錯誤'}, status=status.HTTP_400_BAD_REQUEST)
#         if new_password != new_password2:
#             return Response({'new_password': '兩次新密碼不一致'}, status=status.HTTP_400_BAD_REQUEST)
        
#         user.set_password(new_password)
#         user.save()
#         return Response({'message': '密碼修改成功'})