"use client";

import { useEffect, useState } from "react";
import { getToken } from "../../utils/auth";
import { 
  ChevronDown, 
  ChevronUp, 
  Coffee, 
  Utensils, 
  Cookie,
  Check,
  X,
  Eye,
  EyeOff,
  Clock,
  User,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const [orders, setOrders] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [visibleSections, setVisibleSections] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch("/api/admin/today-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const grouped = {
            breakfast: data.filter((o) => o.type === "lunch"),
            lunch: data.filter((o) => o.type === "tea"),
            dinner: data.filter((o) => o.type === "snacks"),
          };
          setOrders(grouped);
        } else {
          console.error("Failed to load orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleToggleSection = (meal) => {
    setVisibleSections((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  const handleConfirmClick = (order) => {
    setSelectedOrder(order);
    setOtpInput("");
    setStatusMsg("");
  };

  const handleOtpSubmit = async () => {
    if (!otpInput) return;

    setIsSubmitting(true);
    const token = getToken();
    
    try {
      const res = await fetch("/api/admin/confirm-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: selectedOrder.order_id, otp: otpInput }),
      });

      const result = await res.json();

      if (res.ok) {
        setStatusMsg("✅ Order marked as served!");
        setOrders((prevOrders) => {
          const newOrders = { ...prevOrders };
          Object.keys(newOrders).forEach((meal) => {
            newOrders[meal] = newOrders[meal].map((order) =>
              order.order_id === selectedOrder.order_id
                ? { ...order, status: "served" }
                : order
            );
          });
          return newOrders;
        });
        setTimeout(() => setSelectedOrder(null), 1000);
      } else {
        setStatusMsg("❌ " + result.message || "Invalid OTP");
      }
    } catch (error) {
      setStatusMsg("❌ Error confirming order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOtpVisibility = (orderId) => {
    setShowOtp(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee className="w-5 h-5" />;
      case 'lunch':
        return <Utensils className="w-5 h-5" />;
      case 'dinner':
        return <Cookie className="w-5 h-5" />;
      default:
        return <Utensils className="w-5 h-5" />;
    }
  };

  const getMealGradient = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return 'from-orange-500 to-red-500';
      case 'lunch':
        return 'from-green-500 to-teal-500';
      case 'dinner':
        return 'from-purple-500 to-indigo-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

  const getTotalOrders = () => {
    return orders.breakfast.length + orders.lunch.length + orders.dinner.length;
  };

  const getServedOrders = () => {
    return [
      ...orders.breakfast,
      ...orders.lunch,
      ...orders.dinner
    ].filter(order => order.status === 'served').length;
  };

  const renderMealSection = (mealType, label) => {
    const ordersList = orders[mealType];
    const servedCount = ordersList.filter(order => order.status === 'served').length;

    return (
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Section Header */}
          <div className={`bg-gradient-to-r ${getMealGradient(mealType)} p-6`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  {getMealIcon(mealType)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{label}</h2>
                  <p className="text-white/80 text-sm">
                    {ordersList.length} orders • {servedCount} served
                  </p>
                </div>
              </div>
              <button
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                onClick={() => handleToggleSection(mealType)}
              >
                <span>{visibleSections[mealType] ? "Hide" : "Show"}</span>
                {visibleSections[mealType] ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Orders List */}
          {visibleSections[mealType] && (
            <div className="p-6">
              {ordersList.length > 0 ? (
                <div className="space-y-4">
                  {ordersList.map((order) => (
                    <div
                      key={order._id}
                      className="bg-gray-50/50 border border-gray-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{order.studentName}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600 font-mono text-sm">
                              {showOtp[order._id] ? order.otp : '••••••'}
                            </span>
                            <button
                              onClick={() => toggleOtpVisibility(order._id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                              {showOtp[order._id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            {order.status === 'served' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              order.status === 'served' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {order.status === 'served' ? 'Served' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          {order.status !== "served" ? (
                            <button
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                              onClick={() => handleConfirmClick(order)}
                            >
                              Confirm Order
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-700 font-semibold">Served</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No orders for {label.toLowerCase()}</p>
                  <p className="text-gray-400 text-sm">Orders will appear here when placed</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  🍽️ Admin Dashboard
                </h1>
                <p className="text-gray-600">Manage today's food orders</p>
              </div>
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{getTotalOrders()}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{getServedOrders()}</div>
                  <div className="text-sm text-gray-500">Served</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{getTotalOrders() - getServedOrders()}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meal Sections */}
        {renderMealSection("breakfast", "Breakfast")}
        {renderMealSection("lunch", "Lunch")}
        {renderMealSection("dinner", "Dinner")}

        {/* OTP Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                    <Hash className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter OTP</h2>
                  <p className="text-gray-600">Confirm order for {selectedOrder.studentName}</p>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-center font-mono text-lg tracking-wider text-black"
                      maxLength="6"
                    />
                  </div>

                  {statusMsg && (
                    <div className={`p-4 rounded-lg ${
                      statusMsg.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <p className="text-center font-medium">{statusMsg}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                      onClick={() => setSelectedOrder(null)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={handleOtpSubmit}
                      disabled={isSubmitting || !otpInput}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Confirming...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Check className="w-5 h-5" />
                          <span>Confirm</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}