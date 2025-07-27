import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function ReviewForm({ order, currentUser }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          supplierId: order.supplierId,
          vendorId: currentUser.id,
          rating,
          comment,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to submit review");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (submitted) return <div style={{ color: "lightgreen", marginTop: 8 }}>Review submitted!</div>;

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "10px", background: "#1e293b", padding: 10, borderRadius: 8 }}>
      <label>
        Rating:
        <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ marginLeft: 8 }}>
          <option value={5}>⭐⭐⭐⭐⭐</option>
          <option value={4}>⭐⭐⭐⭐</option>
          <option value={3}>⭐⭐⭐</option>
          <option value={2}>⭐⭐</option>
          <option value={1}>⭐</option>
        </select>
      </label>
      <br />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Write a comment..."
        style={{ width: "100%", marginTop: "5px", borderRadius: 4, padding: 6 }}
      />
      <br />
      <button type="submit" className="btn-primary" style={{ marginTop: "5px" }}>
        Submit Review
      </button>
      {error && <div style={{ color: "#f87171", marginTop: 4 }}>{error}</div>}
    </form>
  );
}

const DashboardVendor = () => {
  const [filters, setFilters] = useState({
    rating: "",
    deliveryTime: "",
    verified: "",
  });

  const [suppliersData, setSuppliersData] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [groupOrderData, setGroupOrderData] = useState({
    items: "",
    totalQuantity: "",
    creatorQuantity: "",
    deadline: "",
    deliveryArea: "",
    maxParticipants: 10,
  });
  const [myGroups, setMyGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinQuantity, setJoinQuantity] = useState("");
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [overviewData, setOverviewData] = useState({
    activeGroupOrders: 0,
    pendingOrders: 0,
    recentDeliveries: 0,
    estimatedSavings: 0,
    recentGroupOrders: []
  });

  const [supplierOverviewData, setSupplierOverviewData] = useState({
    totalOrders: 0,
    totalOrdersThisWeek: 0,
    totalOrdersThisMonth: 0,
    pendingDeliveries: 0,
    revenueEarned: 0,
    topRatedProduct: null
  });

  useEffect(() => {
    fetchSuppliers();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMyGroups();
      fetchAvailableGroups();
      fetchOverviewData();
      fetchSupplierOverviewData();
      const interval = setInterval(() => {
        fetchSupplierOverviewData();
      }, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const user = JSON.parse(jsonPayload);
        console.log("Parsed user from token:", user);
        setCurrentUser(user);
        console.log("Current user set:", user);
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching suppliers...");
      const response = await fetch("/api/suppliers");
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch suppliers");
      }
      const data = await response.json();
      console.log("Suppliers data:", data);
      setSuppliersData(data);
      setFilteredSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      console.log("Fetching my groups for user:", currentUser.id);
      const response = await fetch(`/api/grouporders/my-groups/${currentUser.id}`);
      console.log("My groups response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch my groups");
      }
      const data = await response.json();
      console.log("My groups data:", data);
      setMyGroups(data);
    } catch (error) {
      console.error("Error fetching my groups:", error);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      console.log("Fetching available groups for user:", currentUser.id);
      const response = await fetch(`/api/grouporders/available/${currentUser.id}`);
      console.log("Available groups response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch available groups");
      }
      const data = await response.json();
      console.log("Available groups data:", data);
      console.log("Number of available groups:", data.length);
      setAvailableGroups(data);
    } catch (error) {
      console.error("Error fetching available groups:", error);
    }
  };

  const fetchOverviewData = async () => {
    try {
  useEffect(() => {
    let filtered = suppliersData;

    if (filters.rating) {
      filtered = filtered.filter(
        (s) => s.rating >= parseFloat(filters.rating)
      );
    }
    if (filters.deliveryTime) {
      filtered = filtered.filter(
        (s) => s.deliveryTime === filters.deliveryTime
      );
    }
    if (filters.verified) {
      filtered = filtered.filter(
        (s) => s.verified === (filters.verified === "true")
      );
    }

    setFilteredSuppliers(filtered);
  }, [filters, suppliersData]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    let filtered = suppliersData;

    if (filters.rating) {
      filtered = filtered.filter(
        (s) => s.rating >= parseFloat(filters.rating)
      );
    }
    if (filters.deliveryTime) {
      filtered = filtered.filter(
        (s) => s.deliveryTime === filters.deliveryTime
      );
    }
    if (filters.verified) {
      filtered = filtered.filter(
        (s) => s.verified === (filters.verified === "true")
      );
    }

    setFilteredSuppliers(filtered);
  }, [filters, suppliersData]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleGroupOrderChange = (e) => {
    setGroupOrderData({
      ...groupOrderData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGroupOrderSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.id) {
      alert("Please login to create a group order");
      return;
    }
    try {
      const orderData = {
        ...groupOrderData,
        creatorId: currentUser.id
      };
      console.log("Creating group order with data:", orderData);
      const response = await fetch("/api/grouporders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      console.log("Create group order response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating group order:", errorData);
        throw new Error(errorData.message || "Failed to create group order");
      }
      const result = await response.json();
      console.log("Group order created successfully:", result);
      alert("Group order created successfully");
      setGroupOrderData({
        items: "",
        totalQuantity: "",
        creatorQuantity: "",
        deadline: "",
        deliveryArea: "",
        maxParticipants: 10,
      });
      // Refresh the groups
      fetchMyGroups();
      fetchAvailableGroups();
      fetchOverviewData();
    } catch (error) {
      console.error("Error in handleGroupOrderSubmit:", error);
      alert(error.message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!currentUser || !currentUser.id) {
      alert("Please login to join a group order");
      return;
    }
    if (!joinQuantity || joinQuantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    try {
      const response = await fetch(`/api/grouporders/${groupId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: currentUser.id,
          quantity: parseInt(joinQuantity)
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join group order");
      }
      alert("Successfully joined group order");
      setJoinQuantity("");
      setJoiningGroupId(null);
      // Refresh the groups
      fetchMyGroups();
      fetchAvailableGroups();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCancelGroup = async (groupId) => {
    if (!currentUser || !currentUser.id) {
      alert("Please login to cancel a group order");
      return;
    }
    if (!window.confirm("Are you sure you want to cancel this group order?")) {
      return;
    }
    try {
      const response = await fetch(`/api/grouporders/${groupId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creatorId: currentUser.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel group order");
      }
      alert("Group order cancelled successfully");
      // Refresh the groups
      fetchMyGroups();
      fetchAvailableGroups();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePlaceGroupOrder = async (groupId) => {
    if (!currentUser || !currentUser.id) {
      alert("Please login to place a group order");
      return;
    }
    if (!window.confirm("Are you sure you want to place this group order? This will create an order for suppliers.")) {
      return;
    }
    try {
  const renderMainPanel = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
              Welcome back, {currentUser?.name || currentUser?.email || 'Vendor'}! 👋
            </h2>
            
            {/* Overview Cards */}
            <div className="card-grid" style={{ marginBottom: "30px" }}>
              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      {overviewData.activeGroupOrders}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Active Group Orders</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>📋</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      {overviewData.pendingOrders}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Pending Orders</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>⏳</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      {overviewData.recentDeliveries}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Recent Deliveries</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>🚚</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      ${overviewData.estimatedSavings}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Money Saved This Month 💰</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>💰</div>
                </div>
              </div>
            </div>

            {/* Supplier Overview Cards */}
            <div className="card-grid" style={{ marginBottom: "30px" }}>
              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      {supplierOverviewData.totalOrdersThisWeek}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Total Orders This Week</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>📅</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      {supplierOverviewData.totalOrdersThisMonth}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Total Orders This Month</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>📅</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      {supplierOverviewData.pendingDeliveries}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Pending Deliveries</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>⏳</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem", fontWeight: "bold" }}>
                      ${supplierOverviewData.revenueEarned}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Revenue Earned</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>💵</div>
                </div>
              </div>

              <div className="card-item" style={{ 
                background: "linear-gradient(135deg, #fbc7a4 0%, #f7a1a1 100%)",
                border: "none",
                color: "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                      {supplierOverviewData.topRatedProduct || "N/A"}
                    </h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Top Rated Product</p>
                  </div>
                  <div style={{ fontSize: "2.5rem" }}>⭐</div>
                </div>
              </div>
            </div>

            {/* Recent Group Orders */}
            <div style={{ marginTop: "30px" }}>
              <h3 style={{ color: "#fff", marginBottom: "20px", fontSize: "1.3rem" }}>
                Recent Group Orders
              </h3>
              {overviewData.recentGroupOrders.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px", 
                  backgroundColor: "#1e293b", 
                  borderRadius: "8px",
                  color: "#b0b8c9"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📦</div>
                  <p>No group orders yet. Start creating your first group order!</p>
                </div>
              ) : (
                <div className="card-grid">
                  {overviewData.recentGroupOrders.map((order) => (
                    <div key={order._id} className="card-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                        <h4 style={{ color: "#fff", margin: 0, fontSize: "1.1rem" }}>
                          {order.items}
                        </h4>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: "4px", 
                          fontSize: "0.8em",
                          backgroundColor: order.status === "active" ? "#28a745" : 
                                        order.status === "ordered" ? "#1e90ff" : 
                                        order.status === "ongoing" ? "#ffa500" : 
                                        order.status === "completed" ? "#43e97b" : "#6c757d",
                          color: "#fff"
                        }}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>
                        <strong>Quantity:</strong> {order.totalQuantity} units
                      </p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>
                        <strong>Participants:</strong> {order.participants.length}
                      </p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>
                        <strong>Deadline:</strong> {new Date(order.deadline).toLocaleDateString()}
                      </p>
                      <p style={{ color: "#b0b8c9", marginBottom: "0" }}>
                        <strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
                          fontSize: "0.8em",
                          backgroundColor: order.status === "active" ? "#28a745" : 
                                        order.status === "ordered" ? "#1e90ff" : 
                                        order.status === "ongoing" ? "#ffa500" : 
                                        order.status === "completed" ? "#43e97b" : "#6c757d",
                          color: "#fff"
                        }}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>
                        <strong>Quantity:</strong> {order.totalQuantity} units
                      </p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>
                        <strong>Participants:</strong> {order.participants.length}
                      </p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>
                        <strong>Deadline:</strong> {new Date(order.deadline).toLocaleDateString()}
                      </p>
                      <p style={{ color: "#b0b8c9", marginBottom: "0" }}>
                        <strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      case "Browse Suppliers":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Browse Suppliers</h2>
            <p style={{ color: "#b0b8c9", marginBottom: "20px" }}>List of suppliers nearby or by category (vegetables, spices, packaging, etc.)</p>

            <div className="form-container" style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#fff", marginBottom: "15px" }}>Filters:</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Min Rating:</label>
                <input
                  type="number"
                  step="0.1"
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  placeholder="Enter min rating"
                />
                </div>
                <div className="input-group">
                  <label>Delivery Time:</label>
                <select
                  name="deliveryTime"
                  value={filters.deliveryTime}
                  onChange={handleFilterChange}
                >
                  <option value="">Any</option>
                  <option value="1 day">1 day</option>
                  <option value="2 days">2 days</option>
                  <option value="3 days">3 days</option>
                </select>
                </div>
                <div className="input-group">
                  <label>Verified:</label>
                <select
                  name="verified"
                  value={filters.verified}
                  onChange={handleFilterChange}
                >
                  <option value="">Any</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ color: "#fff", marginBottom: "15px" }}>Supplier Profiles:</h3>
              {loading ? (
                <div className="loading-container">
                <p>Loading suppliers...</p>
                </div>
              ) : error ? (
                <div className="error-container">
                <p>Error loading suppliers: {error}</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <p style={{ textAlign: "center", color: "#b0b8c9" }}>No suppliers found. Please check back later.</p>
              ) : (
                <div className="card-grid">
                  {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="card-item">
                      <h4 style={{ color: "#fff", marginBottom: "10px" }}>{supplier.name} {supplier.verified ? "(Verified)" : ""}</h4>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>Category: {supplier.category}</p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>Rating: {supplier.rating}</p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>Delivery Time: {supplier.deliveryTime}</p>
                      <p style={{ color: "#b0b8c9", marginBottom: "5px" }}>Price List: {supplier.priceList}</p>
                      <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Contact: {supplier.contact}</p>
                    
                    {supplier.products && supplier.products.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                          <h5 style={{ color: "#fff", marginBottom: "10px" }}>Products:</h5>
                          <table className="data-table">
                          <thead>
                              <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Delivery</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplier.products.map((product) => (
                              <tr key={product._id}>
                                  <td>{product.name}</td>
                                  <td>${product.price}</td>
                                  <td>{product.stock}</td>
                                  <td>{product.delivery}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                      <button className="btn-secondary" onClick={() => alert(`Added ${supplier.name} to favorites`)}>Add to favorites</button>
                    </div>
                  ))}
                  </div>
              )}
            </div>
          </section>
        );
      case "Group Orders":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Group Orders</h2>
            
            {/* Create New Group Order */}
            <div className="card-item" style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#fff", marginBottom: "20px" }}>Create New Group Order:</h3>
              <form className="form-container" onSubmit={handleGroupOrderSubmit}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Item(s):</label>
                    <input
                      type="text"
                      name="items"
                      value={groupOrderData.items}
                      onChange={handleGroupOrderChange}
                      placeholder="Enter items"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Total Quantity (Bulk):</label>
                    <input
                      type="number"
                      name="totalQuantity"
                      value={groupOrderData.totalQuantity}
                      onChange={handleGroupOrderChange}
                      placeholder="Total quantity to buy"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Your Quantity:</label>
                    <input
                      type="number"
                      name="creatorQuantity"
                      value={groupOrderData.creatorQuantity}
                      onChange={handleGroupOrderChange}
                      placeholder="How much you want"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Deadline:</label>
                    <input
                      type="date"
                      name="deadline"
                      value={groupOrderData.deadline}
                      onChange={handleGroupOrderChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Max Participants:</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      value={groupOrderData.maxParticipants}
                      onChange={handleGroupOrderChange}
                      min="2"
                      max="20"
                    />
                  </div>
                  <div className="input-group">
                    <label>Delivery Area:</label>
                    <input
                      type="text"
                      name="deliveryArea"
                      value={groupOrderData.deliveryArea}
                      onChange={handleGroupOrderChange}
                      placeholder="Enter delivery area"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary">
                  Create New Group Order
                </button>
              </form>
            </div>

            {/* My Groups */}
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#fff", marginBottom: "20px" }}>My Groups (Created & Joined):</h3>
              {myGroups.length === 0 ? (
                <p style={{ color: "#b0b8c9", textAlign: "center" }}>You haven't created or joined any group orders yet.</p>
              ) : (
                <div className="card-grid">
                  {myGroups.map((group) => {
                    const isCreator = group.creatorId?._id === currentUser?.id || group.creatorId === currentUser?.id;
                    return (
                      <div key={group._id} className="card-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <h4 style={{ color: "#fff", margin: 0 }}>
                            Items: {group.items}
                            <span style={{ fontSize: "0.8em", color: isCreator ? "#1e90ff" : "#43e97b", marginLeft: "10px" }}>
                              {isCreator ? "(Created by you)" : "(Joined)"}
                            </span>
                          </h4>
                          {isCreator && (
                            <button 
                              onClick={() => handleCancelGroup(group._id)}
                              className="btn-secondary"
                              style={{ backgroundColor: "#dc3545" }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                        {!isCreator && <p style={{ color: "#b0b8c9", marginBottom: "10px" }}><strong>Created by:</strong> {group.creatorId?.name || 'Unknown'}</p>}
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Total Quantity:</strong> {group.totalQuantity}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Allocated:</strong> {group.participants.reduce((sum, p) => sum + p.quantity, 0)}/{group.totalQuantity}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Deadline:</strong> {new Date(group.deadline).toLocaleDateString()}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Delivery Area:</strong> {group.deliveryArea}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Participants:</strong> {group.participants.length}/{group.maxParticipants}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "10px" }}><strong>Status:</strong> {group.status}</p>
                        
                        {/* Show Place Order button when quantity is fulfilled and user is creator */}
                        {isCreator && group.participants.reduce((sum, p) => sum + p.quantity, 0) >= group.totalQuantity && group.status === 'active' && (
                          <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #43e97b" }}>
                            <p style={{ color: "#43e97b", marginBottom: "10px", fontWeight: "bold" }}>✅ Group quantity fulfilled!</p>
                            <button 
                              onClick={() => handlePlaceGroupOrder(group._id)}
                              className="btn-primary"
                              style={{ width: "100%" }}
                            >
                              Place Order Now
                            </button>
                          </div>
                        )}
                        
                        {/* Show status when order is placed */}
                        {group.status === 'ordered' && (
                          <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #1e90ff" }}>
                            <p style={{ color: "#1e90ff", marginBottom: "10px", fontWeight: "bold" }}>📦 Order Placed!</p>
                            <p style={{ color: "#b0b8c9", fontSize: "0.9em" }}>Suppliers can now see this order</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Groups */}
            <div>
              <h3 style={{ color: "#fff", marginBottom: "20px" }}>Available Groups to Join:</h3>
              {availableGroups.length === 0 ? (
                <p style={{ color: "#b0b8c9", textAlign: "center" }}>No group orders available to join at the moment.</p>
              ) : (
                <div className="card-grid">
                  {availableGroups.map((group) => {
                    const totalAllocated = group.participants.reduce((sum, p) => sum + p.quantity, 0);
                    const remainingQuantity = group.totalQuantity - totalAllocated;
                    return (
                      <div key={group._id} className="card-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <h4 style={{ color: "#fff", margin: 0 }}>Items: {group.items}</h4>
                          {joiningGroupId === group._id ? (
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <input
                                type="number"
                                value={joinQuantity}
                                onChange={(e) => setJoinQuantity(e.target.value)}
                                placeholder="Quantity"
                                min="1"
                                max={remainingQuantity}
                                style={{ 
                                  width: "80px", 
                                  padding: "8px", 
                                  background: "#1e293b", 
                                  color: "#fff", 
                                  border: "none", 
                                  borderRadius: "4px" 
                                }}
                              />
                              <button 
                                onClick={() => handleJoinGroup(group._id)}
                                className="btn-secondary"
                                style={{ backgroundColor: "#43e97b" }}
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => {
                                  setJoiningGroupId(null);
                                  setJoinQuantity("");
                                }}
                                className="btn-secondary"
                                style={{ backgroundColor: "#6c757d" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setJoiningGroupId(group._id)}
                              className="btn-secondary"
                              style={{ backgroundColor: "#43e97b" }}
                            >
                              Join
                            </button>
                          )}
                        </div>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Created by:</strong> {group.creatorId?.name || 'Unknown'}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Total Quantity:</strong> {group.totalQuantity}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Available:</strong> {remainingQuantity} units</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Deadline:</strong> {new Date(group.deadline).toLocaleDateString()}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Delivery Area:</strong> {group.deliveryArea}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "5px" }}><strong>Participants:</strong> {group.participants.length}/{group.maxParticipants}</p>
                        <p style={{ color: "#b0b8c9", marginBottom: "10px" }}><strong>Status:</strong> {group.status}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      case "My Orders":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>My Orders</h2>
            {myGroups.length === 0 ? (
              <p style={{ color: "#b0b8c9" }}>No orders found.</p>
            ) : (
              <div>
                {myGroups.map(order => {
                  // Find this user's quantity in participants
                  let userQuantity = null;
                  if (order.participants && currentUser) {
                    const participant = order.participants.find(p => (p.userId._id || p.userId) === currentUser.id);
                    userQuantity = participant ? participant.quantity : null;
                  }
                  return (
                    <div key={order._id} style={{ background: "#222", margin: "10px 0", padding: "15px", borderRadius: "8px" }}>
                      <div><b>Item:</b> {order.items}</div>
                      <div><b>Quantity:</b> {userQuantity !== null ? userQuantity : "-"}</div>
                      <div><b>Supplier:</b> {order.supplierId?.name || order.supplierId?.email || order.supplierId || "-"}</div>
                      <div><b>Date:</b> {order.createdAt ? new Date(order.createdAt).toLocaleString() : (order.deadline ? new Date(order.deadline).toLocaleString() : "-")}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      case "Reviews":
        // Filter completed orders with a supplier
        const completedOrdersWithSupplier = myGroups.filter(
          order => order.status === "completed" && order.supplierId
        );

        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Reviews & Ratings</h2>
            {completedOrdersWithSupplier.length === 0 ? (
              <p style={{ color: "#b0b8c9" }}>No completed orders to review.</p>
            ) : (
              <div>
                {completedOrdersWithSupplier.map(order => (
                  <div key={order._id} style={{ background: "#222", margin: "10px 0", padding: "15px", borderRadius: "8px" }}>
                    <div><b>Order:</b> {order.items}</div>
                    <div><b>Supplier:</b> {order.supplierId.name || order.supplierId.email || order.supplierId}</div>
                    <div><b>Completed on:</b> {new Date(order.updatedAt || order.deadline).toLocaleString()}</div>
                    {/* Show review form */}
                    <ReviewForm order={order} currentUser={currentUser} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      case "Settings":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Settings</h2>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Settings options here</p>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header userName={currentUser?.name || currentUser?.email} onLogout={handleLogout} />
      <div style={{ minHeight: '100vh', width: '100vw', background: 'radial-gradient(circle at 70% 20%, #1e90ff 0%, #0a1833 100%)', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', margin: 0, padding: 0, overflowX: 'hidden' }}>
        <div style={{ width: '100vw', height: '100vh', background: '#101828', color: '#fff', boxSizing: 'border-box', padding: 0, minHeight: '100vh', display: 'flex', gap: 0, margin: 0, borderRadius: 0, boxShadow: 'none', paddingBottom: '60px' }}>
          <button 
            onClick={toggleSidebar} 
            className="btn-secondary"
            style={{ marginBottom: "20px", alignSelf: "flex-start" }}
          >
        {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      </button>

      {sidebarOpen && (
            <nav className="sidebar" style={{ width: "250px", flexShrink: 0 }}>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {["Overview", "Browse Suppliers", "Group Orders", "My Orders", "Reviews", "Settings"].map((tab) => (
              <li
                key={tab}
                    className={`sidebar-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </nav>
      )}

          <main style={{ flexGrow: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h1 className="page-title" style={{ margin: 0 }}>Vendor Dashboard</h1>
          {currentUser && (
            <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>
                Welcome, {currentUser.name || currentUser.email || "User"}!
              </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#b0b8c9" }}>
                Role: {currentUser.role}
              </p>
              <button 
                onClick={handleLogout}
                    className="btn-secondary"
                style={{ 
                  marginTop: "0.5rem", 
                      backgroundColor: "#dc3545"
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
        {renderMainPanel()}
      </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DashboardVendor;
