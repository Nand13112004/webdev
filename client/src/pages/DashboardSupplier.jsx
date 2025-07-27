import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const DashboardSupplier = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", delivery: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([
    { id: 1, product: "Product A", quantity: 10, buyer: "Buyer 1", address: "Address 1", instructions: "Leave at door", status: "New" },
    { id: 2, product: "Product B", quantity: 5, buyer: "Buyer 2", address: "Address 2", instructions: "Call on arrival", status: "Ongoing" },
  ]);
  const [groupOrders, setGroupOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);

  const [supplierOverviewData, setSupplierOverviewData] = useState({
    totalOrdersThisWeek: 0,
    pendingDeliveries: 0,
    topRatedProduct: null,
    revenueEarned: 0
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
      fetchGroupOrders();
      fetchAcceptedOrders();
      fetchSupplierOverviewData();
      const interval = setInterval(() => {
        fetchSupplierOverviewData();
      }, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Mark orders as read when Orders tab is active
  useEffect(() => {
    if (activeTab === "Orders" && currentUser && groupOrders.length > 0) {
      groupOrders.forEach(order => {
        if (order.status === "ordered") {
          markOrderAsRead(order._id);
        }
      });
    }
  }, [activeTab, groupOrders, currentUser]);

  const getCurrentUser = () => {
    // Get user from localStorage (assuming the token contains user info)
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
        setCurrentUser(user);
        console.log("Current user:", user); // Debug log
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        console.log("No current user, skipping product fetch");
        return;
      }
      const response = await fetch(`/api/products?supplierId=${currentUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      alert("Error fetching products");
    }
  };

  const fetchGroupOrders = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        console.log("No current user, skipping group orders fetch");
        return;
      }
      const response = await fetch(`/api/grouporders/supplier/${currentUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch group orders");
      const data = await response.json();
      setGroupOrders(data);
    } catch (error) {
      console.error(error);
      // Don't show alert for group orders as they might not exist yet
    }
  };

  const fetchAcceptedOrders = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        console.log("No current user, skipping accepted orders fetch");
        return;
      }
      const response = await fetch(`/api/grouporders/accepted/${currentUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch accepted orders");
      const data = await response.json();
      setAcceptedOrders(data);
    } catch (error) {
      console.error(error);
      // Don't show alert for accepted orders as they might not exist yet
    }
  };

  const fetchSupplierOverviewData = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        console.log("No current user, skipping supplier overview fetch");
        return;
      }
      const response = await fetch(`/api/grouporders/supplier-overview/${currentUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch supplier overview data");
      const data = await response.json();
      setSupplierOverviewData(data);
    } catch (error) {
      alert("Please fill all fields to add a product.");
      return;
    }
    if (!currentUser || !currentUser.id) {
      alert("User not authenticated. Please login again.");
      return;
    }
    try {
      const productData = {
        ...newProduct,
        supplierId: currentUser.id
      };
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product");
      }
      const addedProduct = await response.json();
      setProducts([...products, addedProduct]);
      setNewProduct({ name: "", price: "", stock: "", delivery: "" });
    } catch (error) {
      console.error(error);
      alert("Error adding product");
    }
  };

  const saveProduct = async () => {
    if (!editingProduct.name || !editingProduct.price || !editingProduct.stock || !editingProduct.delivery) {
      alert("Please fill all fields to save the product.");
      return;
    }
    try {
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      if (!response.ok) throw new Error("Failed to update product");
      const updatedProduct = await response.json();
      setProducts(products.map(p => (p._id === updatedProduct._id ? updatedProduct : p)));
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      alert("Error updating product");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete product");
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      console.error(error);
      alert("Error deleting product");
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const bulkUpload = () => {
    alert("Bulk upload feature coming soon!");
  };

  const updateOrderStatus = (id, newStatus) => {
    setOrders(orders.map(order => order.id === id ? { ...order, status: newStatus } : order));
  };

  const updateGroupOrderStatus = async (groupId, newStatus) => {
    try {
      const response = await fetch(`/api/grouporders/${groupId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: newStatus,
          supplierId: currentUser.id 
        }),
      });
      if (!response.ok) throw new Error("Failed to update group order status");
      alert(`Group order status updated to ${newStatus}`);
      fetchGroupOrders(); // Refresh the group orders
      fetchAcceptedOrders(); // Refresh accepted orders
    } catch (error) {
      console.error(error);
      alert("Error updating group order status");
    }
  };

  const markOrderAsRead = async (orderId) => {
    try {
      const response = await fetch(`/api/grouporders/${orderId}/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          supplierId: currentUser.id 
        }),
      });
      if (!response.ok) throw new Error("Failed to mark order as read");
      // No alert needed for read status
    } catch (error) {
      console.error(error);
      // Don't show alert for read status as it's not critical
    }
  };

  const renderMainPanel = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Dashboard Overview</h2>
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
            </div>
          </section>
        );
      case "Product Listings":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Product Listings</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price per unit</th>
                  <th>Stock available</th>
                  <th>Delivery options</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>{editingProduct && editingProduct._id === product._id ? (
                      <input 
                        name="name" 
                        value={editingProduct.name} 
                        onChange={handleInputChange}
                        style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                      />
                    ) : (
                      product.name
                    )}</td>
                    <td>{editingProduct && editingProduct._id === product._id ? (
                      <input 
                        name="price" 
                        type="number" 
                        value={editingProduct.price} 
                        onChange={handleInputChange}
                        style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                      />
                    ) : (
                      product.price
                    )}</td>
                    <td>{editingProduct && editingProduct._id === product._id ? (
                      <input 
                        name="stock" 
                        type="number" 
                        value={editingProduct.stock} 
                        onChange={handleInputChange}
                        style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                      />
                    ) : (
                      product.stock
                    )}</td>
                    <td>{editingProduct && editingProduct._id === product._id ? (
                      <input 
                        name="delivery" 
                        value={editingProduct.delivery} 
                        onChange={handleInputChange}
                        style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                      />
                    ) : (
                      product.delivery
                    )}</td>
                    <td>
                      {editingProduct && editingProduct._id === product._id ? (
                        <>
                          <button className="btn-secondary" onClick={saveProduct} style={{ marginRight: "5px" }}>Save</button>
                          <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-secondary" onClick={() => setEditingProduct(product)} style={{ marginRight: "5px" }}>Edit</button>
                          <button className="btn-secondary" onClick={() => deleteProduct(product._id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!editingProduct && (
                  <tr>
                    <td><input 
                      name="name" 
                      value={newProduct.name} 
                      onChange={handleInputChange} 
                      placeholder="Name"
                      style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                    /></td>
                    <td><input 
                      name="price" 
                      type="number" 
                      value={newProduct.price} 
                      onChange={handleInputChange} 
                      placeholder="Price"
                      style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                    /></td>
                    <td><input 
                      name="stock" 
                      type="number" 
                      value={newProduct.stock} 
                      onChange={handleInputChange} 
                      placeholder="Stock"
                      style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                    /></td>
                    <td><input 
                      name="delivery" 
                      value={newProduct.delivery} 
                      onChange={handleInputChange} 
                      placeholder="Delivery"
                      style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px", borderRadius: "4px", width: "100%" }}
                    /></td>
                    <td><button className="btn-secondary" onClick={addProduct}>Add New Product</button></td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="btn-secondary" onClick={bulkUpload} style={{ marginTop: "20px" }}>Bulk upload (CSV or Excel)</button>
          </section>
        );
      case "Orders":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Incoming Orders</h2>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Buyer</th>
                  <th>Address</th>
                  <th>Instructions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Individual Orders */}
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td>{order.buyer}</td>
                    <td>{order.address}</td>
                    <td>{order.instructions}</td>
                    <td>{order.status}</td>
                    <td>
                      {order.status === "New" && <button className="btn-secondary" onClick={() => updateOrderStatus(order.id, "Ongoing")}>✅ Accept order</button>}
                      {order.status === "Ongoing" && <button className="btn-secondary" onClick={() => updateOrderStatus(order.id, "Dispatched")}>🚚 Mark as dispatched</button>}
                      {order.status === "Dispatched" && <button className="btn-secondary" onClick={() => updateOrderStatus(order.id, "Delivered")}>📦 Mark as delivered</button>}
                    </td>
                  </tr>
                ))}
                
                {/* Group Orders */}
                {groupOrders.map((groupOrder) => (
                  <tr key={groupOrder._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#fff" }}>{groupOrder.items}</div>
                        <div style={{ fontSize: "0.8em", color: "#43e97b" }}>(Group Order)</div>
                      </div>
                    </td>
                    <td>{groupOrder.totalQuantity}</td>
                    <td>{groupOrder.creatorId?.name || 'Unknown'}</td>
                    <td>{groupOrder.deliveryArea}</td>
                    <td>
                      <div style={{ fontSize: "0.9em" }}>
                        <div>Participants: {groupOrder.participants.length}</div>
                        <div>Deadline: {new Date(groupOrder.deadline).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "4px", 
                        fontSize: "0.8em",
                        backgroundColor: groupOrder.status === "ordered" ? "#1e90ff" : 
                                      groupOrder.status === "ongoing" ? "#ffa500" : 
                                      groupOrder.status === "completed" ? "#43e97b" : 
                                      groupOrder.status === "active" ? "#28a745" : "#6c757d",
                        color: "#fff"
                      }}>
                        {groupOrder.status.charAt(0).toUpperCase() + groupOrder.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {groupOrder.status === "ordered" && (
                        <button 
                          className="btn-secondary" 
                          onClick={() => updateGroupOrderStatus(groupOrder._id, "ongoing")}
                          style={{ backgroundColor: "#43e97b" }}
                        >
                          ✅ Accept order
                        </button>
                      )}
                      {groupOrder.status === "ongoing" && (
                        <button 
                          className="btn-secondary" 
                          onClick={() => updateGroupOrderStatus(groupOrder._id, "completed")}
                          style={{ backgroundColor: "#1e90ff" }}
                        >
                          🚚 Mark as dispatched
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {orders.length === 0 && groupOrders.length === 0 && (
              <p style={{ color: "#b0b8c9", textAlign: "center", marginTop: "20px" }}>No orders available at the moment.</p>
            )}
          </section>
        );
      case "Accepted Orders":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Accepted Orders</h2>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Buyer</th>
                  <th>Address</th>
                  <th>Instructions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {acceptedOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#fff" }}>{order.items}</div>
                        <div style={{ fontSize: "0.8em", color: "#43e97b" }}>(Group Order)</div>
                      </div>
                    </td>
                    <td>{order.totalQuantity}</td>
                    <td>{order.creatorId?.name || 'Unknown'}</td>
                    <td>{order.deliveryArea}</td>
                    <td>
                      <div style={{ fontSize: "0.9em" }}>
                        <div>Participants: {order.participants.length}</div>
                        <div>Accepted: {new Date(order.acceptedAt).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "4px", 
                        fontSize: "0.8em",
                        backgroundColor: order.status === "ongoing" ? "#ffa500" : 
                                      order.status === "completed" ? "#43e97b" : "#6c757d",
                        color: "#fff"
                      }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {order.status === "ongoing" && (
                        <button 
                          className="btn-secondary" 
                          onClick={() => updateGroupOrderStatus(order._id, "completed")}
                          style={{ backgroundColor: "#1e90ff" }}
                        >
                          🚚 Mark as dispatched
                        </button>
                      )}
                      <button 
                        className="btn-secondary" 
                        onClick={() => markOrderAsRead(order._id)}
                        style={{ backgroundColor: "#6c757d", marginLeft: "5px" }}
                      >
                        📖 Mark as completed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {acceptedOrders.length === 0 && (
              <p style={{ color: "#b0b8c9", textAlign: "center", marginTop: "20px" }}>No accepted orders available.</p>
            )}
          </section>
        );
      case "Ratings":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Ratings & Feedback</h2>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>View recent ratings from vendors</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>View reviews per product or overall</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Respond to feedback (optional)</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Monitor average rating trend (chart)</p>
          </section>
        );
      case "Analytics":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Sales Analytics (Optional)</h2>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Weekly/monthly sales trends</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Top-selling items</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Inventory insights (e.g., low-stock alerts)</p>
          </section>
        );
      case "Settings":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Settings & Profile</h2>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Edit business name, address, phone, email, license/docs, delivery options, languages</p>
          </section>
        );
      case "Help":
        return (
          <section>
            <h2 className="page-title" style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Support / Help</h2>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>FAQ section</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Chat support (future: AI assistant)</p>
            <p style={{ color: "#b0b8c9", marginBottom: "10px" }}>Contact admin (e.g., disputes, help listing products)</p>
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
          <nav className="sidebar" style={{ width: "250px", flexShrink: 0 }}>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
              {[
                "Dashboard", "Product Listings", "Orders", "Accepted Orders", "Ratings", "Analytics", "Settings", "Help"
              ].map((tab) => (
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
          <main style={{ flexGrow: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h1 className="page-title" style={{ margin: 0 , paddingTop: "20px" }}>Supplier Dashboard</h1>
              {currentUser && (
                <div style={{ textAlign: "right" }}>
                 

                  
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

export default DashboardSupplier;


